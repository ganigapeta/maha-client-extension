const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class APLWipService {
  /**
   * Get all WIP records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { 
        page = 1, limit = 10, search = '', isActive, wf_status, fy, mm, is_disbursement_account,
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

      if(is_disbursement_account !== undefined){
        conditions.push(`is_disbursement_account = $${paramIndex}`);
        params.push(is_disbursement_account);
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
          data.ekyc,
          data.masked_aadhaar_no
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
   * Create new WIP record
   */
  async create(wipData, userId = 1) {
    try {
      const query = `
        INSERT INTO ${tables.APL_WIP} (
          sno, dist_code, dist_name, dfso_code, dfso_name, afso_code, afso_name,
          fps_code, fps_name, ct_card_desk, rc_no, hof_name, member_id, member_name,
          gender, relation_name, member_dob, uid, demo_auth, ekyc,
          total_disbursement_amount, is_disbursement_account, wf_status,
          created_by, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
        RETURNING *
      `;

      const params = [
        wipData.sno || 0,
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
        true
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
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
        distCode,
        fy = '2026-2027',  // NEW: current FY to exclude
        mm = 4             // NEW: current MM to exclude
      } = queryParams;

      // FPS Code is required for this query
      if (!fpsCode) {
        throw new Error('fpsCode is required for getOldScrutinyRecords');
      }

      // Build parameter array
      // $1 = fpsCode, $2 = fy, $3 = mm
      const params = [fpsCode, fy, mm];
      let paramIndex = 4;

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

      // Shared CTE block (used in both base and count queries)
      const sharedCTEs = `
        WITH LAST_APPROVED_MM AS (
          WITH cte AS (
            SELECT
              ROW_NUMBER() OVER (
                PARTITION BY rc_no
                ORDER BY
                  split_part(fy, '-', 1)::int DESC,
                  CASE WHEN mm >= 4 THEN mm ELSE mm + 12 END DESC
              ) AS rn,
              rc_no, fps_code, fy, mm,
              split_part(fy, '-', 1)::int AS fy_year
            FROM ${tables.APL_WIP}
            WHERE wf_status in ('APPROVED', 'BILL_GENERATED', 'RFT_GENERATED', 'DISBURSED')
              AND fps_code = $1
              AND NOT EXISTS (
                SELECT 1
                FROM ${tables.APL_WIP} b
                WHERE b.rc_no = ${tables.APL_WIP}.rc_no  -- correlated alias workaround below
                  AND b.fy = $2
                  AND b.mm = $3
              )
          )
          SELECT * FROM cte WHERE rn = 1
        ),
      `;

      // Main query with CTEs
      const baseQuery = `
        WITH LAST_APPROVED_MM AS (
          WITH cte AS (
            SELECT
              ROW_NUMBER() OVER (
                PARTITION BY a.rc_no
                ORDER BY
                  split_part(a.fy, '-', 1)::int DESC,
                  CASE WHEN a.mm >= 4 THEN a.mm ELSE a.mm + 12 END DESC
              ) AS rn,
              a.rc_no, a.fps_code, a.fy, a.mm,
              split_part(a.fy, '-', 1)::int AS fy_year
            FROM ${tables.APL_WIP} a
            WHERE a.wf_status in ('APPROVED', 'BILL_GENERATED', 'RFT_GENERATED', 'DISBURSED')
              AND a.fps_code = $1
              AND NOT EXISTS (
                SELECT 1
                FROM ${tables.APL_WIP} b
                WHERE b.rc_no = a.rc_no
                  AND b.fy = $2
                  AND b.mm = $3
                  AND b.wf_status != 'REJECTED'
              )
          )
          SELECT * FROM cte WHERE rn = 1
        ),
        latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no, wip.member_id)
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
          JOIN LAST_APPROVED_MM lm
            ON wip.rc_no = lm.rc_no         
            AND wip.fy = lm.fy
            AND wip.mm = lm.mm
          LEFT JOIN ${tables.APL_DATA} data ON wip.member_id = data.member_id
            WHERE wip.wf_status in ('APPROVED', 'BILL_GENERATED', 'RFT_GENERATED', 'DISBURSED')
            AND wip.fps_code = $1
            ${additionalWhereClause}
          ORDER BY wip.rc_no, wip.member_id, wip.created_at DESC
        ),
        unmatch_rc AS (
          SELECT DISTINCT rc_no
          FROM ${tables.APL_DATA} d
          WHERE NOT EXISTS (
            SELECT 1 FROM latest_approved la WHERE d.member_id = la.member_id
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

      // Count query
      const countQuery = `
        WITH LAST_APPROVED_MM AS (
          WITH cte AS (
            SELECT
              ROW_NUMBER() OVER (
                PARTITION BY a.rc_no
                ORDER BY
                  split_part(a.fy, '-', 1)::int DESC,
                  CASE WHEN a.mm >= 4 THEN a.mm ELSE a.mm + 12 END DESC
              ) AS rn,
              a.rc_no, a.fps_code, a.fy, a.mm
            FROM ${tables.APL_WIP} a
            WHERE a.wf_status in ('APPROVED', 'BILL_GENERATED', 'RFT_GENERATED', 'DISBURSED')
              AND a.fps_code = $1
              AND NOT EXISTS (
                SELECT 1
                FROM ${tables.APL_WIP} b
                WHERE b.rc_no = a.rc_no
                  AND b.fy = $2
                  AND b.mm = $3
                  AND b.wf_status != 'REJECTED'
              )
          )
          SELECT * FROM cte WHERE rn = 1
        ),
        latest_approved AS (
          SELECT DISTINCT ON (wip.rc_no, wip.member_id) wip.rc_no, wip.member_id
          FROM ${tables.APL_WIP} wip
          JOIN LAST_APPROVED_MM lm
            ON wip.rc_no = lm.rc_no
            AND wip.fy = lm.fy
            AND wip.mm = lm.mm
            WHERE wip.wf_status in ('APPROVED', 'BILL_GENERATED', 'RFT_GENERATED', 'DISBURSED')
            AND wip.fps_code = $1
            ${additionalWhereClause}
          ORDER BY wip.rc_no, wip.member_id, wip.created_at DESC
        ),
        unmatch_rc AS (
          SELECT DISTINCT rc_no
          FROM ${tables.APL_DATA} d
          WHERE NOT EXISTS (
            SELECT 1 FROM latest_approved la WHERE d.member_id = la.member_id
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
  async bulkUpdateStatus(rcNumbers, status, remarks = null, userId = 1, fy = null, mm = null, requestBody = {}) {
    const client = await db.pool.connect();
    let statusWhereClause = `wf_status = 'SCRUTINY_PENDING'`;
    if(status === 'APPROVED' || status === 'REJECTED'){
     statusWhereClause = `wf_status = 'SCRUTINY_PENDING'`;
    }
    if(status === 'BILL_GENERATED'){
      statusWhereClause = `wf_status = 'APPROVED'`;
    }

    if(status === 'DISBURSED'){
      statusWhereClause = `wf_status = 'BILL_GENERATED'`;
    }
    
    if(fy && mm){
      statusWhereClause += ` AND fy = '${fy}' AND mm = ${mm}`;
    }
    try {
      await client.query('BEGIN');

      const updatedRecords = [];

      // Update all records for the given RC numbers
      for (const rcNo of rcNumbers) {
        const query = `
          UPDATE ${tables.APL_WIP}
          SET wf_status = $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP,
              remarks = $3
          WHERE rc_no = $4
            AND ${statusWhereClause}
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


  /**
   * Bulk update WIP status (for DFSO approve/reject operations)
   */
  async updateRftStatusO(rcNumbers, status, remarks = null, userId = 1, fy = null, mm = null, requestBody = {}) {
    const client = await db.pool.connect();
    let statusWhereClause = `wf_status = 'SCRUTINY_PENDING'`;
    if(status === 'APPROVED' || status === 'REJECTED'){
     statusWhereClause = `wf_status = 'SCRUTINY_PENDING'`;
    }
    if(status === 'BILL_GENERATED'){
      statusWhereClause = `wf_status = 'APPROVED'`;
    }

    if(status === 'DISBURSED'){
      statusWhereClause = `wf_status = 'BILL_GENERATED'`;
    }
    
    if(fy && mm){
      statusWhereClause += ` AND fy = '${fy}' AND mm = ${mm}`;
    }
    try {
      await client.query('BEGIN');

      const updatedRecords = [];

      // Update all records for the given RC numbers
      for (const rcNo of rcNumbers) {
        const query = `
          UPDATE ${tables.APL_WIP}
          SET wf_status = $1,
              updated_by = $2,
              updated_at = CURRENT_TIMESTAMP,
              remarks = $3
          WHERE rc_no = $4
            AND ${statusWhereClause}
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



async updateRftStatus(rcNumbers, status, remarks = null, userId = 1, fy = null, mm = null, requestBody = {}) {
    const client = await db.pool.connect();

    // Status where clause
    let statusWhereClause = `wf_status = 'SCRUTINY_PENDING'`;
    if (status === 'RFT_GENERATED') statusWhereClause = `wf_status = 'APPROVED'`;
    if (status === 'BILL_GENERATED') statusWhereClause = `wf_status = 'APPROVED'`;
    if (status === 'DISBURSED')      statusWhereClause = `wf_status = 'RFT_GENERATED'`;

    if (fy && mm) {
      statusWhereClause += ` AND fy = '${fy}' AND mm = ${mm}`;
    }

    // ── Dynamic column builder ──────────────────────────────────────────
    const buildUpdate = (table, updates, extraWhere, extraParams = []) => {
      const fields = [];
      const params = [];
      let i = 1;

      for (const [col, val] of Object.entries(updates)) {
        if (val !== undefined) {
          fields.push(`${col} = $${i++}`);
          params.push(val);
        }
      }

      // rc_no array param
      params.push(rcNumbers);
      const rcParam = i++;

      // extra params (e.g. fy, mm if needed)
      extraParams.forEach(p => params.push(p));

      const query = `
        UPDATE ${table}
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE rc_no = ANY($${rcParam}::text[])
          AND ${extraWhere}
        RETURNING *
      `;

      return { query, params };
    };

    try {
      await client.query('BEGIN');

      // ── Table 1: APL_WIP ───────────────────────────────────────────────
      const wipUpdates = {
        wf_status:  status,
        updated_by: userId,
        is_rft_generated: requestBody.is_rft_generated,
        rft_no: requestBody.rft_no,
        rft_date:requestBody.rft_date,
        rft_generated_by:requestBody.rft_generated_by,
      };

      const { query: wipQuery, params: wipParams } = buildUpdate(
        tables.APL_WIP,
        wipUpdates,
        statusWhereClause
      );

      const wipResult = await client.query(wipQuery, wipParams);

      if (wipResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'No matching records found in APL_WIP' };
      }

      // ── Table 2: APL_RFT (or your second table) ────────────────────────
      const rftUpdates = {
        rft_status:  requestBody.status,
        rft_no:            requestBody.rft_no,
        rft_date:          requestBody.rft_date,
        rft_generated_by:  requestBody.rft_generated_by,
        updated_by:        requestBody.userId,
      };

      const { query: rftQuery, params: rftParams } = buildUpdate(
        tables.APL_ALLOTMENT_DETAIL,         // 👈 replace with your second table
        rftUpdates,
        `bill_no = '${requestBody.bill_no}'`         // 👈 replace with your second table's where clause
      );

      const rftResult = await client.query(rftQuery, rftParams);

      if (rftResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'No matching records found in APL_RFT' };
      }

      await client.query('COMMIT');

      return {
        success: true,
        count: wipResult.rowCount,
        data: wipResult.rows
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


async updateBillStatus(bill_no, status, remarks = null, userId = 1, fy = null, mm = null, requestBody = {}) {
    const client = await db.pool.connect();

 

    // ── Dynamic column builder ──────────────────────────────────────────
    const buildUpdate = (table, updates, extraWhere, extraParams = []) => {
      const fields = [];
      const params = [];
      let i = 1;

      for (const [col, val] of Object.entries(updates)) {
        if (val !== undefined) {
          fields.push(`${col} = $${i++}`);
          params.push(val);
        }
      }

      // extra params (e.g. fy, mm if needed)
      extraParams.forEach(p => params.push(p));

      const query = `
        UPDATE ${table}
        SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE ${extraWhere}
        RETURNING *
      `;

      return { query, params };
    };

    try {
      await client.query('BEGIN');

      // ── Table 1: APL_RFT (or your second table) ────────────────────────
      const rftUpdates = {
        rft_status:  requestBody.status,
        bill_generated_by:  requestBody.userId,
        updated_by:        requestBody.userId,
      };

      const { query: rftQuery, params: rftParams } = buildUpdate(
        tables.APL_ALLOTMENT_DETAIL,         // 👈 replace with your second table
        rftUpdates,
        `bill_no = '${requestBody.bill_no}'`         // 👈 replace with your second table's where clause
      );

      const rftResult = await client.query(rftQuery, rftParams);

      if (rftResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'No matching records found in APL_RFT' };
      }

      await client.query('COMMIT');

      return {
        success: true,
        count: rftResult.rowCount,
        data: rftResult.rows
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }


  async getAllBeneficiaries(queryParams) {
    try {
      const { 
        page = 1, limit = 10, search = '', isActive, wf_status, fy, mm, is_disbursement_account,
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

      if(is_disbursement_account !== undefined){
        conditions.push(`is_disbursement_account = $${paramIndex}`);
        params.push(is_disbursement_account);
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
          data.ekyc,
          data.masked_aadhaar_no
        FROM ${tables.APL_ALLOTMENT_DETAIL} wip
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
}
module.exports = new APLWipService();
