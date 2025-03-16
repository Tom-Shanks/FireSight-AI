/**
 * API Routes Index
 * 
 * This file combines all route modules and exports them as a single router.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const riskRoutes = require('./risk.routes');
const simulationRoutes = require('./simulation.routes');
const assessmentRoutes = require('./assessment.routes');
const userRoutes = require('./user.routes');
const dataRoutes = require('./data.routes');

// Register route modules
router.use('/auth', authRoutes);
router.use('/risk', riskRoutes);
router.use('/simulation', simulationRoutes);
router.use('/assessment', assessmentRoutes);
router.use('/user', userRoutes);
router.use('/data', dataRoutes);

// Export the router
module.exports = router; 