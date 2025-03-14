// This is the main entry point for the backend
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'FireSight AI API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Risk prediction endpoint
app.post('/api/predict/risk', (req, res) => {
  try {
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
});

// Get high risk areas
app.get('/api/data/high-risk-areas', (req, res) => {
  try {
    // In a real application, this would fetch data from a database
    // For now, we'll generate mock data
    const highRiskAreas = generateMockRiskData();
    
    res.status(200).json(highRiskAreas);
  } catch (error) {
    console.error('Error fetching high risk areas:', error);
    res.status(500).json({
      error: 'Failed to fetch high risk areas',
      message: error.message
    });
  }
});

// Get recent fires
app.get('/api/data/recent-fires', (req, res) => {
  try {
    // In a real application, this would fetch data from a database
    // For now, we'll generate mock data
    const recentFires = generateMockFireData();
    
    res.status(200).json(recentFires);
  } catch (error) {
    console.error('Error fetching recent fires:', error);
    res.status(500).json({
      error: 'Failed to fetch recent fires',
      message: error.message
    });
  }
});

// Get dashboard stats
app.get('/api/data/dashboard-stats', (req, res) => {
  try {
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
});

// Fire spread simulation endpoint
app.post('/api/simulate/spread', (req, res) => {
  try {
    const {
      latitude,
      longitude,
      windSpeed,
      windDirection,
      temperature,
      humidity,
      vegetationDensity
    } = req.body;

    // In a real application, this would call a fire spread simulation model
    // For now, we'll generate a mock response
    
    const spreadDirection = windDirection;
    const spreadSpeed = windSpeed * (1 + (30 - humidity) / 100) * (vegetationDensity / 50);
    
    // Create a mock spread pattern (points radiating outward from origin)
    const spreadPattern = [];
    for (let i = 0; i < 24; i++) {
      // More points in the wind direction
      const angle = (i * 15 * Math.PI / 180) + (windDirection * Math.PI / 180);
      const distance = 0.02 * (1 + Math.cos(angle - (windDirection * Math.PI / 180)));
      
      spreadPattern.push({
        latitude: latitude + distance * Math.sin(angle),
        longitude: longitude + distance * Math.cos(angle),
        timeToReach: Math.floor(distance * 50 / spreadSpeed * 60), // minutes
        intensity: Math.floor(70 + Math.random() * 30) // 70-100 scale
      });
    }
    
    res.status(200).json({
      origin: { latitude, longitude },
      spreadDirection,
      spreadSpeed,
      spreadPattern,
      estimatedEvacuationTime: Math.floor(30 + Math.random() * 90), // 30-120 minutes
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in fire spread simulation:', error);
    res.status(500).json({
      error: 'Failed to process fire spread simulation',
      message: error.message
    });
  }
});

// Damage assessment endpoint
app.post('/api/assess/damage', (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius,
      fireIntensity,
      duration
    } = req.body;

    // In a real application, this would call a damage assessment model
    // For now, we'll generate a mock response
    
    const impactedArea = Math.PI * radius * radius; // square km
    const populationDensity = Math.floor(Math.random() * 500) + 10; // people per square km
    const impactedPopulation = Math.floor(impactedArea * populationDensity);
    
    const structures = Math.floor(impactedPopulation / 3); // approx. structures
    const estimatedStructureDamage = Math.min(100, Math.floor((fireIntensity / 100) * (duration / 24) * 80));
    const damagedStructures = Math.floor(structures * estimatedStructureDamage / 100);
    
    const forestAreaPercentage = Math.floor(Math.random() * 60) + 20; // 20-80%
    const forestAreaImpacted = impactedArea * forestAreaPercentage / 100;
    
    const wildlifeImpact = {
      high: fireIntensity > 80,
      displacementEstimate: Math.floor(impactedArea * 100 * (fireIntensity / 50)),
      habitatRecoveryTime: Math.floor(fireIntensity / 20) + Math.floor(duration / 12) // years
    };
    
    const economicImpact = {
      propertyDamage: Math.floor(damagedStructures * 250000), // $250k per structure avg
      naturalResourcesImpact: Math.floor(forestAreaImpacted * 500000), // $500k per sq km
      responseAndRecoveryCost: Math.floor(impactedArea * 1000000) // $1M per sq km
    };
    
    res.status(200).json({
      impactedArea,
      impactedPopulation,
      evacuationRecommended: fireIntensity > 60,
      structuralDamage: {
        totalStructures: structures,
        damagedStructures,
        damagePercentage: estimatedStructureDamage
      },
      environmentalImpact: {
        forestAreaImpacted,
        wildlifeImpact
      },
      economicImpact,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in damage assessment:', error);
    res.status(500).json({
      error: 'Failed to process damage assessment',
      message: error.message
    });
  }
});

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

// Helper function to generate mock risk data
function generateMockRiskData() {
  // California-centered mock data
  const baseLatitude = 37.5;
  const baseLongitude = -120;
  const points = [];
  
  for (let i = 0; i < 100; i++) {
    const latOffset = (Math.random() - 0.5) * 5;
    const lngOffset = (Math.random() - 0.5) * 5;
    
    points.push({
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      riskScore: Math.floor(Math.random() * 100),
      region: `Region ${Math.floor(Math.random() * 10) + 1}`,
      vegetationDensity: `${Math.floor(Math.random() * 100)}%`,
      lastRainfall: `${Math.floor(Math.random() * 30) + 1} days ago`
    });
  }
  
  return points;
}

// Helper function to generate mock fire data
function generateMockFireData() {
  // California-centered mock data
  const baseLatitude = 37.5;
  const baseLongitude = -120;
  const fires = [];
  
  const statuses = ['Active', 'Contained', 'Under Control'];
  
  for (let i = 0; i < 15; i++) {
    const latOffset = (Math.random() - 0.5) * 5;
    const lngOffset = (Math.random() - 0.5) * 5;
    
    fires.push({
      latitude: baseLatitude + latOffset,
      longitude: baseLongitude + lngOffset,
      name: `Wildfire ${String.fromCharCode(65 + i)}`,
      startDate: `${Math.floor(Math.random() * 30) + 1}/05/2023`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      acres: Math.floor(Math.random() * 10000),
      containment: Math.floor(Math.random() * 100)
    });
  }
  
  return fires;
}

// Start the server
app.listen(PORT, () => {
  console.log(`FireSight AI Backend running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 