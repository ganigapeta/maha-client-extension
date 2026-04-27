/**
 * Standard success response format
 */
const successResponse = (data, message = 'Success', pagination = null) => {
  const response = {
    success: true,
    message: message,
    data: data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

/**
 * Standard error response format
 */
const errorResponse = (message = 'An error occurred', errors = null, statusCode = 500) => {
  const response = {
    success: false,
    message: message,
    statusCode: statusCode
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Validation error response
 */
const validationErrorResponse = (errors) => {
  return errorResponse('Validation failed', errors, 400);
};

/**
 * Not found error response
 */
const notFoundResponse = (resource = 'Resource') => {
  return errorResponse(`${resource} not found`, null, 404);
};

/**
 * Database error response
 */
const databaseErrorResponse = (error) => {
  console.error('Database error:', error);
  return errorResponse('Database operation failed', error.message, 500);
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
  databaseErrorResponse
};
