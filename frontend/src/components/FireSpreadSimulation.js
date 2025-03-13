import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, CircularProgress, Alert, Slider, MenuItem, FormControlLabel, Switch, LinearProgress } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import Map from './Map';
import { simulateFireSpread } from '../services/api';

const FireSpreadSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fireCoordinates, setFireCoordinates] = useState({
    latitude: 37.7749,
    longitude: -122.4194
  });
  const [intensity, setIntensity] = useState(5);
  const [windSpeed, setWindSpeed] = useState(10);
  const [windDirection, setWindDirection] = useState(0);
  const [simulationHours, setSimulationHours] = useState(24);
  const [startTime, setStartTime] = useState(new Date());
  const [terrainAware, setTerrainAware] = useState(true);
  const [vegetationAware, setVegetationAware] = useState(true);
  const [results, setResults] = useState(null);
  const [mapCenter, setMapCenter] = useState([fireCoordinates.latitude, fireCoordinates.longitude]);
  const [simulationStage, setSimulationStage] = useState(0); // 0-100 for animation

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setFireCoordinates({
      latitude: lat,
      longitude: lng
    });
    setMapCenter([lat, lng]);
  };

  const handleSimulate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSimulationStage(0);
      
      const formattedStartTime = format(startTime, "yyyy-MM-dd'T'HH:mm:ss");
      
      // Prepare request payload
      const requestData = {
        latitude: fireCoordinates.latitude,
        longitude: fireCoordinates.longitude,
        start_time: formattedStartTime,
        intensity: intensity,
        wind_speed: windSpeed,
        wind_direction: windDirection,
        simulation_hours: simulationHours,
        consider_terrain: terrainAware,
        consider_vegetation: vegetationAware
      };
      
      // Call API
      const response = await simulateFireSpread(requestData);
      
      // Animate simulation progression
      const animateSimulation = async () => {
        for (let i = 1; i <= 100; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setSimulationStage(i);
        }
      };
      
      await animateSimulation();
      
      // Format fire for map display
      const fire = {
        latitude: fireCoordinates.latitude,
        longitude: fireCoordinates.longitude,
        intensity: intensity,
        detection_time: formattedStartTime
      };
      
      // Format spread areas for map
      const spreadAreas = response.spread_predictions.map((prediction, index) => ({
        latitude: prediction.latitude,
        longitude: prediction.longitude,
        radius_km: prediction.spread_radius_km,
        risk_score: prediction.intensity / 10, // Normalize intensity to 0-1 scale
        color: getSpreadColor(prediction.time_hours, simulationHours)
      }));
      
      setResults({
        fire: fire,
        spreadAreas: spreadAreas,
        impactedRegions: response.impacted_regions || [],
        evacuationRoutes: response.evacuation_routes || [],
        containmentETA: response.containment_eta,
        containmentResources: response.required_resources || {}
      });
      
    } catch (err) {
      console.error('Error simulating fire spread:', err);
      setError(err.message || 'Failed to simulate fire spread');
    } finally {
      setLoading(false);
    }
  };

  const getSpreadColor = (hours, totalHours) => {
    const ratio = hours / totalHours;
    if (ratio < 0.25) return '#FF0000'; // Red (initial)
    if (ratio < 0.5) return '#FF6600';  // Orange
    if (ratio < 0.75) return '#FF9900'; // Amber
    return '#CC6600';                   // Brown (final)
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        Fire Spread Simulation
      </Typography>
      
      <Grid container spacing={3}>
        {/* Map section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ height: 600 }}>
                <Map 
                  center={mapCenter}
                  zoom={9}
                  onMapClick={handleMapClick}
                  fires={results ? [results.fire] : []}
                  predictionAreas={results ? results.spreadAreas : []}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Controls section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Simulation Parameters
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Ignition Latitude"
                  type="number"
                  inputProps={{ step: 0.0001 }}
                  value={fireCoordinates.latitude}
                  onChange={(e) => setFireCoordinates({...fireCoordinates, latitude: parseFloat(e.target.value)})}
                  fullWidth
                  margin="normal"
                />
                
                <TextField
                  label="Ignition Longitude"
                  type="number"
                  inputProps={{ step: 0.0001 }}
                  value={fireCoordinates.longitude}
                  onChange={(e) => setFireCoordinates({...fireCoordinates, longitude: parseFloat(e.target.value)})}
                  fullWidth
                  margin="normal"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Fire Intensity (1-10): {intensity}
                </Typography>
                <Slider
                  value={intensity}
                  onChange={(e, newValue) => setIntensity(newValue)}
                  min={1}
                  max={10}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Wind Speed (km/h): {windSpeed}
                </Typography>
                <Slider
                  value={windSpeed}
                  onChange={(e, newValue) => setWindSpeed(newValue)}
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Wind Direction (degrees): {windDirection}°
                </Typography>
                <Slider
                  value={windDirection}
                  onChange={(e, newValue) => setWindDirection(newValue)}
                  min={0}
                  max={359}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Simulation Duration (hours): {simulationHours}
                </Typography>
                <Slider
                  value={simulationHours}
                  onChange={(e, newValue) => setSimulationHours(newValue)}
                  min={6}
                  max={72}
                  step={6}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Fire Start Time"
                    value={startTime}
                    onChange={(newDateTime) => setStartTime(newDateTime)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={terrainAware}
                      onChange={(e) => setTerrainAware(e.target.checked)}
                    />
                  }
                  label="Consider Terrain"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={vegetationAware}
                      onChange={(e) => setVegetationAware(e.target.checked)}
                    />
                  }
                  label="Consider Vegetation"
                />
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSimulate}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Run Simulation'}
              </Button>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              {loading && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>
                    Simulating fire spread... {simulationStage}%
                  </Typography>
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <LinearProgress variant="determinate" value={simulationStage} />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Results section */}
        {results && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Simulation Results
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Impacted regions */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Impacted Regions:
                    </Typography>
                    
                    <Box component="ul">
                      {results.impactedRegions.map((region, index) => (
                        <Box component="li" key={index} sx={{ mb: 1 }}>
                          <Typography variant="body1">
                            {region.name} - Impact Level: {region.impact_level}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Population at risk: {region.population_at_risk.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* Containment info */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Containment Information:
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      Estimated containment time: {results.containmentETA}
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      Required resources:
                    </Typography>
                    
                    <Box component="ul">
                      {Object.entries(results.containmentResources).map(([resource, amount]) => (
                        <Box component="li" key={resource}>
                          <Typography variant="body2">
                            {resource.replace(/_/g, ' ')}: {amount}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* Evacuation Routes */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Evacuation Routes:
                    </Typography>
                    
                    <Box component="ul">
                      {results.evacuationRoutes.map((route, index) => (
                        <Box component="li" key={index} sx={{ mb: 1 }}>
                          <Typography variant="body1">
                            {route.name} - {route.distance_km.toFixed(1)} km
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Estimated evacuation time: {route.estimated_time_minutes} minutes
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default FireSpreadSimulation; 