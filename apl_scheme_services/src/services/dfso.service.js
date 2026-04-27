const db = require('../config/database');
const { buildPagination, buildSearchQuery, buildActiveFilter, buildOrderBy } = require('../utils/pagination');
const { tables } = require('../config/tables');

class DFSOService {
  /**
   * Get all DFSO records with pagination, search, and filters
   */
  async getAll(queryParams) {
    try {
      const { page = 1, limit = 10, search = '', isActive, sortBy = 'dfso_code', sortOrder = 'ASC' } = queryParams;

      // Build WHERE conditions
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Add search condition
      if (search) {
        const searchColumns = ['dfso_code::text', 'description_en', 'description_ll'];
        const searchQuery = buildSearchQuery(search, searchColumns);
        if (searchQuery.condition) {
          conditions.push(searchQuery.condition);
          searchQuery.params.forEach(p => params.push(p));
          paramIndex += searchQuery.params.length;
        }
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
      const countQuery = `SELECT COUNT(*) FROM ${tables.DFSO} ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Build pagination
      const pagination = buildPagination(page, limit, totalCount);

      // Get data
      const orderByClause = buildOrderBy(sortBy, sortOrder);
      const dataQuery = `
        SELECT id, dfso_code, description_en, description_ll, is_active, 
               created_at, created_by, modified_at, modified_by
        FROM ${tables.DFSO} 
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
   * Get DFSO by ID
   */
  async getById(id) {
    try {
      const query = `
        SELECT id, dfso_code, description_en, description_ll, is_active, 
               created_at, created_by, modified_at, modified_by
        FROM ${tables.DFSO} 
        WHERE dfso_code = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get DFSO by code
   */
  async getByCode(dfsoCode) {
    try {
      const query = `
        SELECT id, dfso_code, description_en, description_ll, is_active, 
               created_at, created_by, modified_at, modified_by
        FROM ${tables.DFSO} 
        WHERE dfso_code = $1
      `;
      const result = await db.query(query, [dfsoCode]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all active DFSO records (for dropdowns)
   */
  async getAllActive() {
    try {
      const query = `
        SELECT id, dfso_code, description_en, description_ll
        FROM ${tables.DFSO} 
        WHERE is_active = true
        ORDER BY dfso_code ASC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get DFSO hierarchy with AFSO count
   */
  async getWithHierarchy(dfsoId) {
    try {
      const query = `
        SELECT 
          d.id, d.dfso_code, d.description_en, d.description_ll, d.is_active,
          COUNT(DISTINCT a.id) as afso_count,
          COUNT(DISTINCT f.id) as fps_count
        FROM ${tables.DFSO} d
        LEFT JOIN ${tables.AFSO} a ON d.dfso_code = a.dfso_code
        LEFT JOIN ${tables.FPS} f ON a.afso_code = f.afso_code
        WHERE d.id = $1
        GROUP BY d.id, d.dfso_code, d.description_en, d.description_ll, d.is_active
      `;
      const result = await db.query(query, [dfsoId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DFSOService();
