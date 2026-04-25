const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class AFSOService {
  /**
   * Get all AFSO records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { page = 1, limit = 10, search = '', isActive, dfsoCode, sortBy = 'afso_code', sortOrder = 'ASC' } = queryParams;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add search condition
      if (search) {
        const searchColumns = ['afso_code::text', 'dfso_code::text', 'description_en', 'description_ll'];
        const searchQuery = buildSearchQuery(search, searchColumns);
        if (searchQuery.condition) {
          conditions.push(searchQuery.condition);
          searchQuery.params.forEach(p => params.push(p));
          paramIndex += searchQuery.params.length;
        }
      }

      // Add DFSO filter
      if (dfsoCode) {
        conditions.push(`dfso_code = $${paramIndex}`);
        params.push(dfsoCode);
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
      const countQuery = `SELECT COUNT(*) FROM ${tables.AFSO} ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data
      const orderByClause = buildOrderBy(sortBy, sortOrder);
      const dataQuery = `
        SELECT a.id, a.dfso_code, a.afso_code, a.description_en, a.description_ll, 
               a.is_active, a.created_at, a.created_by, a.modified_at, a.modified_by,
               d.description_en as dfso_name
        FROM ${tables.AFSO} a
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        ${whereClause}
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
   * Get AFSO by ID
   */
  async getById(id) {
    try {
      const query = `
        SELECT a.id, a.dfso_code, a.afso_code, a.description_en, a.description_ll, 
               a.is_active, a.created_at, a.created_by, a.modified_at, a.modified_by,
               d.description_en as dfso_name
        FROM ${tables.AFSO} a
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        WHERE a.dfso_code = $1 Order by a.description_en ASC
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get AFSO by code
   */
  async getByCode(afsoCode) {
    try {
      const query = `
        SELECT a.id, a.dfso_code, a.afso_code, a.description_en, a.description_ll, 
               a.is_active, a.created_at, a.created_by, a.modified_at, a.modified_by,
               d.description_en as dfso_name
        FROM ${tables.AFSO} a
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        WHERE a.afso_code = $1
      `;
      const result = await db.query(query, [afsoCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all active AFSO records by DFSO code (for dropdowns)
   */
  async getAllActiveByDFSO(dfsoCode) {
    try {
      const query = `
        SELECT id, afso_code, dfso_code, description_en, description_ll
        FROM ${tables.AFSO} 
        WHERE dfso_code = $1
        ORDER BY description_en ASC
      `;
      const result = await db.query(query, [dfsoCode]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get AFSO hierarchy with FPS count
   */
  async getWithHierarchy(afsoId) {
    try {
      const query = `
        SELECT 
          a.id, a.afso_code, a.dfso_code, a.description_en, a.description_ll, a.is_active,
          d.description_en as dfso_name,
          COUNT(f.id) as fps_count
        FROM ${tables.AFSO} a
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        LEFT JOIN ${tables.FPS} f ON a.afso_code = f.afso_code
        WHERE a.id = $1
        GROUP BY a.id, a.afso_code, a.dfso_code, a.description_en, a.description_ll, 
                 a.is_active, d.description_en
      `;
      const result = await db.query(query, [afsoId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AFSOService();
