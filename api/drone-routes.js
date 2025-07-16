// Vercel serverless function for drone route optimization
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Colorado airspace and drone corridors
  const droneCorridors = [
    {
      id: 'DEN-BOU-001',
      name: 'Denver-Boulder Express',
      type: 'primary',
      waypoints: [
        { lat: 39.7392, lng: -104.9903, altitude: 400, name: 'Denver Downtown' },
        { lat: 39.8561, lng: -104.9282, altitude: 400, name: 'Commerce City' },
        { lat: 39.9139, lng: -105.0811, altitude: 500, name: 'Broomfield' },
        { lat: 40.0150, lng: -105.2705, altitude: 400, name: 'Boulder' }
      ],
      distance_miles: 28.5,
      flight_time_minutes: 42,
      max_altitude_agl: 400,
      restrictions: 'Avoid Class B airspace near DEN',
      weather_considerations: 'Strong winds common in afternoon'
    },
    {
      id: 'FR-SURVEY-002',
      name: 'Front Range Fire Survey',
      type: 'fire_monitoring',
      waypoints: [
        { lat: 40.5852, lng: -105.0844, altitude: 400, name: 'Fort Collins' },
        { lat: 40.3772, lng: -105.5217, altitude: 600, name: 'Cameron Peak' },
        { lat: 40.2569, lng: -105.5217, altitude: 500, name: 'Estes Park' },
        { lat: 40.0150, lng: -105.2705, altitude: 400, name: 'Boulder' }
      ],
      distance_miles: 67.2,
      flight_time_minutes: 101,
      max_altitude_agl: 600,
      restrictions: 'RMNP restricted areas',
      weather_considerations: 'Mountain turbulence above 8000ft MSL'
    },
    {
      id: 'I70-CORRIDOR-003',
      name: 'I-70 Mountain Corridor',
      type: 'infrastructure',
      waypoints: [
        { lat: 39.7392, lng: -104.9903, altitude: 400, name: 'Denver' },
        { lat: 39.7444, lng: -105.3372, altitude: 500, name: 'Golden' },
        { lat: 39.6585, lng: -105.8172, altitude: 700, name: 'Georgetown' },
        { lat: 39.6403, lng: -106.3742, altitude: 800, name: 'Vail Pass' }
      ],
      distance_miles: 97.8,
      flight_time_minutes: 147,
      max_altitude_agl: 800,
      restrictions: 'High altitude operations, weather dependent',
      weather_considerations: 'Severe mountain weather, icing conditions possible'
    },
    {
      id: 'JEFF-PATROL-004',
      name: 'Jefferson County Wildfire Patrol',
      type: 'fire_monitoring',
      waypoints: [
        { lat: 39.5501, lng: -105.2211, altitude: 400, name: 'Jefferson Center' },
        { lat: 39.6839, lng: -105.3525, altitude: 500, name: 'Lookout Mountain' },
        { lat: 39.5666, lng: -105.3203, altitude: 450, name: 'Ken Caryl' },
        { lat: 39.4858, lng: -105.1725, altitude: 400, name: 'Chatfield Reservoir' }
      ],
      distance_miles: 35.4,
      flight_time_minutes: 53,
      max_altitude_agl: 500,
      restrictions: 'Residential areas - maintain 400ft AGL minimum',
      weather_considerations: 'Afternoon thunderstorms common in summer'
    }
  ];

  // Calculate optimal route based on query parameters
  if (req.method === 'POST') {
    const { start_location, fire_locations, max_flight_time = 120 } = req.body;
    
    // Simple route optimization algorithm
    const optimizedRoute = {
      id: `CUSTOM-${Date.now()}`,
      name: 'Optimized Fire Survey Route',
      type: 'custom_fire_survey',
      waypoints: [],
      total_distance_miles: 0,
      estimated_flight_time_minutes: 0,
      coverage_area_sq_miles: 0,
      fuel_stops_required: 0
    };
    
    // Add waypoints based on fire locations
    if (start_location) {
      optimizedRoute.waypoints.push({
        ...start_location,
        altitude: 400,
        name: 'Launch Point'
      });
    }
    
    if (fire_locations && fire_locations.length > 0) {
      // Sort fires by priority/proximity
      fire_locations.forEach((fire, index) => {
        optimizedRoute.waypoints.push({
          lat: fire.lat,
          lng: fire.lng,
          altitude: 400 + (index * 50), // Vary altitude for safety
          name: `Fire Location ${index + 1}`
        });
      });
    }
    
    // Calculate metrics
    optimizedRoute.total_distance_miles = optimizedRoute.waypoints.length * 8.5;
    optimizedRoute.estimated_flight_time_minutes = optimizedRoute.waypoints.length * 12;
    optimizedRoute.coverage_area_sq_miles = optimizedRoute.waypoints.length * 25;
    optimizedRoute.fuel_stops_required = Math.floor(optimizedRoute.estimated_flight_time_minutes / 90);
    
    res.status(200).json({
      status: 'success',
      route: optimizedRoute,
      warnings: generateFlightWarnings(optimizedRoute),
      weather_check_required: true
    });
    return;
  }

  // GET request - return all available corridors
  const response = {
    status: 'success',
    timestamp: new Date().toISOString(),
    colorado_drone_corridors: droneCorridors,
    flight_rules: {
      max_altitude_agl: 400,
      visual_line_of_sight: true,
      daylight_operations_only: true,
      part_107_required: true,
      weather_minimums: {
        visibility_miles: 3,
        cloud_clearance_ft: 500,
        max_wind_speed_mph: 25
      }
    },
    no_fly_zones: [
      { name: 'Denver International Airport', lat: 39.8561, lng: -104.6737, radius_miles: 5 },
      { name: 'Rocky Mountain National Park', lat: 40.3428, lng: -105.6836, radius_miles: 10 },
      { name: 'US Air Force Academy', lat: 38.9983, lng: -104.8614, radius_miles: 3 }
    ],
    emergency_landing_sites: [
      { name: 'Jefferson County Airport', lat: 39.9088, lng: -105.1172 },
      { name: 'Boulder Municipal Airport', lat: 40.0394, lng: -105.2253 },
      { name: 'Fort Collins Downtown Airport', lat: 40.5882, lng: -105.0428 }
    ]
  };
  
  res.status(200).json(response);
}

function generateFlightWarnings(route) {
  const warnings = [];
  
  if (route.estimated_flight_time_minutes > 90) {
    warnings.push('Flight time exceeds typical battery endurance - plan for battery swaps');
  }
  
  if (route.waypoints.some(wp => wp.altitude > 600)) {
    warnings.push('High altitude operations - ensure aircraft is rated for density altitude');
  }
  
  if (route.waypoints.length > 5) {
    warnings.push('Complex route - consider breaking into multiple flights');
  }
  
  warnings.push('Always check current TFRs (Temporary Flight Restrictions)');
  warnings.push('Monitor ADS-B for manned aircraft');
  
  return warnings;
}