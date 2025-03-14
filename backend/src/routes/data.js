const express = require('express');
const router = express.Router();
const { fireData, weather, satellite } = require('../services');

// Get recent fires endpoint
router.get('/recent-fires', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Try to get real fire data
    let firesData = [];
    let dataSource = 'mock';
    
    try {
      console.log('Fetching active fires data from NASA FIRMS API');
      
      // Default to continental US bounding box for demonstration
      // In a real app, this could be configured or user-specific
      const minLat = 24.0;  // Southern US border
      const maxLat = 49.0;  // Northern US border
      const minLon = -125.0; // Western US border
      const maxLon = -66.0;  // Eastern US border
      
      firesData = await fireData.getActiveFires(minLat, maxLat, minLon, maxLon, 'viirs-snpp', days);
      
      if (firesData && firesData.length > 0) {
        dataSource = 'nasa-firms';
        console.log(`Successfully retrieved ${firesData.length} fires from NASA FIRMS API`);
        
        // Transform the data to match our API format
        firesData = transformFiresData(firesData);
      } else {
        console.log('No fires data returned from NASA FIRMS API, falling back to mock data');
        firesData = generateRecentFires(days);
      }
    } catch (error) {
      console.warn('Failed to fetch fires from NASA FIRMS API:', error.message);
      console.log('Falling back to mock fire data');
      firesData = generateRecentFires(days);
    }
    
    res.json({
      data_source: dataSource,
      fires: firesData
    });
  } catch (error) {
    console.error('Error retrieving recent fires:', error);
    res.status(500).json({ error: 'Internal server error while retrieving recent fires data' });
  }
});

// Transform NASA FIRMS data to our API format
function transformFiresData(firmsData) {
  const locations = [
    'Redwood Forest', 'Eagle Mountain', 'Pinecrest Valley', 
    'Oakridge Hills', 'Cedar Canyon', 'Maple Woods',
    'Aspen Heights', 'Willow Creek', 'Blue River Reserve',
    'Green Valley', 'Rocky Peak', 'Sunset Ridge'
  ];
  
  return firmsData.map((fire, index) => {
    // Generate a random location name
    const locationIndex = Math.floor(Math.random() * locations.length);
    
    // Random containment percentage and status (these aren't provided by FIRMS)
    const containment = Math.floor(Math.random() * 100);
    const status = containment === 100 ? 'contained' : 
                  containment > 75 ? 'nearly contained' : 
                  containment > 40 ? 'partially contained' : 'active';
    
    // Parse date and time from FIRMS format
    let detectionTime;
    if (fire.detectionDate && fire.detectionTime) {
      // Parse date in format YYYY-MM-DD and time in format HHMM
      const date = fire.detectionDate;
      const time = fire.detectionTime.toString().padStart(4, '0');
      
      // Convert to ISO format
      const year = date.substring(0, 4);
      const month = date.substring(5, 7);
      const day = date.substring(8, 10);
      const hour = time.substring(0, 2);
      const minute = time.substring(2, 4);
      
      detectionTime = `${year}-${month}-${day}T${hour}:${minute}:00Z`;
    } else {
      // Fallback to current time
      detectionTime = new Date().toISOString();
    }
    
    // Calculate fire size (not provided by FIRMS, so we'll estimate based on intensity)
    const intensity = fire.intensity || fire.bright_ti4 || fire.bright_ti5 || 5;
    const normalizedIntensity = Math.min(Math.max(intensity / 400, 0.1), 1); // Normalize to 0.1-1
    
    const sizeAcres = Math.floor(normalizedIntensity * 5000);
    
    return {
      id: `fire-${Date.now()}-${index}`,
      name: `${locations[locationIndex]} Fire`,
      location: {
        latitude: fire.latitude,
        longitude: fire.longitude,
        description: `Near ${locations[locationIndex]}`
      },
      detection_time: detectionTime,
      status: status,
      intensity: Math.floor(normalizedIntensity * 10), // Scale to 1-10
      size: {
        acres: sizeAcres,
        hectares: Math.floor(sizeAcres * 0.4047)
      },
      containment_percentage: containment,
      cause: Math.random() > 0.3 ? 'natural' : 'human',
      resources_deployed: {
        firefighters: Math.floor(Math.random() * 200) + 50,
        vehicles: Math.floor(Math.random() * 30) + 5,
        aircraft: Math.floor(Math.random() * 5)
      },
      firms_data: {
        confidence: fire.confidence || 'nominal',
        bright_ti4: fire.bright_ti4,
        bright_ti5: fire.bright_ti5,
        frp: fire.frp
      }
    };
  });
}

