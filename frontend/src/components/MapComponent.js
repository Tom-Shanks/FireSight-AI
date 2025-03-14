import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import apiService from '../services/api';
import { Box, Typography, CircularProgress, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapMode, setMapMode] = useState('risk'); // 'risk', 'fires', 'damage'
  const [riskData, setRiskData] = useState([]);
  const [recentFires, setRecentFires] = useState([]);
  
  // Initialize map
  useEffect(() => {
    // Wait a small delay to ensure the container is properly sized
    const initTimer = setTimeout(() => {
      if (mapInstanceRef.current) return; // Map already initialized
      
      if (mapRef.current) {
        // Create map instance
        mapInstanceRef.current = L.map(mapRef.current).setView([37.7749, -122.4194], 6);
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
        
        // Create layers group for markers
        markersLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
        
        // Ensure map is fully initialized
        mapInstanceRef.current.invalidateSize();
        
        // Mark map as initialized after a short delay to ensure it's fully rendered
        setTimeout(() => {
          setMapInitialized(true);
        }, 100);
      }
    }, 300);
    
    return () => {
      clearTimeout(initTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Load data based on selected map mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (mapMode === 'risk') {
          const data = await apiService.getHighRiskAreas();
          setRiskData(data);
        } else if (mapMode === 'fires') {
          const data = await apiService.getRecentFires();
          setRecentFires(data);
        }
        // Add more data fetching for other modes as needed
      } catch (err) {
        console.error('Error fetching map data:', err);
        setError('Failed to load map data. Please try again later.');
        
        // Use mock data for development
        if (mapMode === 'risk') {
          setRiskData(generateMockRiskData());
        } else if (mapMode === 'fires') {
          setRecentFires(generateMockFireData());
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [mapMode]);
  
  // Update map visualization when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapInitialized) return;
    
    // Force the map to recognize its container size
    mapInstanceRef.current.invalidateSize();
    
    // Clear existing layers
    if (heatLayerRef.current) {
      mapInstanceRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    
    markersLayerRef.current.clearLayers();
    
    // Add visualization based on mode
    if (mapMode === 'risk' && riskData.length > 0) {
      // Create heat map for risk data
      const heatData = riskData.map(point => [
        point.latitude, 
        point.longitude, 
        point.riskScore / 100 // Normalize risk score for heat intensity
      ]);
      
      try {
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          gradient: {0.4: 'blue', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red'}
        }).addTo(mapInstanceRef.current);
      } catch (error) {
        console.error('Failed to add heat layer:', error);
      }
      
      // Add markers for highest risk areas
      const highRiskAreas = riskData
        .filter(point => point.riskScore > 75)
        .slice(0, 10);
        
      highRiskAreas.forEach(point => {
        const marker = L.marker([point.latitude, point.longitude])
          .bindPopup(`
            <strong>High Risk Area</strong><br>
            Risk Score: ${point.riskScore}/100<br>
            Region: ${point.region || 'Unknown'}<br>
            Vegetation: ${point.vegetationDensity || 'Unknown'}<br>
            Last Rain: ${point.lastRainfall || 'Unknown'}
          `);
        markersLayerRef.current.addLayer(marker);
      });
      
    } else if (mapMode === 'fires' && recentFires.length > 0) {
      // Add markers for recent fires
      recentFires.forEach(fire => {
        const fireIcon = L.divIcon({
          html: `<div style="background-color: red; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: 'fire-marker',
          iconSize: [15, 15]
        });
        
        const marker = L.marker([fire.latitude, fire.longitude], {icon: fireIcon})
          .bindPopup(`
            <strong>${fire.name || 'Unnamed Fire'}</strong><br>
            Started: ${fire.startDate || 'Unknown'}<br>
            Status: ${fire.status || 'Unknown'}<br>
            Size: ${fire.acres ? fire.acres + ' acres' : 'Unknown'}<br>
            Containment: ${fire.containment ? fire.containment + '%' : 'Unknown'}
          `);
        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [mapMode, riskData, recentFires, mapInitialized]);
  
  // Generate mock data for development
  const generateMockRiskData = () => {
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
  };
  
  const generateMockFireData = () => {
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
  };
  
  const handleMapModeChange = (event) => {
    setMapMode(event.target.value);
  };
  
  return (
    <Paper elevation={3} sx={{ p: 2, height: '650px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {mapMode === 'risk' ? 'Wildfire Risk Map' : 
           mapMode === 'fires' ? 'Recent Wildfires' : 'Damage Assessment'}
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="map-mode-label">Map Mode</InputLabel>
          <Select
            labelId="map-mode-label"
            value={mapMode}
            label="Map Mode"
            onChange={handleMapModeChange}
          >
            <MenuItem value="risk">Risk Prediction</MenuItem>
            <MenuItem value="fires">Recent Fires</MenuItem>
            <MenuItem value="damage">Damage Assessment</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ position: 'relative', flexGrow: 1, minHeight: '550px' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1000
          }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1000
          }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        <div 
          ref={mapRef} 
          style={{ width: '100%', height: '100%', position: 'absolute' }}
        />
      </Box>
    </Paper>
  );
};

export default MapComponent; 