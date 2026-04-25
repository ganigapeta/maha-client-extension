const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class APLBillService {
  /**
   * Get all WIP records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { 
        page = 1, limit = 10, search = '', isActive, wf_status, fy, mm,
        dfsoCode, afsoCode, fpsCode, distCode, sortBy = 'created_at', sortOrder = 'DESC' 
      } = queryParams;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add search condition
      if (search) {
        const searchColumns = [
          'member_name', 'hof_name', 'rc_no::text', 'member_id::text', 
          'uid', 'dist_name', 'fps_name'
        ];
        const searchQuery = buildSearchQuery(search, searchColumns);
        if (searchQuery.condition) {
          conditions.push(searchQuery.condition);
          searchQuery.params.forEach(p => params.push(p));
          paramIndex += searchQuery.params.length;
        }
      }

      // Add status filter
      if (wf_status) {
        conditions.push(`wf_status = $${paramIndex}`);
        params.push(wf_status);
        paramIndex++;
      }

      // Add DFSO filter
      if (dfsoCode) {
        conditions.push(`dfso_code = $${paramIndex}`);
        params.push(dfsoCode);
        paramIndex++;
      }

      // Add AFSO filter
      if (afsoCode) {
        conditions.push(`afso_code = $${paramIndex}`);
        params.push(afsoCode);
        paramIndex++;
      }

      // Add FPS filter
      if (fpsCode) {
        conditions.push(`fps_code = $${paramIndex}`);
        params.push(fpsCode);
        paramIndex++;
      }

      // Add District filter
      if (distCode) {
        conditions.push(`dist_code = $${paramIndex}`);
        params.push(distCode);
        paramIndex++;
      }

      // Add Finanacial Year filter
      if (fy) {
        conditions.push(`fy = $${paramIndex}`);
        params.push(fy);
        paramIndex++;
      }

      // Add Month filter
      if (mm) {
        conditions.push(`mm = $${paramIndex}`);
        params.push(mm);
        paramIndex++;
      }


      // Add active filter
      if (isActive !== undefined) {
        const activeFilter = buildActiveFilter(isActive);
        if (activeFilter.condition) {
          conditions.push(activeFilter.condition.replace('$1', `$${paramIndex}`));
          params.push(...activeFilter.params);
          paramIndex++;
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM ${tables.APL_WIP} ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data with JOIN to t_apl_data for additional member information
      const orderByClause = buildOrderBy(sortBy, sortOrder);
      const dataQuery = `
        SELECT 
          wip.*,
          data.dist_name,
          data.dfso_name,
          data.afso_name,
          data.member_name,
          data.gender,
          data.relation_name,
          data.member_dob,
          data.uid,
          data.demo_auth,
          data.ekyc
        FROM ${tables.APL_WIP} wip
        LEFT JOIN ${tables.APL_DATA} data ON wip.member_id = data.member_id
        ${whereClause.replace('wf_status', 'wip.wf_status').replace('dfso_code', 'wip.dfso_code').replace('afso_code', 'wip.afso_code').replace('fps_code', 'wip.fps_code').replace('dist_code', 'wip.dist_code').replace('is_active', 'wip.is_active')}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const dataParams = [...params, pagination.query.limit, pagination.query.offset];
      const result = await db.query(dataQuery, dataParams);

      return {
        data: result.rows,
        pagination: pagination.metadata
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get WIP record by ID
   */
  async getById(id) {
    try {
      const query = `SELECT * FROM ${tables.APL_WIP} WHERE id = $1`;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk insert WIP records
   */
  async bulkInsert(wipDataArray, userId = 1) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertedRecords = [];
      
      for (const wipData of wipDataArray) {
        const query = `
          INSERT INTO ${tables.APL_WIP} (
            dist_code, dfso_code, afso_code,
            fps_code, fps_name, rc_no, hof_name, member_id,
            wf_status,
            created_by, is_active,
            amount,
            is_disbursement_account,
            fy,
            mm,
            member_count,
            is_aadhaar_linked_account 

          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
            , $12, $13, $14, $15, $16, $17
          )
          RETURNING *
        `;

        const params = [
          wipData.dist_code,
          wipData.dfso_code,
          wipData.afso_code,
          wipData.fps_code,
          wipData.fps_name,
          wipData.rc_no,
          wipData.hof_name,
          wipData.member_id,
          wipData.wf_status || 'PENDING',
          userId,
          true,
          wipData.amount || 0,
          wipData.is_disbursement_account || false,
          wipData.fy || null,
          wipData.mm || null,
          wipData.member_count || 0,
          wipData.is_aadhaar_linked_account || false
        ];

        const result = await client.query(query, params);
        insertedRecords.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        count: insertedRecords.length,
        data: insertedRecords
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create new Allotment record with flexible column support
   * Only inserts columns that are provided in the data
   */
  async createAllotment(allotmentData, userId = 1) {
    try {
      // Define all possible columns and their values
      const columnMapping = {
        scrutiny_id: allotmentData.scrutiny_id,
        application_no: allotmentData.application_no,
        allotment_id: allotmentData.allotment_id,
        rc_no: allotmentData.rc_no,
        member_id: allotmentData.member_id,
        fy: allotmentData.fy,
        mm: allotmentData.mm,
        member_count: allotmentData.member_count,
        hof_name: allotmentData.hof_name,
        amount: allotmentData.amount,
        rft_no: allotmentData.rft_no,
        rft_date: allotmentData.rft_date,
        rft_status: allotmentData.rft_status,
        rft_generated_by: allotmentData.rft_generated_by,
        bill_no: allotmentData.bill_no,
        bill_date: allotmentData.bill_date,
        bill_generated_by: allotmentData.bill_generated_by,
        pfms_batch_no: allotmentData.pfms_batch_no,
        pfms_batch_date: allotmentData.pfms_batch_date,
        batch_generated_by: allotmentData.batch_generated_by,
        is_payment_processed: allotmentData.is_payment_processed,
        is_active: allotmentData.is_active !== undefined ? allotmentData.is_active : true,
        created_by: userId
      };

      // Filter out undefined/null values and build dynamic query
      const columns = [];
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      Object.entries(columnMapping).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          columns.push(column);
          values.push(value);
          placeholders.push(`$${paramIndex}`);
          paramIndex++;
        }
      });

      // Build the INSERT query dynamically
      const query = `
        INSERT INTO ${tables.APL_ALLOTMENT_DETAIL} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Bulk create allotment records
   */
  async bulkCreateAllotment(allotmentDataArray, userId = 1) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertedRecords = [];
      
      for (const allotmentData of allotmentDataArray) {
        // Define all possible columns and their values
        const columnMapping = {
          scrutiny_id: allotmentData.scrutiny_id,
          application_no: allotmentData.application_no,
          allotment_id: allotmentData.allotment_id,
          rc_no: allotmentData.rc_no,
          member_id: allotmentData.member_id,
          fy: allotmentData.fy,
          mm: allotmentData.mm,
          member_count: allotmentData.member_count,
          hof_name: allotmentData.hof_name,
          amount: allotmentData.amount,
          rft_no: allotmentData.rft_no,
          rft_date: allotmentData.rft_date,
          rft_status: allotmentData.rft_status,
          rft_generated_by: allotmentData.rft_generated_by,
          bill_no: allotmentData.bill_no,
          bill_date: allotmentData.bill_date,
          bill_generated_by: allotmentData.bill_generated_by,
          pfms_batch_no: allotmentData.pfms_batch_no,
          pfms_batch_date: allotmentData.pfms_batch_date,
          batch_generated_by: allotmentData.batch_generated_by,
          is_payment_processed: allotmentData.is_payment_processed,
          is_active: allotmentData.is_active !== undefined ? allotmentData.is_active : true,
          created_by: userId
        };

        // Filter out undefined/null values and build dynamic query
        const columns = [];
        const values = [];
        const placeholders = [];
        let paramIndex = 1;

        Object.entries(columnMapping).forEach(([column, value]) => {
          if (value !== undefined && value !== null) {
            columns.push(column);
            values.push(value);
            placeholders.push(`$${paramIndex}`);
            paramIndex++;
          }
        });

        // Build the INSERT query dynamically
        const query = `
          INSERT INTO ${tables.APL_ALLOTMENT_DETAIL} (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;

        const result = await client.query(query, values);
        insertedRecords.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        count: insertedRecords.length,
        data: insertedRecords
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update WIP record
   */
  async update(id, wipData, userId = 1) {
    try {
      const query = `
        UPDATE ${tables.APL_WIP} 
        SET 
          sno = $1, dist_code = $2, dist_name = $3, dfso_code = $4, dfso_name = $5,
          afso_code = $6, afso_name = $7, fps_code = $8, fps_name = $9,
          ct_card_desk = $10, rc_no = $11, hof_name = $12, member_id = $13,
          member_name = $14, gender = $15, relation_name = $16, member_dob = $17,
          uid = $18, demo_auth = $19, ekyc = $20,
          total_disbursement_amount = $21, is_disbursement_account = $22,
          wf_status = $23, updated_by = $24, updated_at = CURRENT_TIMESTAMP,
          remarks = $25
        WHERE id = $26
        RETURNING *
      `;

      const params = [
        wipData.sno,
        wipData.dist_code,
        wipData.dist_name,
        wipData.dfso_code,
        wipData.dfso_name,
        wipData.afso_code,
        wipData.afso_name,
        wipData.fps_code,
        wipData.fps_name,
        wipData.ct_card_desk || null,
        wipData.rc_no,
        wipData.hof_name,
        wipData.member_id,
        wipData.member_name,
        wipData.gender || null,
        wipData.relation_name || null,
        wipData.member_dob || null,
        wipData.uid || null,
        wipData.demo_auth || null,
        wipData.ekyc || null,
        wipData.total_disbursement_amount || 0,
        wipData.is_disbursement_account || false,
        wipData.wf_status || 'PENDING',
        userId,
        wipData.remarks || null,
        id
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve WIP record
   */
  async approve(id, userId = 1, remarks = null) {
    try {
      const query = `
        UPDATE ${tables.APL_WIP} 
        SET wf_status = 'APPROVED',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP,
            remarks = $2
        WHERE id = $3
        RETURNING *
      `;

      const result = await db.query(query, [userId, remarks, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject WIP record
   */
  async reject(id, userId = 1, remarks = null) {
    try {
      const query = `
        UPDATE ${tables.APL_WIP} 
        SET wf_status = 'REJECTED',
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP,
            remarks = $2
        WHERE id = $3
        RETURNING *
      `;

      const result = await db.query(query, [userId, remarks, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete WIP record
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${tables.APL_WIP} WHERE id = $1 RETURNING *`;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get WIP statistics
   */
  async getStatistics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE wf_status = 'SCRUTINY_PENDING') as pending,
          COUNT(*) FILTER (WHERE wf_status = 'APPROVED') as approved,
          COUNT(*) FILTER (WHERE wf_status = 'REJECTED') as rejected,
          COUNT(*) FILTER (WHERE wf_status = 'CANCELLED') as cancelled
        FROM ${tables.APL_WIP}
      `;
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get Old Scrutiny Records - Latest distinct APPROVED records matching with t_apl_data
   * New implementation based on backend_design_query.md specification:
   * - Finds last approved FY/MM for the FPS
   * - Gets all approved records from that FY/MM
   * - Only returns RC numbers where ALL members have been approved (no partial approvals)
   */
  async getOldScrutinyRecords(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        fpsCode,
        afsoCode,
        dfsoCode,
        wf_status = 'APPROVED',
        sortBy = 'rc_no',
        sortOrder = 'DESC',
        distCode
      } = queryParams;

      // FPS Code is required for this query
      if (!fpsCode) {
        throw new Error('fpsCode is required for getOldScrutinyRecords');
      }

      // Build parameter array
      const params = [fpsCode];
      let paramIndex = 2;

      // Build additional filter conditions for latest_approved CTE
      const additionalConditions = [];

      if (dfsoCode) {
        additionalConditions.push(`wip.dfso_code = $${paramIndex}`);
        params.push(dfsoCode);
        paramIndex++;
      }

      if (afsoCode) {
        additionalConditions.push(`wip.afso_code = $${paramIndex}`);
        params.push(afsoCode);
        paramIndex++;
      }

      if (distCode) {
        additionalConditions.push(`wip.dist_code = $${paramIndex}`);
        params.push(distCode);
        paramIndex++;
      }

      const additionalWhereClause = additionalConditions.length > 0 
        ? `AND ${additionalConditions.join(' AND ')}` 
        : '';

      // Main query with CTEs
      const baseQuery = `
        WITH LAST_APPROVED_MM AS (
          SELECT fps_code, fy, mm, split_part(fy, '-', 1)::int as fy_year
          FROM ${tables.APL_WIP}
          WHERE fps_code = $1 AND wf_status = 'APPROVED'
          ORDER BY 
            split_part(fy, '-', 1)::int DESC,
            CASE WHEN mm >= 4 THEN mm ELSE mm + 12 END DESC
          LIMIT 1
        ),
        latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no, wip.member_id) wip.*,
            data.dist_name,
            data.dfso_name,
            data.afso_name,
            data.member_name,
            data.gender,
            data.relation_name,
            data.member_dob,
            data.uid,
            data.demo_auth,
            data.ekyc
          FROM ${tables.APL_WIP} wip
          JOIN LAST_APPROVED_MM lm ON wip.fy = lm.fy AND wip.mm = lm.mm
          LEFT JOIN ${tables.APL_DATA} data ON wip.member_id = data.member_id
          WHERE wip.wf_status = 'APPROVED' 
            AND wip.fps_code = $1
            ${additionalWhereClause}
          ORDER BY wip.rc_no, wip.member_id, wip.created_at DESC
        ),
        unmatch_rc AS (
          SELECT DISTINCT rc_no 
          FROM ${tables.APL_DATA} d
          WHERE NOT EXISTS (
            SELECT 1 
            FROM latest_approved la 
            WHERE d.member_id = la.member_id
          )
          AND d.fps_code = $1 
          AND d.is_active = true
        )
        SELECT d.*
        FROM ${tables.APL_DATA} d
        WHERE NOT EXISTS (
          SELECT 1 FROM unmatch_rc ur WHERE d.rc_no = ur.rc_no
        )
        AND EXISTS (
          SELECT 1 FROM latest_approved lu 
          WHERE d.rc_no = lu.rc_no AND d.member_id = lu.member_id
        )
      `;

      // Count query - count distinct records
      const countQuery = `
        WITH LAST_APPROVED_MM AS (
          SELECT fps_code, fy, mm, split_part(fy, '-', 1)::int as fy_year
          FROM ${tables.APL_WIP}
          WHERE fps_code = $1 AND wf_status = 'APPROVED'
          ORDER BY 
            split_part(fy, '-', 1)::int DESC,
            CASE WHEN mm >= 4 THEN mm ELSE mm + 12 END DESC
          LIMIT 1
        ),
        latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no, wip.member_id) wip.rc_no, wip.member_id
          FROM ${tables.APL_WIP} wip
          JOIN LAST_APPROVED_MM lm ON wip.fy = lm.fy AND wip.mm = lm.mm
          WHERE wip.wf_status = 'APPROVED' 
            AND wip.fps_code = $1
            ${additionalWhereClause}
          ORDER BY wip.rc_no, wip.member_id, wip.created_at DESC
        ),
        unmatch_rc AS (
          SELECT DISTINCT rc_no 
          FROM ${tables.APL_DATA} d
          WHERE NOT EXISTS (
            SELECT 1 
            FROM latest_approved la 
            WHERE d.member_id = la.member_id
          )
          AND d.fps_code = $1 
          AND d.is_active = true
        )
        SELECT COUNT(*)
        FROM ${tables.APL_DATA} d
        WHERE NOT EXISTS (
          SELECT 1 FROM unmatch_rc ur WHERE d.rc_no = ur.rc_no
        )
        AND EXISTS (
          SELECT 1 FROM latest_approved lu 
          WHERE d.rc_no = lu.rc_no AND d.member_id = lu.member_id
        )
      `;

      // Get total count
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data with ordering and pagination
      const orderByClause = buildOrderBy(sortBy, sortOrder);
      const dataQuery = `
        ${baseQuery}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataParams = [...params, pagination.query.limit, pagination.query.offset];
      const result = await db.query(dataQuery, dataParams);

      return {
        data: result.rows,
        pagination: pagination.metadata
      };
    } catch (error) {
      throw error;
    }
  }



  /**
   * Get Old Scrutiny Records - Latest distinct APPROVED records matching with t_apl_data
   * Irrespective of fy and mm filters (they are informational only)
   */
  async getOldScrutinyRecordsV2(queryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        fpsCode,
        afsoCode,
        dfsoCode,
        wf_status = 'APPROVED',
        latestOnly = true,
        sortBy = 'rc_no',
        sortOrder = 'DESC',
        fy, // Financial Year (informational only, not used in filtering)
        mm,  // Month (informational only, not used in filtering),
        distCode
      } = queryParams;

      // Build WHERE conditions for filters (excluding fy and mm as per spec)
      const conditions = ['wip.wf_status = $1']; // Status fixed to APPROVED
      const params = [wf_status];
      let paramIndex = 2;

      // Add DFSO filter
      if (dfsoCode) {
        conditions.push(`wip.dfso_code = $${paramIndex}`);
        params.push(dfsoCode);
        paramIndex++;
      }

      // Add AFSO filter
      if (afsoCode) {
        conditions.push(`wip.afso_code = $${paramIndex}`);
        params.push(afsoCode);
        paramIndex++;
      }

      // Add FPS filter
      if (fpsCode) {
        conditions.push(`wip.fps_code = $${paramIndex}`);
        params.push(fpsCode);
        paramIndex++;
      }

      // Add District filter
      if (distCode) {
        conditions.push(`wip.dist_code = $${paramIndex}`);
        params.push(distCode);
        paramIndex++;
      }

      if(fy){
        conditions.push(`wip.fy = $${paramIndex}`);
        params.push(fy);
        paramIndex++;   
      }

      if(mm){
        conditions.push(`wip.mm = $${paramIndex}`);
        params.push(mm);
        paramIndex++;   
      }

      const whereClause = conditions.join(' AND ');

      // Query logic: Get latest APPROVED records that match with t_apl_data
      // Using DISTINCT ON for latest records per rc_no
      const baseQuery = latestOnly ? `
        WITH latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no, wip.member_id) wip.*,
          data.dist_name,
          data.dfso_name,
          data.afso_name,
          data.member_name,
          data.gender,
          data.relation_name,
          data.member_dob,
          data.uid,
          data.demo_auth,
          data.ekyc
          FROM ${tables.APL_WIP} wip
          LEFT JOIN ${tables.APL_DATA} data ON wip.member_id = data.member_id
          WHERE ${whereClause}
          --${whereClause.replace('wf_status', 'wip.wf_status').replace('dfso_code', 'wip.dfso_code').replace('afso_code', 'wip.afso_code').replace('fps_code', 'wip.fps_code').replace('dist_code', 'wip.dist_code').replace('is_active', 'wip.is_active')}
          ORDER BY wip.rc_no, wip.member_id, wip.created_at DESC
        )
        SELECT la.* 
        FROM latest_approved la
        WHERE EXISTS (
          SELECT 1 FROM ${tables.APL_DATA} data
          WHERE data.rc_no = la.rc_no
        )
      ` : `
        SELECT wip.* 
        FROM ${tables.APL_WIP} wip
        WHERE ${whereClause}
          AND EXISTS (
            SELECT 1 FROM ${tables.APL_DATA} data
            WHERE data.rc_no = wip.rc_no
          )
      `;

      // Get total count
      const countQuery = latestOnly ? `
        WITH latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no) wip.rc_no
          FROM ${tables.APL_WIP} wip
          WHERE ${whereClause}
          ORDER BY wip.rc_no, wip.created_at DESC
        )
        SELECT COUNT(*) 
        FROM latest_approved la
        WHERE EXISTS (
          SELECT 1 FROM ${tables.APL_DATA} data
          WHERE data.rc_no = la.rc_no
        )
      ` : `
        SELECT COUNT(*) 
        FROM ${tables.APL_WIP} wip
        WHERE ${whereClause}
          AND EXISTS (
            SELECT 1 FROM ${tables.APL_DATA} data
            WHERE data.rc_no = wip.rc_no
          )
      `;

      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data with ordering and pagination
      const orderByClause = buildOrderBy(sortBy, sortOrder);
      const dataQuery = `
        ${baseQuery}
        ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const dataParams = [...params, pagination.query.limit, pagination.query.offset];
      const result = await db.query(dataQuery, dataParams);

      return {
        data: result.rows,
        pagination: pagination.metadata
      };
    } catch (error) {
      throw error;
    }
  }
  /**
   * Bulk update WIP status (for DFSO approve/reject operations)
   */
  async bulkUpdateStatus(rcNumbers, status, remarks = null, userId = 1) {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const updatedRecords = [];

      // Update all records for the given RC numbers
      for (const rcNo of rcNumbers) {
        const query = `
          UPDATE ${tables.APL_ALLOTMENT_DETAIL}
          SET wf_status = $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP,
              remarks = $3
          WHERE rc_no = $4
            AND wf_status = 'SCRUTINY_PENDING'
          RETURNING *
        `;

        const params = [status, userId, remarks, rcNo];
        const result = await client.query(query, params);
        updatedRecords.push(...result.rows);
      }

      await client.query('COMMIT');

      return {
        success: true,
        count: updatedRecords.length,
        data: updatedRecords
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new APLBillService();
