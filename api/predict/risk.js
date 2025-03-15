// Risk prediction serverless function
const cors = require('cors');
const { createMiddlewareHandler } = require('../_utils/middleware');

// Helper function to generate recommended actions based on risk level
function getRecommendedActions(riskLevel) {
  switch (riskLevel) {
    case 'Low':
      return [
        'Continue regular monitoring',
        'Maintain standard fire prevention measures'
      ];
    case 'Moderate':
      return [
        'Increase monitoring frequency',
        'Review evacuation plans',
        'Clear dry vegetation near structures'
      ];
    case 'High':
      return [
        'Activate community alert systems',
        'Prepare for possible evacuation',
        'Clear all flammable materials from around structures',
        'Ensure water sources are accessible'
      ];
    case 'Extreme':
      return [
        'Consider pre-emptive evacuation of vulnerable populations',
        'Deploy fire prevention resources to the area',
        'Activate emergency response teams',
        'Implement strict fire prevention measures'
      ];
    default:
      return ['Maintain standard fire prevention measures'];
  }
}

// Main handler function
async function handler(req, res) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        message: 'Only POST requests are allowed for this endpoint'
      });
    }

    const {
      latitude,
      longitude,
      date,
      vegetationDensity,
      lastRainfall,
      temperature,
      windSpeed,
      humidity,
      region
    } = req.body;

    // In a real application, this would call a machine learning model
    // For now, we'll generate a mock response
    
    // Generate a risk score based on input parameters
    let baseScore = Math.random() * 30 + 40; // Base score between 40-70
    
    // Adjust based on vegetation density (higher = more risk)
    baseScore += (vegetationDensity - 50) * 0.2;
    
    // Adjust based on days since last rainfall (more days = more risk)
    baseScore += lastRainfall * 0.5;
    
    // Adjust based on temperature (higher = more risk)
    baseScore += (temperature - 70) * 0.3;
    
    // Adjust based on wind speed (higher = more risk)
    baseScore += windSpeed * 1.5;
    
    // Adjust based on humidity (lower = more risk)
    baseScore -= humidity * 0.2;
    
    // Cap between 0-100
    const riskScore = Math.min(Math.max(Math.round(baseScore), 0), 100);
    
    // Determine risk level
    let riskLevel;
    if (riskScore < 30) riskLevel = 'Low';
    else if (riskScore < 60) riskLevel = 'Moderate';
    else if (riskScore < 80) riskLevel = 'High';
    else riskLevel = 'Extreme';
    
    // Generate contributing factors
    const factors = [];
    if (vegetationDensity > 60) factors.push('High vegetation density');
    if (lastRainfall > 14) factors.push('Extended period without rainfall');
    if (temperature > 85) factors.push('High temperature');
    if (windSpeed > 10) factors.push('Strong winds');
    if (humidity < 30) factors.push('Low humidity');
    
    // If no factors were significant enough, add a generic one
    if (factors.length === 0) {
      factors.push('Combination of environmental factors');
    }
    
    // Send response
    res.status(200).json({
      riskScore,
      riskLevel,
      contributingFactors: factors,
      recommendedActions: getRecommendedActions(riskLevel),
      location: {
        latitude,
        longitude,
        region
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in risk prediction:', error);
    res.status(500).json({
      error: 'Failed to process risk prediction',
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