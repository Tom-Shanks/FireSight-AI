import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Box, Typography, CircularProgress, Paper, Chip, Alert } from '@mui/material';
import { LocalFireDepartment, Flight, AttachMoney, Warning } from '@mui/icons-material';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Colorado bounds
const COLORADO_BOUNDS = {
  north: 41.003,
  south: 36.992,
  east: -102.041,
  west: -109.060
};

// Denver/Boulder corridor center
const DENVER_BOULDER_CENTER = [39.7392, -104.9903];

const ColoradoFireMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fireLayerRef = useRef(null);
  const droneLayerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [fireData, setFireData] = useState([]);
  const [activeFireCount, setActiveFireCount] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    
    if (mapRef.current) {
      // Create map centered on Denver/Boulder
      mapInstanceRef.current = L.map(mapRef.current).setView(DENVER_BOULDER_CENTER, 8);
      
      // Add terrain layer for better visualization
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | FireSight AI',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
      
      // Set Colorado bounds
      mapInstanceRef.current.setMaxBounds([
        [COLORADO_BOUNDS.south, COLORADO_BOUNDS.west],
        [COLORADO_BOUNDS.north, COLORADO_BOUNDS.east]
      ]);
      
      // Create layers
      fireLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      droneLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
      
      // Add Colorado counties overlay
      addColoradoCounties();
      
      mapInstanceRef.current.invalidateSize();
    }
  }, []);

  // Add Colorado counties with focus on Boulder, Jefferson, Larimer
  const addColoradoCounties = () => {
    const priorityCounties = {
      'Boulder': { center: [40.0150, -105.2705], color: '#ff6b35' },
      'Jefferson': { center: [39.5501, -105.2211], color: '#ff8c42' },
      'Larimer': { center: [40.5594, -105.6081], color: '#ff5722' }
    };
    
    Object.entries(priorityCounties).forEach(([name, data]) => {
      L.circle(data.center, {
        radius: 30000,
        color: data.color,
        fillColor: data.color,
        fillOpacity: 0.1,
        weight: 2
      }).addTo(mapInstanceRef.current).bindPopup(`${name} County - High Priority Monitoring Zone`);
    });
  };

  // Fetch Colorado fire data
  useEffect(() => {
    const fetchFireData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch from NASA FIRMS API (we'll use mock data for now)
        // In production, this would be: https://firms.modaps.eosdis.nasa.gov/api/area/csv/
        const mockColoradoFires = generateMockColoradoFires();
        
        setFireData(mockColoradoFires);
        setActiveFireCount(mockColoradoFires.filter(f => f.confidence > 70).length);
        setRiskScore(calculateRiskScore(mockColoradoFires));
        setLastUpdate(new Date());
        
        // Update map with fire data
        updateFireMarkers(mockColoradoFires);
        
        // Add drone flight paths
        addDroneFlightPaths();
        
      } catch (error) {
        console.error('Error fetching fire data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFireData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFireData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate realistic mock fire data for Colorado
  const generateMockColoradoFires = () => {
    const fires = [];
    const fireLocations = [
      { lat: 40.3772, lng: -105.5217, name: 'Cameron Peak Area' },
      { lat: 39.1911, lng: -106.8175, name: 'Pine Gulch' },
      { lat: 40.6728, lng: -105.4511, name: 'East Troublesome' },
      { lat: 38.8339, lng: -104.8214, name: 'Colorado Springs Area' },
      { lat: 39.5501, lng: -105.7821, name: 'Jefferson County' }
    ];
    
    fireLocations.forEach((loc, index) => {
      fires.push({
        id: `fire_${index}`,
        latitude: loc.lat + (Math.random() - 0.5) * 0.1,
        longitude: loc.lng + (Math.random() - 0.5) * 0.1,
        brightness: 300 + Math.random() * 100,
        confidence: 60 + Math.random() * 40,
        frp: 10 + Math.random() * 50, // Fire Radiative Power
        daynight: 'D',
        acq_date: new Date().toISOString().split('T')[0],
        acq_time: new Date().toTimeString().split(' ')[0],
        satellite: 'MODIS',
        area_name: loc.name
      });
    });
    
    return fires;
  };

  // Calculate overall risk score
  const calculateRiskScore = (fires) => {
    const highConfidenceFires = fires.filter(f => f.confidence > 80).length;
    const totalFRP = fires.reduce((sum, f) => sum + f.frp, 0);
    
    // Simple risk calculation (would be more complex in production)
    const riskScore = Math.min(100, (highConfidenceFires * 10) + (totalFRP / 10));
    return Math.round(riskScore);
  };

  // Update fire markers on map
  const updateFireMarkers = (fires) => {
    if (!fireLayerRef.current) return;
    
    // Clear existing markers
    fireLayerRef.current.clearLayers();
    
    // Add heat map layer
    const heatData = fires.map(fire => [fire.latitude, fire.longitude, fire.frp / 100]);
    if (heatData.length > 0) {
      L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        gradient: {
          0.4: 'yellow',
          0.65: 'orange',
          1: 'red'
        }
      }).addTo(fireLayerRef.current);
    }
    
    // Add individual fire markers
    fires.forEach(fire => {
      const color = fire.confidence > 80 ? '#ff0000' : '#ff9800';
      const marker = L.circleMarker([fire.latitude, fire.longitude], {
        radius: 8,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
      
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 10px 0;">${fire.area_name}</h4>
          <p style="margin: 5px 0;"><strong>Confidence:</strong> ${fire.confidence.toFixed(1)}%</p>
          <p style="margin: 5px 0;"><strong>Fire Power:</strong> ${fire.frp.toFixed(1)} MW</p>
          <p style="margin: 5px 0;"><strong>Detected:</strong> ${fire.acq_time}</p>
          <p style="margin: 5px 0;"><strong>Satellite:</strong> ${fire.satellite}</p>
          <button onclick="window.location.href='mailto:contact@firesight.ai?subject=Fire Alert - ${fire.area_name}'" 
                  style="background: #ff6b35; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-top: 10px;">
            Deploy Drone Survey
          </button>
        </div>
      `);
      
      marker.addTo(fireLayerRef.current);
    });
  };

  // Add drone flight paths
  const addDroneFlightPaths = () => {
    if (!droneLayerRef.current) return;
    
    droneLayerRef.current.clearLayers();
    
    // Optimal drone flight corridors for Colorado
    const flightPaths = [
      {
        name: 'Denver-Boulder Corridor',
        path: [[39.7392, -104.9903], [40.0150, -105.2705]],
        color: '#2196f3'
      },
      {
        name: 'Front Range Survey',
        path: [[39.7392, -104.9903], [40.5852, -105.0844]],
        color: '#00bcd4'
      },
      {
        name: 'I-70 Mountain Corridor',
        path: [[39.7392, -104.9903], [39.6403, -106.3742]],
        color: '#009688'
      }
    ];
    
    flightPaths.forEach(route => {
      const polyline = L.polyline(route.path, {
        color: route.color,
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10'
      });
      
      polyline.bindPopup(`
        <div>
          <h4>${route.name}</h4>
          <p>FAA Part 107 Approved Route</p>
          <p>Flight Time: ${Math.round(L.latLng(route.path[0]).distanceTo(L.latLng(route.path[1])) / 1000 / 50)} minutes</p>
        </div>
      `);
      
      polyline.addTo(droneLayerRef.current);
    });
  };

  return (
    <Box sx={{ position: 'relative', height: '600px', width: '100%' }}>
      {/* Status Bar */}
      <Paper sx={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        right: 10, 
        p: 2, 
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              icon={<LocalFireDepartment />} 
              label={`${activeFireCount} Active Fires`} 
              color={activeFireCount > 5 ? 'error' : 'warning'}
            />
            <Chip 
              icon={<Warning />} 
              label={`Risk Score: ${riskScore}%`} 
              color={riskScore > 70 ? 'error' : 'warning'}
            />
            <Chip 
              icon={<Flight />} 
              label="Part 107 Ready" 
              color="primary"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Last Updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>
      </Paper>
      
      {/* Hiring Alert */}
      <Alert 
        severity="info" 
        sx={{ 
          position: 'absolute', 
          bottom: 10, 
          left: 10, 
          right: 10, 
          zIndex: 1000,
          background: 'rgba(33, 150, 243, 0.95)'
        }}
        action={
          <Chip 
            icon={<AttachMoney />} 
            label="Available for Contract Work" 
            onClick={() => window.location.href = 'mailto:contact@firesight.ai'}
            sx={{ cursor: 'pointer', background: 'white' }}
          />
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          🚁 Part 107 Drone Pilot Available | 📍 Denver-Based | 🔥 Real-time Fire Monitoring
        </Typography>
      </Alert>
      
      {/* Map Container */}
      <Box 
        ref={mapRef} 
        sx={{ 
          height: '100%', 
          width: '100%',
          '& .leaflet-control-attribution': {
            background: 'rgba(255, 255, 255, 0.8)'
          }
        }} 
      />
      
      {loading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1100
        }}>
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
};

export default ColoradoFireMap;