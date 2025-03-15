// Recent fires serverless function
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

    // Parse the days parameter
    const days = parseInt(req.query.days) || 7;

    // In a real application, this would fetch data from a database
    // For now, we'll generate mock data
    const baseLatitude = 37.5;
    const baseLongitude = -120;
    const fires = [];
    
    const statuses = ['Active', 'Contained', 'Under Control'];
    
    // Get current date for calculating start dates
    const now = new Date();
    
    for (let i = 0; i < 15; i++) {
      const latOffset = (Math.random() - 0.5) * 5;
      const lngOffset = (Math.random() - 0.5) * 5;
      
      // Random date within the requested days
      const daysAgo = Math.floor(Math.random() * days);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysAgo);
      
      fires.push({
        latitude: baseLatitude + latOffset,
        longitude: baseLongitude + lngOffset,
        name: `Wildfire ${String.fromCharCode(65 + i)}`,
        startDate: startDate.toLocaleDateString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        acres: Math.floor(Math.random() * 10000),
        containment: Math.floor(Math.random() * 100)
      });
    }
    
    res.status(200).json(fires);
  } catch (error) {
    console.error('Error fetching recent fires:', error);
    res.status(500).json({
      error: 'Failed to fetch recent fires',
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