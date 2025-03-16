/**
 * Application Configuration
 * 
 * This module loads environment variables and provides configuration
 * for different parts of the application.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment
const environment = process.env.NODE_ENV || 'development';

// Server configuration
const server = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || 'localhost',
};

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// JWT configuration
const jwt = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

// Database configuration
const database = {
  url: process.env.DATABASE_URL || 'mongodb://localhost:27017/firesight',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};

// AWS configuration
const aws = {
  region: process.env.AWS_REGION || 'us-west-2',
  s3Bucket: process.env.S3_BUCKET || 'firesight-data',
};

// ML model configuration
const mlModels = {
  riskModelPath: process.env.RISK_MODEL_PATH || path.join(process.cwd(), 'models', 'risk'),
  simulationModelPath: process.env.SIMULATION_MODEL_PATH || path.join(process.cwd(), 'models', 'simulation'),
};

// Logging configuration
const logging = {
  level: environment === 'development' ? 'debug' : 'info',
  logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
};

// Rate limiting configuration
const rateLimit = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per windowMs
};

// Export configuration
module.exports = {
  environment,
  server,
  corsOrigins,
  jwt,
  database,
  aws,
  mlModels,
  logging,
  rateLimit,
  isDevelopment: environment === 'development',
  isProduction: environment === 'production',
  isTest: environment === 'test',
}; 