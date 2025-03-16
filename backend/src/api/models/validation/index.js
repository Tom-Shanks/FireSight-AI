/**
 * Validation Schemas
 * 
 * This file exports validation schemas for API request validation.
 */

const Joi = require('joi');

// Risk assessment validation schema
const riskSchemas = {
  // GET /api/risk/assessment
  assessment: {
    query: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .description('Latitude of the location'),
      longitude: Joi.number().min(-180).max(180).required()
        .description('Longitude of the location'),
      radius: Joi.number().min(0.1).max(100).default(1)
        .description('Radius in kilometers'),
      timeframe: Joi.number().integer().min(1).max(30).default(7)
        .description('Prediction timeframe in days')
    })
  },
  
  // GET /api/risk/history
  history: {
    query: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .description('Latitude of the location'),
      longitude: Joi.number().min(-180).max(180).required()
        .description('Longitude of the location'),
      startDate: Joi.date().iso().required()
        .description('Start date in ISO format'),
      endDate: Joi.date().iso().required()
        .description('End date in ISO format')
    }).custom((value, helpers) => {
      if (new Date(value.startDate) >= new Date(value.endDate)) {
        return helpers.error('custom.dateRange', { message: 'endDate must be after startDate' });
      }
      return value;
    })
  },
  
  // POST /api/risk/predict
  predict: {
    body: Joi.object({
      location: Joi.object({
        latitude: Joi.number().min(-90).max(90).required()
          .description('Latitude of the location'),
        longitude: Joi.number().min(-180).max(180).required()
          .description('Longitude of the location')
      }).required(),
      timeframe: Joi.object({
        days: Joi.number().integer().min(1).max(30).required()
          .description('Number of days to predict'),
        interval: Joi.string().valid('daily', 'hourly').default('daily')
          .description('Prediction interval')
      }).required(),
      environmentalFactors: Joi.object({
        temperature: Joi.number().min(-50).max(60)
          .description('Temperature in Celsius'),
        humidity: Joi.number().min(0).max(100)
          .description('Humidity percentage'),
        windSpeed: Joi.number().min(0).max(200)
          .description('Wind speed in km/h'),
        precipitation: Joi.number().min(0)
          .description('Precipitation in mm'),
        vegetationDensity: Joi.number().min(0).max(100)
          .description('Vegetation density percentage')
      }).default({}),
      modelParameters: Joi.object({
        version: Joi.string().default('latest')
          .description('Model version to use'),
        sensitivity: Joi.number().min(0).max(1).default(0.5)
          .description('Model sensitivity'),
        includeConfidence: Joi.boolean().default(true)
          .description('Include confidence scores in results')
      }).default({})
    })
  },
  
  // GET /api/risk/factors
  factors: {
    query: Joi.object({
      latitude: Joi.number().min(-90).max(90).required()
        .description('Latitude of the location'),
      longitude: Joi.number().min(-180).max(180).required()
        .description('Longitude of the location'),
      date: Joi.date().iso().default(() => new Date().toISOString().split('T')[0])
        .description('Date for risk factors')
    })
  },
  
  // GET /api/risk/map
  map: {
    query: Joi.object({
      bounds: Joi.string().pattern(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/).required()
        .description('Geographical bounds in format "lat1,lon1,lat2,lon2"'),
      resolution: Joi.string().valid('low', 'medium', 'high').default('medium')
        .description('Map resolution'),
      date: Joi.date().iso().default(() => new Date().toISOString().split('T')[0])
        .description('Date for the risk map')
    })
  }
};

// Export all validation schemas
module.exports = {
  riskSchemas
}; 