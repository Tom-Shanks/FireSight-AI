/**
 * Risk API Routes
 * 
 * Routes for predicting and analyzing wildfire risk.
 */

const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const validate = require('../middleware/validate.middleware');
const { riskSchemas } = require('../models/validation');

/**
 * @route GET /api/risk/assessment
 * @description Get risk assessment for a location
 * @access Private
 */
router.get(
  '/assessment', 
  validate(riskSchemas.assessment), 
  riskController.getAssessment
);

/**
 * @route GET /api/risk/history
 * @description Get historical risk data for a location
 * @access Private
 */
router.get(
  '/history', 
  validate(riskSchemas.history), 
  riskController.getHistory
);

/**
 * @route POST /api/risk/predict
 * @description Predict future risk for an area
 * @access Private
 */
router.post(
  '/predict', 
  validate(riskSchemas.predict), 
  riskController.predictRisk
);

/**
 * @route GET /api/risk/factors
 * @description Get risk factors breakdown for a location
 * @access Private
 */
router.get(
  '/factors',
  validate(riskSchemas.factors),
  riskController.getRiskFactors
);

/**
 * @route GET /api/risk/map
 * @description Get risk map data for a region
 * @access Private
 */
router.get(
  '/map',
  validate(riskSchemas.map),
  riskController.getRiskMap
);

module.exports = router; 