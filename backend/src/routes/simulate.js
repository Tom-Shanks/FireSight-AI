const express = require('express');
const router = express.Router();

// Fire spread simulation endpoint
router.post('/spread', (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      start_time, 
      intensity, 
      wind_speed, 
      wind_direction, 
      simulation_hours, 
      consider_terrain, 
      consider_vegetation 
    } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required parameters: latitude and longitude are required' 
      });
    }

    // Generate spread predictions based on input parameters
    const spreadPredictions = generateSpreadPredictions(
      latitude,
      longitude,
      intensity || 5,
      wind_speed || 10,
      wind_direction || 0,
      simulation_hours || 24,
      consider_terrain,
      consider_vegetation
    );

    // Generate impacted regions
    const impactedRegions = generateImpactedRegions(spreadPredictions);

    // Generate evacuation routes
    const evacuationRoutes = generateEvacuationRoutes(latitude, longitude, spreadPredictions);

    // Calculate containment ETA
    const containmentETA = calculateContainmentETA(
      start_time,
      intensity || 5,
      wind_speed || 10,
      consider_terrain,
      consider_vegetation
    );

    // Determine required resources
    const requiredResources = calculateRequiredResources(
      intensity || 5,
      spreadPredictions.length
    );

    res.json({
      simulation_id: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      source_fire: {
        latitude,
        longitude,
        intensity: intensity || 5,
        start_time: start_time || new Date().toISOString()
      },
      spread_predictions: spreadPredictions,
      impacted_regions: impactedRegions,
      evacuation_routes: evacuationRoutes,
      containment_eta: containmentETA,
      required_resources: requiredResources,
      simulation_parameters: {
        wind_speed: wind_speed || 10,
        wind_direction: wind_direction || 0,
        simulation_hours: simulation_hours || 24,
        consider_terrain: !!consider_terrain,
        consider_vegetation: !!consider_vegetation
      }
    });
  } catch (error) {
    console.error('Error in fire spread simulation:', error);
    res.status(500).json({ error: 'Internal server error during fire spread simulation' });
  }
});

// Helper functions
function generateSpreadPredictions(lat, lng, intensity, windSpeed, windDirection, hours, considerTerrain, considerVegetation) {
  const predictions = [];
  const timeSteps = Math.min(12, hours); // Maximum 12 time steps to avoid huge response
  const baseSpreadRate = (intensity * 0.2) + (windSpeed * 0.1); // km per hour
  
  // Convert wind direction from degrees to radians
  const windRad = (windDirection * Math.PI) / 180;
  
  for (let i = 1; i <= timeSteps; i++) {
    const timeHours = (hours / timeSteps) * i;
    
    // Calculate base spread radius
    let spreadRadius = baseSpreadRate * timeHours;
    
    // Apply terrain and vegetation modifiers if considered
    if (considerTerrain) {
      // Simulate terrain effect with random variation
      spreadRadius *= (0.8 + Math.random() * 0.4);
    }
    
    if (considerVegetation) {
      // Simulate vegetation effect with random variation
      spreadRadius *= (0.7 + Math.random() * 0.6);
    }
    
    // Calculate spread direction influenced by wind
    const windInfluence = Math.min(0.7, windSpeed * 0.02); // Max 70% influence
    const spreadDirectionInfluence = windRad * windInfluence;
    
    // Generate predictions in different directions with wind influence
    const numDirections = 6;
    for (let dir = 0; dir < numDirections; dir++) {
      const angle = (dir * 2 * Math.PI / numDirections) + spreadDirectionInfluence;
      
      // Add some randomness to the spread distance in this direction
      const randomFactor = 0.8 + Math.random() * 0.4;
      const dirSpreadRadius = spreadRadius * randomFactor;
      
      // Calculate new position
      const newLat = parseFloat(lat) + (Math.cos(angle) * dirSpreadRadius * 0.009);
      const newLng = parseFloat(lng) + (Math.sin(angle) * dirSpreadRadius * 0.009);
      
      // Calculate intensity at this point (decreases with distance and time)
      const distanceFactor = 1 - (dirSpreadRadius / (baseSpreadRate * hours));
      const timeFactor = 1 - (timeHours / hours);
      const pointIntensity = Math.max(1, Math.round(intensity * distanceFactor * (0.5 + timeFactor * 0.5)));
      
      predictions.push({
        latitude: newLat,
        longitude: newLng,
        spread_radius_km: dirSpreadRadius,
        time_hours: timeHours,
        intensity: pointIntensity
      });
    }
  }
  
  return predictions;
}

