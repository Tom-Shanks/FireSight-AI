// API root endpoint
const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  // Check if client is requesting HTML (browser request)
  const acceptHeader = req.headers.accept || '';
  const wantsHtml = acceptHeader.includes('text/html');
  
  if (wantsHtml) {
    // Serve the HTML file for browser requests
    const filePath = path.join(__dirname, 'public', 'index.html');
    
    try {
      const htmlContent = fs.readFileSync(filePath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlContent);
    } catch (error) {
      console.error('Error serving index.html:', error);
      return res.status(500).send('Server error while serving HTML');
    }
  }
  
  // For API requests, return JSON as before
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