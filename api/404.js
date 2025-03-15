// Custom 404 handler for API routes
module.exports = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested API endpoint does not exist',
      timestamp: new Date().toISOString()
    }
  });
}; 