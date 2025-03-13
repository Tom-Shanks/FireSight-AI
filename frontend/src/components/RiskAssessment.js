import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, CircularProgress, Alert, Slider, MenuItem } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import Map from './Map';
import { getRiskPrediction } from '../services/api';

const RiskAssessment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coordinates, setCoordinates] = useState({
    latitude: 37.7749,
    longitude: -122.4194
  });
  const [radius, setRadius] = useState(20);
  const [date, setDate] = useState(new Date());
  const [vegetationDensity, setVegetationDensity] = useState(50);
  const [terrainType, setTerrainType] = useState('hilly');
  const [weatherCondition, setWeatherCondition] = useState('dry');
  const [results, setResults] = useState(null);
  const [mapCenter, setMapCenter] = useState([coordinates.latitude, coordinates.longitude]);

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setCoordinates({
      latitude: lat,
      longitude: lng
    });
    setMapCenter([lat, lng]);
  };

  const handlePredictRisk = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Prepare request payload
      const requestData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius_km: radius,
        date: formattedDate,
        vegetation_density: vegetationDensity / 100, // Convert to 0-1 scale
        terrain_type: terrainType,
        weather_condition: weatherCondition
      };
      
      // Call API
      const response = await getRiskPrediction(requestData);
      
      // Transform response for visualization
      const predictionArea = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius_km: radius,
        risk_score: response.risk_score,
        factors: response.contributing_factors || {}
      };
      
      // Format risk points for heatmap
      const riskPoints = response.risk_distribution?.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
        risk_score: point.risk_score
      })) || [];
      
      setResults({
        predictionArea: predictionArea,
        riskPoints: riskPoints,
        riskScore: response.risk_score,
        contributingFactors: response.contributing_factors || {},
        recommendations: response.recommendations || []
      });
      
    } catch (err) {
      console.error('Error predicting risk:', err);
      setError(err.message || 'Failed to predict wildfire risk');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score < 0.3) return 'green';
    if (score < 0.6) return 'orange';
    return 'red';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        Wildfire Risk Assessment
      </Typography>
      
      <Grid container spacing={3}>
        {/* Map section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ height: 600 }}>
                <Map 
                  center={mapCenter}
                  zoom={8}
                  onMapClick={handleMapClick}
                  predictionAreas={results ? [results.predictionArea] : []}
                  riskPoints={results ? results.riskPoints : []}
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
                Assessment Parameters
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="Latitude"
                  type="number"
                  inputProps={{ step: 0.0001 }}
                  value={coordinates.latitude}
                  onChange={(e) => setCoordinates({...coordinates, latitude: parseFloat(e.target.value)})}
                  fullWidth
                  margin="normal"
                />
                
                <TextField
                  label="Longitude"
                  type="number"
                  inputProps={{ step: 0.0001 }}
                  value={coordinates.longitude}
                  onChange={(e) => setCoordinates({...coordinates, longitude: parseFloat(e.target.value)})}
                  fullWidth
                  margin="normal"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Area Radius (km): {radius}
                </Typography>
                <Slider
                  value={radius}
                  onChange={(e, newValue) => setRadius(newValue)}
                  min={5}
                  max={50}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Prediction Date"
                    value={date}
                    onChange={(newDate) => setDate(newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>
                  Vegetation Density: {vegetationDensity}%
                </Typography>
                <Slider
                  value={vegetationDensity}
                  onChange={(e, newValue) => setVegetationDensity(newValue)}
                  valueLabelDisplay="auto"
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Terrain Type"
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="flat">Flat</MenuItem>
                  <MenuItem value="hilly">Hilly</MenuItem>
                  <MenuItem value="mountainous">Mountainous</MenuItem>
                </TextField>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  select
                  label="Weather Condition"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="dry">Dry</MenuItem>
                  <MenuItem value="drought">Drought</MenuItem>
                  <MenuItem value="windy">Windy</MenuItem>
                </TextField>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePredictRisk}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Predict Risk'}
              </Button>
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
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
                  Risk Assessment Results
                </Typography>
                
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Overall Risk Score:
                  </Typography>
                  <Box sx={{ 
                    bgcolor: getRiskColor(results.riskScore), 
                    color: 'white', 
                    p: 1, 
                    borderRadius: 1,
                    fontWeight: 'bold'
                  }}>
                    {(results.riskScore * 100).toFixed(1)}%
                  </Box>
                </Box>
                
                <Typography variant="subtitle1" gutterBottom>
                  Contributing Factors:
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {Object.entries(results.contributingFactors).map(([factor, value]) => (
                    <Grid item xs={6} sm={4} md={3} key={factor}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" color="textSecondary">
                            {factor.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="h6" sx={{ color: getRiskColor(value) }}>
                            {(value * 100).toFixed(1)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                
                <Typography variant="subtitle1" gutterBottom>
                  Recommendations:
                </Typography>
                
                <Box component="ul">
                  {results.recommendations.map((recommendation, index) => (
                    <Box component="li" key={index} sx={{ mb: 1 }}>
                      <Typography variant="body1">
                        {recommendation}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default RiskAssessment; 