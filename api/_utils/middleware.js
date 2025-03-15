// Middleware handling for Vercel serverless functions
const express = require('express');

/**
 * Creates a middleware-wrapped handler for Vercel serverless functions
 * @param {Function} handler - The main request handler
 * @param {Array} middlewares - Array of middleware functions to apply
 * @returns {Function} - Vercel-compatible serverless function
 */
function createMiddlewareHandler(handler, middlewares = []) {
  return (req, res) => {
    // Create an Express app instance
    const app = express();
    
    // Apply all middleware
    middlewares.forEach(middleware => {
      app.use(middleware);
    });
    
    // Add JSON parsing middleware
    app.use(express.json());
    
    // Add the main handler
    app.all('*', handler);
    
    // Handle the request using the express app
    return app(req, res);
  };
}

module.exports = {
  createMiddlewareHandler
}; 