function generateImpactedRegions(spreadPredictions) {
  const regions = [
    'North Forest Reserve',
    'Westside Community',
    'Eastern Hills',
    'South Valley',
    'Mountain View District',
    'Riverside Area',
    'Central Township'
  ];
  
  const impactedRegions = [];
  const numRegions = Math.min(regions.length, Math.ceil(spreadPredictions.length / 6));
  
  // Select random regions to be impacted
  const selectedRegions = new Set();
  while (selectedRegions.size < numRegions) {
    selectedRegions.add(Math.floor(Math.random() * regions.length));
  }
  
  // Generate impact data for selected regions
  Array.from(selectedRegions).forEach(index => {
    const impactLevel = Math.floor(Math.random() * 5) + 1; // 1-5 impact level
    
    impactedRegions.push({
      name: regions[index],
      impact_level: impactLevel,
      population_at_risk: Math.floor(Math.random() * 10000) + 500,
      infrastructure_count: Math.floor(Math.random() * 100) + 10,
      evacuation_priority: impactLevel >= 4 ? 'Immediate' : impactLevel >= 3 ? 'High' : 'Moderate'
    });
  });
  
  return impactedRegions;
}

function generateEvacuationRoutes(lat, lng, spreadPredictions) {
  const routes = [
    'Highway 1 North',
    'Route 9 East',
    'Mountain Pass Road',
    'Valley Way South',
    'Westside Expressway'
  ];
  
  const evacuationRoutes = [];
  const numRoutes = Math.min(routes.length, 3); // Maximum 3 evacuation routes
  
  // Select random routes
  const selectedRoutes = new Set();
  while (selectedRoutes.size < numRoutes) {
    selectedRoutes.add(Math.floor(Math.random() * routes.length));
  }
  
  // Generate route data
  Array.from(selectedRoutes).forEach(index => {
    evacuationRoutes.push({
      name: routes[index],
      distance_km: Math.floor(Math.random() * 30) + 5,
      estimated_time_minutes: Math.floor(Math.random() * 45) + 15,
      congestion_level: Math.floor(Math.random() * 100),
      status: Math.random() > 0.2 ? 'Open' : 'Limited Access'
    });
  });
  
  return evacuationRoutes;
}

function calculateContainmentETA(startTime, intensity, windSpeed, considerTerrain, considerVegetation) {
  // Parse start time or use current time
  const start = startTime ? new Date(startTime) : new Date();
  
  // Base containment time based on intensity and wind speed
  const baseHours = (intensity * 6) + (windSpeed * 0.5);
  
  // Apply terrain and vegetation modifiers if considered
  let totalHours = baseHours;
  if (considerTerrain) totalHours *= 1.3;
  if (considerVegetation) totalHours *= 1.2;
  
  // Add random variation
  totalHours = totalHours * (0.8 + Math.random() * 0.4);
  
  // Calculate containment date
  const containmentDate = new Date(start.getTime() + totalHours * 60 * 60 * 1000);
  
  return containmentDate.toISOString();
}

function calculateRequiredResources(intensity, numSpreadPoints) {
  const firefighterBase = intensity * 10;
  const firetrucksBase = Math.ceil(intensity * 2);
  const helicoptersBase = Math.ceil(intensity / 2);
  
  // Scale based on number of spread points
  const scaleFactor = Math.sqrt(numSpreadPoints) / 5;
  
  return {
    firefighters: Math.floor(firefighterBase * scaleFactor),
    firetrucks: Math.floor(firetrucksBase * scaleFactor),
    helicopters: Math.floor(helicoptersBase * scaleFactor),
    water_gallons: Math.floor((1000 * intensity * numSpreadPoints) / 2),
    bulldozers: Math.ceil((intensity * numSpreadPoints) / 15),
    support_personnel: Math.floor(firefighterBase * 0.5 * scaleFactor)
  };
}

module.exports = router; 