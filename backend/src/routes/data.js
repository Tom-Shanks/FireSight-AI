const express = require('express');
const router = express.Router();

// Get recent fires endpoint
router.get('/recent-fires', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    
    // Generate mock data for recent fires
    const recentFires = generateRecentFires(days);
    
    res.json(recentFires);
  } catch (error) {
    console.error('Error retrieving recent fires:', error);
    res.status(500).json({ error: 'Internal server error while retrieving recent fires data' });
  }
});

// Get high risk areas endpoint
router.get('/high-risk-areas', (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold) || 0.7;
    
    // Generate mock data for high risk areas
    const highRiskAreas = generateHighRiskAreas(threshold);
    
    res.json(highRiskAreas);
  } catch (error) {
    console.error('Error retrieving high risk areas:', error);
    res.status(500).json({ error: 'Internal server error while retrieving high risk areas data' });
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