// Get high risk areas endpoint
router.get('/high-risk-areas', async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.7;
    
    // In a real implementation, high-risk areas would be calculated from 
    // a combination of weather data, vegetation density, and historical patterns
    // For now, we'll use mock data but include some real data-based elements where possible
    
    // Generate mock data for high risk areas
    const highRiskAreas = generateHighRiskAreas(threshold);
    
    res.json(highRiskAreas);
  } catch (error) {
    console.error('Error retrieving high risk areas:', error);
    res.status(500).json({ error: 'Internal server error while retrieving high risk areas data' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Try to get real fire counts
    let activeFires = 0;
    let weatherData = null;
    let realDataIncluded = false;
    
    try {
      // Get active fires count from NASA FIRMS data
      // Default to a US bounding box
      const minLat = 24.0;
      const maxLat = 49.0;
      const minLon = -125.0;
      const maxLon = -66.0;
      
      const firesData = await fireData.getActiveFires(minLat, maxLat, minLon, maxLon, 'viirs-snpp', 1);
      
      if (firesData && firesData.length > 0) {
        activeFires = firesData.length;
        realDataIncluded = true;
      }
      
      // Get sample weather data for a major city (e.g., San Francisco)
      weatherData = await weather.getCurrentWeather(37.7749, -122.4194);
    } catch (error) {
      console.warn('Failed to fetch real data for dashboard:', error.message);
      // Continue with mock data for the rest
    }
    
    // Generate mock stats with any available real data
    const regions = ['Northern California', 'Southern California', 'Central Valley', 'Sierra Nevada', 'Coastal'];
    const fireTypes = ['Brush', 'Forest', 'Grass', 'Structure', 'Other'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const stats = {
      activeFires: realDataIncluded ? activeFires : Math.floor(Math.random() * 20) + 5,
      highRiskAreas: Math.floor(Math.random() * 50) + 20,
      averageRiskScore: Math.floor(Math.random() * 40) + 40,
      recentRainfall: weatherData ? (weatherData.rain?.['1h'] || 0) : Math.floor(Math.random() * 5),
      
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
      })),
      
      dataSource: realDataIncluded ? 'partially-real' : 'simulation'
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error while retrieving dashboard stats' });
  }
});

// Helper functions
function generateRecentFires(days) {
  const fires = [];
  const numFires = Math.floor(Math.random() * 10) + 5; // 5-15 fires
  
  // Current date
  const currentDate = new Date();
  
  // Names for locations
  const locations = [
    'Redwood Forest', 'Eagle Mountain', 'Pinecrest Valley', 
    'Oakridge Hills', 'Cedar Canyon', 'Maple Woods',
    'Aspen Heights', 'Willow Creek', 'Blue River Reserve',
    'Green Valley', 'Rocky Peak', 'Sunset Ridge'
  ];
  
  // Generate random fires
  for (let i = 0; i < numFires; i++) {
    // Random date within the specified days
    const daysAgo = Math.floor(Math.random() * days);
    const hours = Math.floor(Math.random() * 24);
    const date = new Date(currentDate);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hours);
    
    // Random coordinates in the continental US (approximate)
    const latitude = 35 + Math.random() * 10; // 35-45°N
    const longitude = -120 + Math.random() * 35; // 120-85°W
    
    // Random intensity 1-10
    const intensity = Math.floor(Math.random() * 10) + 1;
    
    // Random size
    const size = {
      acres: Math.floor(Math.random() * 5000) + 10,
      hectares: Math.floor((Math.random() * 5000 + 10) * 0.4047)
    };
    
    // Random location name
    const locationIndex = Math.floor(Math.random() * locations.length);
    
    // Random containment percentage
    const containment = daysAgo > days / 2 ? Math.floor(Math.random() * 60) + 40 : Math.floor(Math.random() * 40);
    
    fires.push({
      id: `fire-${Date.now()}-${i}`,
      name: `${locations[locationIndex]} Fire`,
      location: {
        latitude,
        longitude,
        description: `Near ${locations[locationIndex]}`
      },
      detection_time: date.toISOString(),
      status: containment === 100 ? 'contained' : containment > 75 ? 'nearly contained' : containment > 40 ? 'partially contained' : 'active',
      intensity,
      size,
      containment_percentage: containment,
      cause: Math.random() > 0.3 ? 'natural' : 'human',
      resources_deployed: {
        firefighters: Math.floor(Math.random() * 200) + 50,
        vehicles: Math.floor(Math.random() * 30) + 5,
        aircraft: Math.floor(Math.random() * 5)
      }
    });
  }
  
  // Sort by date, most recent first
  fires.sort((a, b) => new Date(b.detection_time) - new Date(a.detection_time));
  
  return fires;
}

