// Vercel serverless function for Colorado fire data
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mock Colorado fire data - in production, this would call NASA FIRMS API
  const generateColoradoFires = () => {
    const fires = [];
    const baseTime = new Date();
    
    // Historical major fire locations in Colorado
    const fireLocations = [
      { lat: 40.3772, lng: -105.5217, name: 'Cameron Peak Area', county: 'Larimer' },
      { lat: 39.1911, lng: -106.8175, name: 'Pine Gulch', county: 'Mesa' },
      { lat: 40.6728, lng: -105.4511, name: 'East Troublesome', county: 'Grand' },
      { lat: 38.8339, lng: -104.8214, name: 'Colorado Springs Area', county: 'El Paso' },
      { lat: 39.5501, lng: -105.7821, name: 'Jefferson County Hills', county: 'Jefferson' },
      { lat: 40.0150, lng: -105.2705, name: 'Boulder Foothills', county: 'Boulder' },
      { lat: 39.1638, lng: -108.7298, name: 'Grand Mesa', county: 'Mesa' },
      { lat: 37.2753, lng: -107.8801, name: 'Durango Area', county: 'La Plata' }
    ];
    
    // Generate realistic fire data
    fireLocations.forEach((loc, index) => {
      // Randomize some parameters for realism
      const confidence = 65 + Math.random() * 35;
      const frp = 10 + Math.random() * 100; // Fire Radiative Power
      const brightness = 300 + Math.random() * 100;
      
      fires.push({
        id: `MODIS_${Date.now()}_${index}`,
        latitude: loc.lat + (Math.random() - 0.5) * 0.1,
        longitude: loc.lng + (Math.random() - 0.5) * 0.1,
        brightness: brightness.toFixed(1),
        scan: 1.0,
        track: 1.0,
        acq_date: baseTime.toISOString().split('T')[0],
        acq_time: baseTime.toTimeString().slice(0, 5).replace(':', ''),
        satellite: Math.random() > 0.5 ? 'Terra' : 'Aqua',
        instrument: 'MODIS',
        confidence: Math.round(confidence),
        version: '6.1',
        bright_t31: (brightness - 20).toFixed(1),
        frp: frp.toFixed(1),
        daynight: 'D',
        location_name: loc.name,
        county: loc.county,
        state: 'Colorado',
        weather_conditions: {
          temperature: 75 + Math.random() * 15,
          humidity: 10 + Math.random() * 30,
          wind_speed: 5 + Math.random() * 25,
          wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)]
        }
      });
    });
    
    return fires;
  };

  // Get query parameters
  const { days = 7, county, min_confidence = 0 } = req.query;
  
  let fires = generateColoradoFires();
  
  // Filter by county if specified
  if (county) {
    fires = fires.filter(fire => 
      fire.county.toLowerCase() === county.toLowerCase()
    );
  }
  
  // Filter by confidence
  fires = fires.filter(fire => fire.confidence >= min_confidence);
  
  // Add metadata
  const response = {
    status: 'success',
    count: fires.length,
    timestamp: new Date().toISOString(),
    data_source: 'FireSight AI Colorado Monitor',
    update_frequency: '5 minutes',
    coverage_area: {
      state: 'Colorado',
      bounds: {
        north: 41.003,
        south: 36.992,
        east: -102.041,
        west: -109.060
      }
    },
    fire_statistics: {
      total_fires: fires.length,
      high_confidence: fires.filter(f => f.confidence > 80).length,
      counties_affected: [...new Set(fires.map(f => f.county))].length,
      average_frp: (fires.reduce((sum, f) => sum + parseFloat(f.frp), 0) / fires.length).toFixed(1)
    },
    fires: fires
  };
  
  res.status(200).json(response);
}