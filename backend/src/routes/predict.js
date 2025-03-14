const express = require('express');
const router = express.Router();
const { weather, satellite, fireData } = require('../services');

// Risk prediction endpoint
router.post('/risk', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius_km, 
      date, 
      vegetation_density, 
      terrain_type, 
      weather_condition 
    } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required parameters: latitude and longitude are required' 
      });
    }

    // Attempt to get real weather data for the location
    let weatherData;
    let vegetationData;
    let realDataAvailable = false;
    let baseRisk = 0.5; // Default risk score

    try {
      // Get current weather data from the real API
      console.log('Fetching weather data for', latitude, longitude);
      weatherData = await weather.getCurrentWeather(latitude, longitude);
      
      // Get vegetation data from the real API
      console.log('Fetching vegetation data for', latitude, longitude);
      vegetationData = await satellite.getVegetationDensity(latitude, longitude, radius_km || 10);
      
      // Calculate risk based on real data
      const weatherParams = weather.extractFireRiskParameters(weatherData);
      
      baseRisk = calculateRiskFromRealData(
        weatherParams,
        vegetationData.vegetationDensity,
        terrain_type
      );
      
      realDataAvailable = true;
      console.log('Successfully calculated risk using real data');
    } catch (error) {
      console.warn('Failed to fetch real data:', error.message);
      console.log('Falling back to mock data calculation');
      
      // Fall back to mock data calculation
      baseRisk = calculateRiskScore(
        vegetation_density, 
        terrain_type, 
        weather_condition
      );
    }
    
    // Generate risk distribution points
    const riskDistribution = generateRiskDistributionPoints(
      latitude, 
      longitude, 
      radius_km || 20, 
      baseRisk
    );

    // Generate contributing factors (use real data if available)
    const contributingFactors = realDataAvailable ? {
      vegetation_density: vegetationData.vegetationDensity / 100, // Convert 0-100 to 0-1 scale
      weather_conditions: calculateWeatherRiskFactor(weatherData),
      terrain_complexity: terrain_type === 'mountainous' ? 0.8 : terrain_type === 'hilly' ? 0.5 : 0.2,
      historical_fire_frequency: Math.random() * 0.6 + 0.2, // Would use real historical data in production
      proximity_to_infrastructure: Math.random() * 0.5 + 0.1 // Would use real GIS data in production
    } : {
      vegetation_density: vegetation_density || Math.random() * 0.8 + 0.1,
      weather_conditions: weather_condition === 'drought' ? 0.9 : weather_condition === 'dry' ? 0.7 : 0.3,
      terrain_complexity: terrain_type === 'mountainous' ? 0.8 : terrain_type === 'hilly' ? 0.5 : 0.2,
      historical_fire_frequency: Math.random() * 0.6 + 0.2,
      proximity_to_infrastructure: Math.random() * 0.5 + 0.1
    };

    // Generate recommendations based on risk score
    const recommendations = generateRecommendations(baseRisk, contributingFactors);

    res.json({
      risk_score: baseRisk,
      assessment_date: date || new Date().toISOString().split('T')[0],
      location: {
        latitude,
        longitude,
        radius_km: radius_km || 20
      },
      data_source: realDataAvailable ? 'real-time-api' : 'simulation',
      risk_distribution: riskDistribution,
      contributing_factors: contributingFactors,
      weather_summary: realDataAvailable ? {
        temperature: weatherData.main.temp,
        humidity: weatherData.main.humidity,
        wind_speed: weatherData.wind.speed,
        conditions: weatherData.weather[0].main
      } : null,
      vegetation_summary: realDataAvailable ? {
        density_score: vegetationData.vegetationDensity,
        category: vegetationData.vegetationCategory
      } : null,
      recommendations
    });
  } catch (error) {
    console.error('Error in risk prediction:', error);
    res.status(500).json({ error: 'Internal server error during risk prediction' });
  }
});

// Calculate risk factor from weather data
function calculateWeatherRiskFactor(weatherData) {
  if (!weatherData) return 0.5;
  
  const temp = weatherData.main.temp; // Celsius if using metric
  const humidity = weatherData.main.humidity; // Percentage
  const windSpeed = weatherData.wind.speed; // m/s if using metric
  const hasRain = weatherData.rain && (weatherData.rain['1h'] > 0 || weatherData.rain['3h'] > 0);
  
  let riskFactor = 0.3; // Base risk
  
  // Higher temperatures increase risk
  if (temp > 35) riskFactor += 0.3;
  else if (temp > 30) riskFactor += 0.2;
  else if (temp > 25) riskFactor += 0.1;
  
  // Lower humidity increases risk
  if (humidity < 20) riskFactor += 0.3;
  else if (humidity < 30) riskFactor += 0.2;
  else if (humidity < 40) riskFactor += 0.1;
  
  // Higher wind speeds increase risk
  if (windSpeed > 10) riskFactor += 0.2;
  else if (windSpeed > 5) riskFactor += 0.1;
  
  // Recent rain decreases risk
  if (hasRain) riskFactor -= 0.3;
  
  return Math.min(Math.max(riskFactor, 0), 1);
}

