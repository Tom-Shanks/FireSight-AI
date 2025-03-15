// API root endpoint
module.exports = (req, res) => {
  res.status(200).json({
    name: 'FireSight AI API',
    version: '1.0.0',
    status: 'operational',
    documentation: '/api/README.md',
    endpoints: [
      {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint'
      },
      {
        path: '/api/predict/risk',
        method: 'POST',
        description: 'Predict wildfire risk for a location'
      },
      {
        path: '/api/data/dashboard-stats',
        method: 'GET',
        description: 'Get dashboard statistics'
      },
      {
        path: '/api/data/high-risk-areas',
        method: 'GET',
        description: 'Get high-risk areas data'
      },
      {
        path: '/api/data/recent-fires',
        method: 'GET',
        description: 'Get recent fires data'
      }
    ],
    timestamp: new Date().toISOString()
  });
}; 