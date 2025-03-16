/**
 * Request Validation Middleware
 * 
 * This middleware validates incoming requests against Joi schemas.
 */

const logger = require('../../utils/logger');
const ApiError = require('../utils/apiError');

/**
 * Validate request against schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => (req, res, next) => {
  const validationOptions = {
    abortEarly: false, // Include all errors
    allowUnknown: true, // Ignore unknown props
    stripUnknown: true // Remove unknown props
  };

  // Validate request body, query, and params
  const { error, value } = validateRequest(req, schema, validationOptions);

  if (error) {
    const errorMessage = error.details
      .map((detail) => detail.message)
      .join(', ');
    
    logger.warn(`Validation error: ${errorMessage}`);
    
    return next(new ApiError(errorMessage, 400));
  }

  // Replace request properties with validated values
  Object.assign(req, value);
  
  return next();
};

/**
 * Validate request against schema
 * @param {Object} req - Express request object
 * @param {Object} schema - Joi validation schema
 * @param {Object} options - Joi validation options
 * @returns {Object} Validation result
 */
const validateRequest = (req, schema, options) => {
  const result = { value: { body: req.body, query: req.query, params: req.params } };
  
  // Validate request body
  if (schema.body) {
    const { error, value } = schema.body.validate(req.body, options);
    if (error) {
      result.error = error;
      return result;
    }
    result.value.body = value;
  }
  
  // Validate request query
  if (schema.query) {
    const { error, value } = schema.query.validate(req.query, options);
    if (error) {
      result.error = error;
      return result;
    }
    result.value.query = value;
  }
  
  // Validate request params
  if (schema.params) {
    const { error, value } = schema.params.validate(req.params, options);
    if (error) {
      result.error = error;
      return result;
    }
    result.value.params = value;
  }
  
  return result;
};

module.exports = validate; 