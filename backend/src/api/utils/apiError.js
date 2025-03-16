/**
 * Custom API Error Class
 * 
 * This class extends the built-in Error class to include
 * additional properties for API errors.
 */

class ApiError extends Error {
  /**
   * Create a new API error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} data - Additional error data
   */
  constructor(message, statusCode = 500, code = null, data = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || this.getCodeFromStatus(statusCode);
    this.data = data;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Get error code from HTTP status
   * @param {number} statusCode - HTTP status code
   * @returns {string} Error code
   */
  getCodeFromStatus(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE'
    };
    
    return codes[statusCode] || 'INTERNAL_SERVER_ERROR';
  }
  
  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static badRequest(message = 'Bad Request', data = null) {
    return new ApiError(message, 400, 'BAD_REQUEST', data);
  }
  
  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static unauthorized(message = 'Unauthorized', data = null) {
    return new ApiError(message, 401, 'UNAUTHORIZED', data);
  }
  
  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static forbidden(message = 'Forbidden', data = null) {
    return new ApiError(message, 403, 'FORBIDDEN', data);
  }
  
  /**
   * Create a 404 Not Found error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static notFound(message = 'Not Found', data = null) {
    return new ApiError(message, 404, 'NOT_FOUND', data);
  }
  
  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static conflict(message = 'Conflict', data = null) {
    return new ApiError(message, 409, 'CONFLICT', data);
  }
  
  /**
   * Create a 429 Too Many Requests error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static tooManyRequests(message = 'Too Many Requests', data = null) {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS', data);
  }
  
  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @param {Object} data - Additional error data
   * @returns {ApiError} API error
   */
  static internal(message = 'Internal Server Error', data = null) {
    return new ApiError(message, 500, 'INTERNAL_SERVER_ERROR', data);
  }
}

module.exports = ApiError; 