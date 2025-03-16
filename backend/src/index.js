/**
 * FireSight AI Backend - Main Entry Point
 * 
 * This file is the main entry point for the FireSight AI backend.
 * It initializes the API server and connects to the database.
 * 
 * @version 2.0.0
 * @date March 2025
 */

const api = require('./api');
const config = require('./config');
const logger = require('./utils/logger');

// Log application startup
logger.info(`Starting FireSight AI Backend v${config.version || '2.0.0'}`);
logger.info(`Environment: ${config.environment}`);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application continues running
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  // Perform cleanup
  process.exit(0);
});

// Export the API for testing
module.exports = api; 