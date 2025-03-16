/**
 * Authentication Middleware
 * 
 * This middleware handles authentication and authorization.
 * It verifies JWT tokens and attaches the user to the request object.
 */

const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');
const ApiError = require('../utils/apiError');
const config = require('../../config');

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authMiddleware = (req, res, next) => {
  // Skip authentication for public routes
  if (isPublicRoute(req.path)) {
    return next();
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Authentication required', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError('Authentication token missing', 401);
    }
    
    // Verify token
    // This is a placeholder - will be implemented when filled
    // const decoded = jwt.verify(token, config.jwtSecret);
    // req.user = decoded;
    
    // PLACEHOLDER - For development, create a mock user
    // Remove this in production and uncomment the above code
    req.user = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user'
    };
    
    logger.debug(`Authenticated user: ${req.user.email}`);
    
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token expired', 401));
    }
    
    return next(error);
  }
};

/**
 * Check if route is public (doesn't require authentication)
 * @param {string} path - Request path
 * @returns {boolean} True if route is public
 */
const isPublicRoute = (path) => {
  const publicRoutes = [
    '/health',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password'
  ];
  
  return publicRoutes.some(route => path.endsWith(route));
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Required roles
 * @returns {Function} Express middleware function
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }
    
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.email} (role: ${req.user.role})`);
      return next(new ApiError('Access denied', 403));
    }
    
    return next();
  };
};

module.exports = authMiddleware;
module.exports.authorize = authorize; 