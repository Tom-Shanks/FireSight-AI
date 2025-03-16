/**
 * Risk Controller
 * 
 * Controller functions for wildfire risk prediction and analysis.
 */

const riskService = require('../services/risk.service');
const logger = require('../../utils/logger');
const ApiError = require('../utils/apiError');

/**
 * Get risk assessment for a location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAssessment = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 1, timeframe = 7 } = req.query;
    
    // Convert string parameters to numbers
    const params = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: parseFloat(radius),
      timeframe: parseInt(timeframe, 10)
    };
    
    logger.info(`Getting risk assessment for location (${params.latitude}, ${params.longitude})`);
    
    // Call service function to get assessment
    const assessment = await riskService.getAssessment(params);
    
    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    logger.error('Error in getAssessment controller', error);
    return next(new ApiError(error.message, error.statusCode || 500));
  }
};

/**
 * Get historical risk data for a location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getHistory = async (req, res, next) => {
  try {
    const { latitude, longitude, startDate, endDate } = req.query;
    
    // Convert string parameters
    const params = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      startDate,
      endDate
    };
    
    logger.info(`Getting risk history for location (${params.latitude}, ${params.longitude})`);
    
    // Call service function to get history
    const history = await riskService.getHistory(params);
    
    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error in getHistory controller', error);
    return next(new ApiError(error.message, error.statusCode || 500));
  }
};

/**
 * Predict future risk for an area
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const predictRisk = async (req, res, next) => {
  try {
    const { 
      location, 
      timeframe, 
      environmentalFactors = {},
      modelParameters = {} 
    } = req.body;
    
    logger.info(`Predicting risk for location (${location.latitude}, ${location.longitude})`);
    
    // Call service function to predict risk
    const prediction = await riskService.predictRisk(location, timeframe, environmentalFactors, modelParameters);
    
    return res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (error) {
    logger.error('Error in predictRisk controller', error);
    return next(new ApiError(error.message, error.statusCode || 500));
  }
};

/**
 * Get risk factors breakdown for a location
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRiskFactors = async (req, res, next) => {
  try {
    const { latitude, longitude, date } = req.query;
    
    // Convert string parameters
    const params = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      date: date || new Date().toISOString().split('T')[0]
    };
    
    logger.info(`Getting risk factors for location (${params.latitude}, ${params.longitude})`);
    
    // Call service function to get risk factors
    const factors = await riskService.getRiskFactors(params);
    
    return res.status(200).json({
      success: true,
      data: factors
    });
  } catch (error) {
    logger.error('Error in getRiskFactors controller', error);
    return next(new ApiError(error.message, error.statusCode || 500));
  }
};

/**
 * Get risk map data for a region
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRiskMap = async (req, res, next) => {
  try {
    const { 
      bounds, 
      resolution = 'medium',
      date = new Date().toISOString().split('T')[0]
    } = req.query;
    
    logger.info(`Getting risk map for region defined by ${bounds}`);
    
    // Call service function to get risk map
    const mapData = await riskService.getRiskMap(bounds, resolution, date);
    
    return res.status(200).json({
      success: true,
      data: mapData
    });
  } catch (error) {
    logger.error('Error in getRiskMap controller', error);
    return next(new ApiError(error.message, error.statusCode || 500));
  }
};

module.exports = {
  getAssessment,
  getHistory,
  predictRisk,
  getRiskFactors,
  getRiskMap
}; 