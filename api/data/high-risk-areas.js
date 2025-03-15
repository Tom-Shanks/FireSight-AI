// High risk areas serverless function
const cors = require('cors');
const { createMiddlewareHandler } = require('../_utils/middleware');

async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only GET requests are allowed for this endpoint'
      });
    }

    // Parse the threshold parameter
    const threshold = parseFloat(req.query.threshold) || 0.7;

    // In a real application, this would fetch data from a database or ML model
    // For now, we'll generate mock data
    const baseLatitude = 37.5;
    const baseLongitude = -120;
    const points = [];
    
    for (let i = 0; i < 100; i++) {
      const latOffset = (Math.random() - 0.5) * 5;
      const lngOffset = (Math.random() - 0.5) * 5;
      const riskScore = Math.floor(Math.random() * 100);
      
      // Only include points with risk score above the threshold
      if (riskScore / 100 >= threshold) {
        points.push({
          latitude: baseLatitude + latOffset,
          longitude: baseLongitude + lngOffset,
          riskScore,
          region: `Region ${Math.floor(Math.random() * 10) + 1}`,
          vegetationDensity: `${Math.floor(Math.random() * 100)}%`,
          lastRainfall: `${Math.floor(Math.random() * 30) + 1} days ago`
        });
      }
    }
    
    res.status(200).json(points);
  } catch (error) {
    console.error('Error fetching high risk areas:', error);
    res.status(500).json({
      error: 'Failed to fetch high risk areas',
      message: error.message
    });
  }
}

// Create the middleware-wrapped handler with CORS support
module.exports = createMiddlewareHandler(handler, [
  cors({
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'https://firesight-ai.vercel.app']
  })
]); 