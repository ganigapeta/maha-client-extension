const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class FPSService {
  /**
   * Get all FPS records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { page = 1, limit = 10, search = '', isActive, afsoCode, dfsoCode, sortBy = 'fps_code', sortOrder = 'ASC' } = queryParams;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add search condition
      if (search) {
        const searchColumns = ['f.fps_code::text', 'f.afso_code::text', 'f.description_en', 'f.description_ll'];
        const searchQuery = buildSearchQuery(search, searchColumns);
        if (searchQuery.condition) {
          conditions.push(searchQuery.condition);
          searchQuery.params.forEach(p => params.push(p));
          paramIndex += searchQuery.params.length;
        }
      }

      // Add AFSO filter
      if (afsoCode) {
        conditions.push(`f.afso_code = $${paramIndex}`);
        params.push(afsoCode);
        paramIndex++;
      }

      // Add DFSO filter
      if (dfsoCode) {
        conditions.push(`a.dfso_code = $${paramIndex}`);
        params.push(dfsoCode);
        paramIndex++;
      }

      // Add active filter
      // if (isActive !== undefined) {
      //   const activeFilter = buildActiveFilter(isActive);
      //   if (activeFilter.condition) {
      //     conditions.push(activeFilter.condition.replace('is_active', 'f.is_active').replace('$1', `$${paramIndex}`));
      //     params.push(...activeFilter.params);
      //     paramIndex++;
      //   }
      // }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM ${tables.FPS} f
        LEFT JOIN ${tables.AFSO} a ON f.afso_code = a.afso_code
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data
      const orderByClause = buildOrderBy('f.' + sortBy, sortOrder);
      const dataQuery = `
        SELECT f.id, f.fps_code, f.afso_code, f.description_en, f.description_ll, 
               f.is_active, f.created_at, f.created_by, f.updated_at, f.updated_by,
               a.description_en as afso_name, a.dfso_code,
               d.description_en as dfso_name
        FROM ${tables.FPS} f
        LEFT JOIN ${tables.AFSO} a ON f.afso_code = a.afso_code
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
   * Get FPS by ID
   */
  async getById(id) {
    try {
      const query = `
        SELECT f.id, f.fps_code, f.afso_code, f.description_en, f.description_ll, 
               f.is_active, f.created_at, f.created_by, f.updated_at, f.updated_by,
               a.description_en as afso_name, a.dfso_code,
               d.description_en as dfso_name
        FROM ${tables.FPS} f
        LEFT JOIN ${tables.AFSO} a ON f.afso_code = a.afso_code
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        WHERE f.id = $1 Order by f.description_en ASC
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get FPS by code
   */
  async getByCode(fpsCode) {
    try {
      const query = `
        SELECT f.id, f.fps_code, f.afso_code, f.description_en, f.description_ll, 
               f.is_active, f.created_at, f.created_by, f.updated_at, f.updated_by,
               a.description_en as afso_name, a.dfso_code,
               d.description_en as dfso_name
        FROM ${tables.FPS} f
        LEFT JOIN ${tables.AFSO} a ON f.afso_code = a.afso_code
        LEFT JOIN ${tables.DFSO} d ON a.dfso_code = d.dfso_code
        WHERE f.fps_code = $1
      `;
      const result = await db.query(query, [fpsCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all active FPS records by AFSO code (for dropdowns)
   */
  async getAllActiveByAFSO(afsoCode) {
    try {
      const query = `
        SELECT id, fps_code, afso_code, description_en, description_ll
        FROM ${tables.FPS} 
        WHERE afso_code = $1 --is_active = true AND 
        ORDER BY description_en ASC
      `;
      const result = await db.query(query, [afsoCode]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new FPSService();
