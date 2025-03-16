/**
 * Error Handling Middleware
 * 
 * This middleware handles errors and sends appropriate responses.
 */

const logger = require('../../utils/logger');
const ApiError = require('../utils/apiError');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorMiddleware = (err, req, res, next) => {
  // If headers already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Default error status and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  
  // If it's our custom API error, use its properties
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code || errorCodeFromStatus(statusCode);
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from Mongoose)
    statusCode = 400;
    message = err.message;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError') {
    // Handle JWT authentication errors
    statusCode = 401;
    message = 'Invalid or expired token';
    errorCode = 'UNAUTHORIZED';
  } else {
    // For unexpected errors, log the stack trace
    logger.error('Unexpected error:', err);
  }

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Send error response
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

/**
 * Get error code from HTTP status
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error code
 */
const errorCodeFromStatus = (statusCode) => {
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
};

module.exports = errorMiddleware; 