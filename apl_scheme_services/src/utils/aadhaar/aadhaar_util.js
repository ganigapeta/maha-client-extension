

const crypto = require('crypto');

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

function encrypt(plainText, pwd) {
    const { key, iv } = getKeyAndIV(pwd);
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    const plainBytes = Buffer.from(plainText, 'utf8');

    const encrypted = Buffer.concat([cipher.update(plainBytes), cipher.final()]);
    const base64Step1 = encrypted.toString('base64');
    const base64Step2 = Buffer.from(base64Step1, 'utf8').toString('base64');
    return base64Step2;
}

function decrypt(toBeDecrypted, pwd) {
    const { key, iv } = getKeyAndIV(pwd);

    // Reverse the double base64 encoding
    const step1 = Buffer.from(toBeDecrypted, 'base64').toString('utf8');

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    const buffer = Buffer.from(step1, 'base64');

    const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
    return decrypted.toString('utf8');
}

// Example usage
const password = process.env.DB_SALT_KEY || '';
const plainText = 'L2h2RVRFdVEza0xHQXhQR0oyVWJRdz09';

const encrypted = encrypt(plainText, password);
console.log('Encrypted:', encrypted);


const decrypted = decrypt(encrypted, password);
console.log('Decrypted:', decrypted);