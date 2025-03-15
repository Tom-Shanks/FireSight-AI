// Dashboard stats serverless function
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

    // In a real application, this would fetch data from a database
    // For now, we'll generate mock data
    const regions = ['Northern California', 'Southern California', 'Central Valley', 'Sierra Nevada', 'Coastal'];
    const fireTypes = ['Brush', 'Forest', 'Grass', 'Structure', 'Other'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const stats = {
      activeFires: Math.floor(Math.random() * 20) + 5,
      highRiskAreas: Math.floor(Math.random() * 50) + 20,
      averageRiskScore: Math.floor(Math.random() * 40) + 40,
      recentRainfall: Math.floor(Math.random() * 5),
      
      riskByRegion: regions.map(region => ({
        region,
        riskScore: Math.floor(Math.random() * 100)
      })),
      
      firesByType: fireTypes.map(type => ({
        type,
        count: Math.floor(Math.random() * 30) + 1
      })),
      
      monthlyPredictions: months.map(month => ({
        month,
        predictedFires: Math.floor(Math.random() * 15) + (month.match(/Jul|Aug|Sep/) ? 10 : 0)
      }))
    };
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
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