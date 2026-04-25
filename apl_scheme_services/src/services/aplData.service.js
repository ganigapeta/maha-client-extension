const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class APLDataService {
  /**
   * Get all APL Data records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        isActive, 
        dfsoCode, 
        afsoCode, 
        fpsCode,
        rcNo,
        distCode,
        sortBy = 'rc_no', 
        sortOrder = 'DESC',
        fy,
        mm,
        excludeSubmitted = false
      } = queryParams;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add search condition
      if (search) {
        const searchColumns = [
          'member_name', 'hof_name', 'rc_no::text', 'member_id::text', 
          'uid', 'dist_name', 'fps_name', 'dfso_name', 'afso_name'
        ];
        const searchQuery = buildSearchQuery(search, searchColumns);
        if (searchQuery.condition) {
          conditions.push(searchQuery.condition);
          searchQuery.params.forEach(p => params.push(p));
          paramIndex += searchQuery.params.length;
        }
      }

      // Add District filter
      if (distCode) {
        conditions.push(`dist_code = $${paramIndex}`);
        params.push(distCode);
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

      // Add Ration Card Number filter
      if (rcNo) {
        conditions.push(`rc_no = $${paramIndex}`);
        params.push(rcNo);
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

      // Build query with or without excludeSubmitted logic
      let baseQuery;
      let countQuery;
      let dataQuery;

      if (excludeSubmitted && fy && mm) {
        // Use CTE to exclude families already submitted for this fy and mm
        baseQuery = `
          WITH family_member_counts AS (
            SELECT 
              *,
              COUNT(*) OVER (PARTITION BY rc_no) as member_count
            FROM ${tables.APL_DATA}
            ${whereClause}
          )
          SELECT * FROM family_member_counts fmc
          WHERE NOT EXISTS (
            SELECT 1 FROM ${tables.APL_WIP} scrutiny
            WHERE scrutiny.rc_no = fmc.rc_no
              --AND scrutiny.fy = $${paramIndex}
              --AND scrutiny.mm = $${paramIndex + 1}
              AND scrutiny.member_count = fmc.member_count
          )
        `;
        
        // params.push(fy);
        // params.push(mm);
        // paramIndex += 2;

        // Get total count with exclusion
        countQuery = `
          WITH family_member_counts AS (
            SELECT 
              rc_no,
              COUNT(*) OVER (PARTITION BY rc_no) as member_count
            FROM ${tables.APL_DATA}
            ${whereClause}
          )
          SELECT COUNT(DISTINCT rc_no) as count FROM family_member_counts fmc
          WHERE NOT EXISTS (
            SELECT 1 FROM ${tables.APL_WIP} scrutiny
            WHERE scrutiny.rc_no = fmc.rc_no
             -- AND scrutiny.fy = $${paramIndex - 2}
             -- AND scrutiny.mm = $${paramIndex - 1}
              AND scrutiny.member_count = fmc.member_count
          )
        `;

        // Get data with exclusion
        const orderByClause = buildOrderBy(sortBy, sortOrder);
        dataQuery = `
          ${baseQuery}
          ${orderByClause}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
      } else {
        // Standard query without exclusion
        countQuery = `SELECT COUNT(*) FROM ${tables.APL_DATA} ${whereClause}`;
        
        const orderByClause = buildOrderBy(sortBy, sortOrder);
        dataQuery = `
          SELECT * FROM ${tables.APL_DATA}
          ${whereClause}
          ${orderByClause}
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
      }

      // Execute count query
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Execute data query
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
   * Get APL Data by ID
   */
  async getById(id) {
    try {
      const query = `SELECT * FROM ${tables.APL_DATA} WHERE id = $1`;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get APL Data by Ration Card Number (grouped by family)
   */
  async getByRationCard(rcNo) {
    try {
      const query = `
        SELECT * FROM ${tables.APL_DATA}
        WHERE rc_no = $1 
        ORDER BY member_id ASC
      `;
      const result = await db.query(query, [rcNo]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get APL Data grouped by families for a specific FPS
   */
  async getByFPSGrouped(fpsCode, queryParams = {}) {
    try {
      const { isActive } = queryParams;
      
      const conditions = ['fps_code = $1'];
      const params = [fpsCode];
      let paramIndex = 2;

      if (isActive !== undefined) {
        const activeFilter = buildActiveFilter(isActive);
        if (activeFilter.condition) {
          conditions.push(activeFilter.condition.replace('$1', `$${paramIndex}`));
          params.push(...activeFilter.params);
          paramIndex++;
        }
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const query = `
        SELECT 
          rc_no,
          hof_name,
          dist_code,
          dist_name,
          dfso_code,
          dfso_name,
          afso_code,
          afso_name,
          fps_code,
          fps_name,
          ct_card_desk,
          json_agg(
            json_build_object(
              'member_id', member_id,
              'member_name', member_name,
              'gender', gender,
              'relation_name', relation_name,
              'member_dob', member_dob,
              'uid', uid,
              'demo_auth', demo_auth,
              'ekyc', ekyc
            ) ORDER BY member_id
          ) as members
        FROM ${tables.APL_DATA}
        ${whereClause}
        GROUP BY rc_no, hof_name, dist_code, dist_name, dfso_code, dfso_name, 
                 afso_code, afso_name, fps_code, fps_name, ct_card_desk
        ORDER BY rc_no
      `;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics by DFSO
   */
  async getStatsByDFSO(dfsoCode) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT rc_no) as total_families,
          COUNT(*) as total_members,
          COUNT(DISTINCT fps_code) as total_fps,
          COUNT(DISTINCT afso_code) as total_afso
        FROM ${tables.APL_DATA}
        WHERE dfso_code = $1 AND is_active = true
      `;
      const result = await db.query(query, [dfsoCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics by AFSO
   */
  async getStatsByAFSO(afsoCode) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT rc_no) as total_families,
          COUNT(*) as total_members,
          COUNT(DISTINCT fps_code) as total_fps
        FROM ${tables.APL_DATA}
        WHERE afso_code = $1 AND is_active = true
      `;
      const result = await db.query(query, [afsoCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get statistics by FPS
   */
  async getStatsByFPS(fpsCode) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT rc_no) as total_families,
          COUNT(*) as total_members
        FROM ${tables.APL_DATA}
        WHERE fps_code = $1 --AND is_active = true
      `;
      const result = await db.query(query, [fpsCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new APLDataService();
