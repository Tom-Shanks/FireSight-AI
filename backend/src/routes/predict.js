const express = require('express');
const router = express.Router();

// Risk prediction endpoint
router.post('/risk', (req, res) => {
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

    // Generate mock risk score based on input parameters
    const riskScore = calculateRiskScore(
      vegetation_density, 
      terrain_type, 
      weather_condition
    );
    
    // Generate mock risk distribution points
    const riskDistribution = generateRiskDistributionPoints(
      latitude, 
      longitude, 
      radius_km || 20, 
      riskScore
    );

    // Generate contributing factors
    const contributingFactors = {
      vegetation_density: vegetation_density || Math.random() * 0.8 + 0.1,
      weather_conditions: weather_condition === 'drought' ? 0.9 : weather_condition === 'dry' ? 0.7 : 0.3,
      terrain_complexity: terrain_type === 'mountainous' ? 0.8 : terrain_type === 'hilly' ? 0.5 : 0.2,
      historical_fire_frequency: Math.random() * 0.6 + 0.2,
      proximity_to_infrastructure: Math.random() * 0.5 + 0.1
    };

    // Generate recommendations based on risk score
    const recommendations = generateRecommendations(riskScore, contributingFactors);

    res.json({
      risk_score: riskScore,
      assessment_date: date || new Date().toISOString().split('T')[0],
      location: {
        latitude,
        longitude,
        radius_km: radius_km || 20
      },
      risk_distribution: riskDistribution,
      contributing_factors: contributingFactors,
      recommendations
    });
  } catch (error) {
    console.error('Error in risk prediction:', error);
    res.status(500).json({ error: 'Internal server error during risk prediction' });
  }
});

// Helper functions
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