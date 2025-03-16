/**
 * FireSight AI API - Main Entry Point
 * 
 * This file serves as the main entry point for the FireSight AI API.
 * It sets up an Express server with REST and GraphQL endpoints.
 * 
 * @version 2.0.0
 * @date March 2025
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs, resolvers } = require('./graphql');
const routes = require('./routes');
const errorMiddleware = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');
const config = require('../config');
const logger = require('../utils/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet()); // Set security HTTP headers
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  }
});
app.use('/api', apiLimiter);

// Performance middleware
app.use(compression()); // Compress all responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'FireSight AI API is operational',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Authentication middleware for protected routes
app.use('/api', authMiddleware);

// REST API routes
app.use('/api', routes);

// GraphQL setup
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: config.environment !== 'production',
  formatError: (error) => {
    logger.error(error);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      path: error.path
    };
  }
});

// Start Apollo server and apply middleware
async function startApolloServer() {
  await apolloServer.start();
  
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        // Get user from auth token
        const user = req.user; // Set by authMiddleware
        return { user };
      },
    }),
  );
}

// Start Apollo server (placeholder - will be implemented when filled)
// startApolloServer().catch(err => {
//   logger.error('Failed to start Apollo server', err);
// });

// Error handling middleware
app.use(errorMiddleware);

// Start Express server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`REST API available at http://localhost:${PORT}/api`);
    // logger.info(`GraphQL API available at http://localhost:${PORT}/graphql`);
  });
}

// Export for testing
module.exports = app; 