function generateHighRiskAreas(threshold) {
  const areas = [];
  const numAreas = Math.floor(Math.random() * 10) + 8; // 8-18 areas
  
  // Names for regions
  const regions = [
    'Sierra Mountains', 'Coastal Range', 'Northern Highlands', 
    'Eastern Valley', 'Western Plains', 'Southern Foothills',
    'Central Basin', 'Dry Creek Watershed', 'Juniper Hills',
    'Sage Desert', 'Pine Valley', 'Cedar Mountains',
    'Golden Grasslands', 'Red Rock Canyon', 'Maple Ridge'
  ];
  
  // Generate random high-risk areas
  for (let i = 0; i < numAreas; i++) {
    // Random risk score close to or above threshold
    const adjustedThreshold = Math.max(0.5, threshold - 0.1);
    const riskScore = adjustedThreshold + (Math.random() * (1 - adjustedThreshold));
    
    // Random coordinates in the continental US (approximate)
    const latitude = 35 + Math.random() * 10; // 35-45°N
    const longitude = -120 + Math.random() * 35; // 120-85°W
    
    // Random region name
    const regionIndex = Math.floor(Math.random() * regions.length);
    
    // Random area size
    const areaKm2 = Math.floor(Math.random() * 500) + 50;
    
    // Risk factors that contribute to the overall risk
    const factors = {
      drought_index: Math.random() * 0.5 + 0.5, // 0.5-1.0
      vegetation_density: Math.random(),
      temperature_anomaly: Math.random() * 0.7 + 0.3, // 0.3-1.0
      wind_conditions: Math.random() * 0.8 + 0.2, // 0.2-1.0
      historical_fire_frequency: Math.random() * 0.6 + 0.2 // 0.2-0.8
    };
    
    // Monitoring recommendations
    const recommendations = [];
    if (riskScore > 0.8) {
      recommendations.push('Implement 24/7 monitoring');
      recommendations.push('Deploy additional ground sensors');
      recommendations.push('Increase aerial surveillance frequency');
    } else if (riskScore > 0.7) {
      recommendations.push('Daily monitoring recommended');
      recommendations.push('Regular ground patrols');
    } else {
      recommendations.push('Regular monitoring schedule');
    }
    
    // Last assessment date (within the last month)
    const assessmentDate = new Date();
    assessmentDate.setDate(assessmentDate.getDate() - Math.floor(Math.random() * 30));
    
    areas.push({
      id: `area-${Date.now()}-${i}`,
      name: `${regions[regionIndex]} Risk Zone`,
      risk_score: riskScore,
      location: {
        latitude,
        longitude,
        description: regions[regionIndex]
      },
      area_km2: areaKm2,
      risk_factors: factors,
      population_affected: Math.floor(Math.random() * 50000) + 1000,
      last_assessment: assessmentDate.toISOString().split('T')[0],
      monitoring_recommendations: recommendations,
      alert_level: riskScore > 0.8 ? 'severe' : riskScore > 0.7 ? 'high' : 'moderate'
    });
  }
  
  // Sort by risk score, highest first
  areas.sort((a, b) => b.risk_score - a.risk_score);
  
  return areas;
}

module.exports = router; 