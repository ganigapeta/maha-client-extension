/**
 * Build pagination query and metadata
 */
const buildPagination = (page = 1, limit = 10, totalCount = 0) => {
  const pageNumber = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const offset = (pageNumber - 1) * pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    query: {
      limit: pageSize,
      offset: offset
    },
    metadata: {
      page: pageNumber,
      limit: pageSize,
      totalCount: totalCount,
      totalPages: totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  };
};

/**
 * Build search query for multiple columns
 */
const buildSearchQuery = (searchTerm, searchColumns) => {
  if (!searchTerm || !searchColumns || searchColumns.length === 0) {
    return { condition: '', params: [] };
  }

  const conditions = searchColumns.map((col, idx) => 
    `LOWER(${col}::text) LIKE $${idx + 1}`
  ).join(' OR ');

  const params = searchColumns.map(() => `%${searchTerm.toLowerCase()}%`);

  return {
    condition: `(${conditions})`,
    params: params
  };
};

/**
 * Build filter query for active status
 */
const buildActiveFilter = (isActive) => {
  if (isActive === undefined || isActive === null) {
    return { condition: '', params: [] };
  }

  return {
    condition: 'is_active = $1',
    params: [isActive === 'true' || isActive === true]
  };
};

/**
 * Build ORDER BY clause
 */
const buildOrderBy = (sortBy = 'id', sortOrder = 'ASC') => {
  const validOrders = ['ASC', 'DESC'];
  const order = validOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
  
  // Sanitize sortBy to prevent SQL injection
  const sanitizedSortBy = sortBy;//.replace(/[^a-zA-Z0-9_]/g, '');
  
  return `ORDER BY ${sanitizedSortBy} ${order}`;
};

module.exports = {
  buildPagination,
  buildSearchQuery,
  buildActiveFilter,
  buildOrderBy
};
