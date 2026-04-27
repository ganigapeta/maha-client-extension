/**
 * Aadhaar Migration Script
 * 
 * This script decrypts the uid column from APL_DATA table,
 * masks the Aadhaar number (showing only last 4 digits),
 * and stores it in the masked_aadhaar_no column.
 * 
 * Usage: node apl_scheme_services/src/utils/aadhaar/aadhaar_db_script.js
 */

const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

// --- Configuration ---
const SALT_KEY = process.env.DB_SALT_KEY || '';
const BATCH_SIZE = 100; // Process 100 records at a time

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'apl_scheme',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'apl_password',
});

// Get schema and table name from environment
const DB_SCHEMA = process.env.DB_SCHEMA || 'apl';
const TABLE_APL_DATA = process.env.TABLE_APL_AADHAAR_MIGRATE || '';
const TABLE_NAME = `${DB_SCHEMA}.${TABLE_APL_DATA}`;

// --- Decryption Logic (from aadhaar_util.js) ---
function getMd5Hash(input) {
  return crypto.createHash('md5').update(Buffer.from(input, 'binary')).digest('hex');
}

function computeSha256Hash(rawData) {
  const hash = crypto.createHash('sha256').update(rawData, 'utf8').digest();
  return hash.slice(0, 16); // Resize to 16 bytes
}

function getKeyAndIV(pwd) {
  const key = computeSha256Hash(getMd5Hash(pwd));

  // IV: UTF8 bytes of pwd, resized to 16 bytes (truncate or zero-pad)
  const ivFull = Buffer.from(pwd, 'utf8');
  const iv = Buffer.alloc(16, 0);
  ivFull.copy(iv, 0, 0, Math.min(ivFull.length, 16));

  return { key, iv };
}

function decrypt(toBeDecrypted, pwd) {
  try {
    //console.log(toBeDecrypted, pwd)
    //console.log(`🔐 Decrypting value: ${toBeDecrypted ? '***' + toBeDecrypted.slice(-4) : 'NULL/EMPTY'}`);
    const { key, iv } = getKeyAndIV(pwd);

    // Reverse the double base64 encoding
    const step1 = Buffer.from(toBeDecrypted, 'base64').toString('utf8');

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    const buffer = Buffer.from(step1, 'base64');

    const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error(`Decryption error: ${err.message}`);
    return null; // Return null for corrupted/invalid encrypted values
  }
}

// --- Masking Logic ---
function maskAadhaar(aadhaarNumber) {
  if (!aadhaarNumber || aadhaarNumber.length < 4) {
    return aadhaarNumber;
  }
  // Show only last 4 digits: XXXX-XXXX-1234
  const last4 = aadhaarNumber.slice(-4);
  const masked = 'X'.repeat(aadhaarNumber.length - 4) + last4;
  return masked;
}

// --- Batch Processing ---
async function processBatch(client, offset, batchSize) {
  // Fetch a batch of rows where masked column is not yet filled
  const { rows } = await client.query(
    `SELECT member_id, encrypt_uid as uid 
     FROM ${TABLE_NAME}
     WHERE 
     encrypt_uid IS NOT NULL
     AND (masked_aadhaar_no IS NULL OR masked_aadhaar_no = '')
     --AND member_id IS NOT NULL and member_id = '27200247281602'
     ORDER BY member_id 
     LIMIT $1 OFFSET $2`,
    [batchSize, offset]
  );

  if (rows.length === 0) {
    return { processed: 0, success: 0, failed: 0 };
  }

  console.log(`  Processing batch at offset ${offset}: ${rows.length} rows`);

  let successCount = 0;
  let failCount = 0;

  for (const row of rows) {
    try {
      // Decrypt the uid
      const decrypted = decrypt(row.uid, SALT_KEY);

      if (decrypted === null || decrypted === '') {
        console.warn(`  ⚠️  member_id ${row.member_id}: decryption failed or empty result`);
        failCount++;
        continue;
      }

      // Mask the Aadhaar number
      const masked = maskAadhaar(decrypted);

      // Update the masked_aadhaar_no column
      await client.query(
        `UPDATE ${TABLE_NAME} SET masked_aadhaar_no = $1 WHERE member_id = $2`,
        //`UPDATE ${TABLE_NAME} SET remarks = $1 WHERE member_id = $2`,

        [masked, row.member_id]
      );

      successCount++;
      
      // Log progress every 10 records
      if (successCount % 10 === 0) {
        console.log(`  ✓ Processed ${successCount} records...`);
      }
    } catch (err) {
      console.error(`  ❌ Error processing member_id ${row.member_id}:`, err.message);
      failCount++;
    }
  }

  console.log(`  Batch complete: ✅ ${successCount} updated, ⚠️ ${failCount} failed`);
  return { processed: rows.length, success: successCount, failed: failCount };
}

// --- Main Migration Function ---
async function migrateAadhaarData() {
  const client = await pool.connect();
  let offset = 0;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  console.log('🚀 Starting Aadhaar decryption and masking migration...\n');
  console.log(`📋 Configuration:`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   Table: ${TABLE_NAME}`);
  console.log(`   Salt Key: ${SALT_KEY ? '***' + SALT_KEY.slice(-4) : 'NOT SET'}`);
  console.log(`   Batch Size: ${BATCH_SIZE}`);
  console.log('');

  try {
   

    // Get total count to process
    const countResult = await client.query(
      `SELECT COUNT(*) as total 
       FROM ${TABLE_NAME}
       WHERE encrypt_uid IS NOT NULL
       -- AND member_id = '27200247281602' 
       AND (masked_aadhaar_no IS NULL OR masked_aadhaar_no = '')`
    );

    // const countResult = await client.query(
    //   `SELECT COUNT(*) as total 
    //    FROM ${TABLE_NAME}
    //    WHERE member_id = '27200247281602'
    //    AND (remarks IS NULL OR remarks ilike 'L%')`
    // );
    const totalRecords = parseInt(countResult.rows[0].total);
    console.log(`📊 Total records to process: ${totalRecords}\n`);

    if (totalRecords === 0) {
      console.log('✅ No records to process. All done!');
      return;
    }

    // Process in batches
    while (totalProcessed < totalRecords) {
      const result = await processBatch(client, offset, BATCH_SIZE);
      
      if (result.processed === 0) {
        break;
      }

      totalProcessed += result.processed;
      totalSuccess += result.success;
      totalFailed += result.failed;
      offset += BATCH_SIZE;

      console.log(`  📈 Progress: ${totalProcessed}/${totalRecords} (${Math.round(totalProcessed/totalRecords*100)}%)\n`);
    }

    console.log('═══════════════════════════════════════════');
    console.log('✅ Migration Complete!');
    console.log('═══════════════════════════════════════════');
    console.log(`Total Processed: ${totalProcessed}`);
    console.log(`Successfully Updated: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log('═══════════════════════════════════════════');

  } catch (err) {
    console.error('\n❌ Fatal error during migration:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// --- Run the migration ---
if (require.main === module) {
  migrateAadhaarData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Script failed:', err);
      process.exit(1);
    });
}

module.exports = { migrateAadhaarData, decrypt, maskAadhaar };