// Calculate risk based on real data
function calculateRiskFromRealData(weatherParams, vegetationDensity, terrainType) {
  let risk = 0.3; // Base risk
  
  // Weather factors
  if (weatherParams.temperature > 30) risk += 0.2;
  else if (weatherParams.temperature > 25) risk += 0.1;
  
  if (weatherParams.humidity < 30) risk += 0.2;
  else if (weatherParams.humidity < 50) risk += 0.1;
  
  if (weatherParams.windSpeed > 8) risk += 0.2;
  else if (weatherParams.windSpeed > 5) risk += 0.1;
  
  if (weatherParams.rainfall > 0) risk -= 0.2;
  
  // Vegetation density (0-100 scale)
  if (vegetationDensity > 80) risk += 0.2;
  else if (vegetationDensity > 60) risk += 0.15;
  else if (vegetationDensity > 40) risk += 0.1;
  
  // Terrain factors
  if (terrainType === 'mountainous') risk += 0.1;
  else if (terrainType === 'hilly') risk += 0.05;
  
  return Math.min(Math.max(risk, 0), 1);
}

// Original helper functions
function calculateRiskScore(vegetationDensity, terrainType, weatherCondition) {
  // Base risk is a random value between 0.3 and 0.7
  let risk = Math.random() * 0.4 + 0.3;
  
  // Adjust for vegetation density (if provided)
  if (vegetationDensity !== undefined) {
    risk = risk * 0.7 + vegetationDensity * 0.3;
  }
  
  // Adjust for terrain type
  if (terrainType) {
    if (terrainType === 'mountainous') risk += 0.2;
    else if (terrainType === 'hilly') risk += 0.1;
  }
  
  // Adjust for weather condition
  if (weatherCondition) {
    if (weatherCondition === 'drought') risk += 0.3;
    else if (weatherCondition === 'dry') risk += 0.15;
    else if (weatherCondition === 'windy') risk += 0.1;
  }
  
  // Ensure risk is between 0 and 1
  return Math.min(Math.max(risk, 0), 1);
}

function generateRiskDistributionPoints(centerLat, centerLng, radiusKm, baseRisk) {
  const points = [];
  const numPoints = 20;
  
  for (let i = 0; i < numPoints; i++) {
    // Generate a random distance within the radius
    const distance = Math.random() * radiusKm;
    // Generate a random angle
    const angle = Math.random() * Math.PI * 2;
    
    // Convert distance and angle to lat/lng offsets
    // This is a simplified approximation
    const latOffset = distance * Math.cos(angle) * 0.009;
    const lngOffset = distance * Math.sin(angle) * 0.009;
    
    // Generate a risk score that varies slightly from the base risk
    const variation = Math.random() * 0.4 - 0.2; // -0.2 to 0.2
    const riskScore = Math.min(Math.max(baseRisk + variation, 0), 1);
    
    points.push({
      latitude: parseFloat(centerLat) + latOffset,
      longitude: parseFloat(centerLng) + lngOffset,
      risk_score: riskScore
    });
  }
  
  return points;
}

function generateRecommendations(riskScore, factors) {
  const recommendations = [];
  
  if (riskScore > 0.7) {
    recommendations.push("Implement immediate fire prevention measures in this high-risk area.");
    recommendations.push("Establish firebreaks around critical infrastructure.");
    recommendations.push("Deploy fire monitoring systems for early detection.");
  } else if (riskScore > 0.5) {
    recommendations.push("Conduct regular patrols during dry seasons.");
    recommendations.push("Clear vegetation around buildings and power lines.");
  } else {
    recommendations.push("Maintain standard fire prevention protocols.");
  }
  
  // Add specific recommendations based on contributing factors
  if (factors.vegetation_density > 0.6) {
    recommendations.push("Reduce vegetation density through controlled clearing.");
  }
  
  if (factors.weather_conditions > 0.6) {
    recommendations.push("Increase water reserves and firefighting resources during dry conditions.");
  }
  
  if (factors.terrain_complexity > 0.6) {
    recommendations.push("Establish additional access routes for firefighting in complex terrain.");
  }
  
  return recommendations;
}

module.exports = router; 