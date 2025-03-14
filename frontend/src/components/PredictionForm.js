import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  CircularProgress,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../services/api';

const PredictionForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    date: new Date(),
    vegetationDensity: 50,
    lastRainfall: 10,
    temperature: 75,
    windSpeed: 5,
    humidity: 40,
    region: 'northern_california'
  });
  
  const regions = [
    { value: 'northern_california', label: 'Northern California' },
    { value: 'southern_california', label: 'Southern California' },
    { value: 'central_valley', label: 'Central Valley' },
    { value: 'sierra_nevada', label: 'Sierra Nevada' },
    { value: 'coastal', label: 'Coastal Region' }
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSliderChange = (name) => (e, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      date: newDate
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    setResult(null);
    
    try {
      // In a real application, you would call your API
      // const response = await apiService.predictRisk(formData);
      // setResult(response);
      
      // For development, simulate API call with mock data
      setTimeout(() => {
        const mockResult = generateMockResult(formData);
        setResult(mockResult);
        setSuccess(true);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Error submitting prediction request:', err);
      setError('Failed to process your prediction request. Please try again later.');
      setLoading(false);
    }
  };
  
  const generateMockResult = (data) => {
    // Generate a mock risk score based on input parameters
    let baseScore = Math.random() * 30 + 40; // Base score between 40-70
    
    // Adjust based on vegetation density (higher = more risk)
    baseScore += (data.vegetationDensity - 50) * 0.2;
    
    // Adjust based on days since last rainfall (more days = more risk)
    baseScore += data.lastRainfall * 0.5;
    
    // Adjust based on temperature (higher = more risk)
    baseScore += (data.temperature - 70) * 0.3;
    
    // Adjust based on wind speed (higher = more risk)
    baseScore += data.windSpeed * 1.5;
    
    // Adjust based on humidity (lower = more risk)
    baseScore -= data.humidity * 0.2;
    
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
    if (data.vegetationDensity > 60) factors.push('High vegetation density');
    if (data.lastRainfall > 14) factors.push('Extended period without rainfall');
    if (data.temperature > 85) factors.push('High temperature');
    if (data.windSpeed > 10) factors.push('Strong winds');
    if (data.humidity < 30) factors.push('Low humidity');
    
    // If no factors were significant enough, add a generic one
    if (factors.length === 0) {
      factors.push('Combination of environmental factors');
    }
    
    return {
      riskScore,
      riskLevel,
      contributingFactors: factors,
      recommendedActions: getRecommendedActions(riskLevel),
      timestamp: new Date().toISOString()
    };
  };
  
  const getRecommendedActions = (riskLevel) => {
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
  };
  
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'Low': return 'success.main';
      case 'Moderate': return 'warning.light';
      case 'High': return 'warning.main';
      case 'Extreme': return 'error.main';
      default: return 'text.primary';
    }
  };
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Wildfire Risk Prediction</Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Location */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Latitude"
              name="latitude"
              type="number"
              value={formData.latitude}
              onChange={handleInputChange}
              inputProps={{ step: 0.0001 }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Longitude"
              name="longitude"
              type="number"
              value={formData.longitude}
              onChange={handleInputChange}
              inputProps={{ step: 0.0001 }}
              required
            />
          </Grid>
          
          {/* Date */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Prediction Date"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
          
          {/* Region */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel id="region-label">Region</InputLabel>
              <Select
                labelId="region-label"
                name="region"
                value={formData.region}
                label="Region"
                onChange={handleInputChange}
              >
                {regions.map((region) => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Environmental Factors */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Environmental Factors</Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Vegetation Density (%)</Typography>
            <Slider
              name="vegetationDensity"
              value={formData.vegetationDensity}
              onChange={handleSliderChange('vegetationDensity')}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Days Since Last Rainfall</Typography>
            <Slider
              name="lastRainfall"
              value={formData.lastRainfall}
              onChange={handleSliderChange('lastRainfall')}
              valueLabelDisplay="auto"
              min={0}
              max={30}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Temperature (°F)</Typography>
            <Slider
              name="temperature"
              value={formData.temperature}
              onChange={handleSliderChange('temperature')}
              valueLabelDisplay="auto"
              min={40}
              max={110}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Wind Speed (mph)</Typography>
            <Slider
              name="windSpeed"
              value={formData.windSpeed}
              onChange={handleSliderChange('windSpeed')}
              valueLabelDisplay="auto"
              min={0}
              max={30}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography gutterBottom>Humidity (%)</Typography>
            <Slider
              name="humidity"
              value={formData.humidity}
              onChange={handleSliderChange('humidity')}
              valueLabelDisplay="auto"
              min={0}
              max={100}
            />
          </Grid>
          
          {/* Submit Button */}
          <Grid item xs={12}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Calculate Risk'}
            </Button>
          </Grid>
        </Grid>
      </form>
      
      {/* Results */}
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && result && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Prediction Results</Typography>
          
          <Paper elevation={2} sx={{ p: 3, mt: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Risk Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h3" color={getRiskColor(result.riskLevel)}>
                    {result.riskScore}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ ml: 1 }}>/100</Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Risk Level</Typography>
                <Typography 
                  variant="h3" 
                  color={getRiskColor(result.riskLevel)}
                >
                  {result.riskLevel}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Contributing Factors</Typography>
                <Box component="ul" sx={{ mt: 1 }}>
                  {result.contributingFactors.map((factor, index) => (
                    <Typography component="li" key={index}>
                      {factor}
                    </Typography>
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>Recommended Actions</Typography>
                <Box component="ul" sx={{ mt: 1 }}>
                  {result.recommendedActions.map((action, index) => (
                    <Typography component="li" key={index}>
                      {action}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default PredictionForm; 