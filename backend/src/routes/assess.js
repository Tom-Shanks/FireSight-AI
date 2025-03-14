const express = require('express');
const router = express.Router();

// Damage assessment endpoint
router.post('/damage', (req, res) => {
  try {
    const { fire_area, pre_fire_date, post_fire_date } = req.body;

    // Validate required parameters
    if (!fire_area) {
      return res.status(400).json({ 
        error: 'Missing required parameter: fire_area' 
      });
    }

    // Extract fire area details
    const { coordinates, radius_km, center } = extractFireAreaDetails(fire_area);
    
    // Generate damage metrics
    const damageMetrics = calculateDamageMetrics(coordinates || center, radius_km);
    
    // Generate recovery estimates
    const recoveryEstimates = generateRecoveryEstimates(damageMetrics);
    
    // Generate damage map URL
    const damageMapUrl = generateDamageMapUrl(coordinates || center, damageMetrics);

    res.json({
      assessment_id: `asmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      fire_area: {
        type: coordinates ? 'polygon' : 'circle',
        coordinates: coordinates || center,
        radius_km: radius_km
      },
      dates: {
        pre_fire: pre_fire_date || '2023-06-01',
        post_fire: post_fire_date || new Date().toISOString().split('T')[0],
        assessment: new Date().toISOString().split('T')[0]
      },
      damage_metrics: damageMetrics,
      recovery_estimates: recoveryEstimates,
      damage_map_url: damageMapUrl,
      satellite_imagery: {
        pre_fire: generateMockImageUrl('pre'),
        post_fire: generateMockImageUrl('post')
      }
    });
  } catch (error) {
    console.error('Error in damage assessment:', error);
    res.status(500).json({ error: 'Internal server error during damage assessment' });
  }
});

// Helper functions
function extractFireAreaDetails(fireArea) {
  // Handle different input formats for fire area
  if (Array.isArray(fireArea)) {
    // Polygon coordinates provided as array
    return { coordinates: fireArea };
  } else if (fireArea.coordinates && Array.isArray(fireArea.coordinates)) {
    // Coordinates provided in object
    return { coordinates: fireArea.coordinates };
  } else if (fireArea.center && fireArea.radius_km) {
    // Circle provided with center and radius
    return { 
      center: fireArea.center,
      radius_km: fireArea.radius_km
    };
  } else if (fireArea.latitude && fireArea.longitude) {
    // Point provided with lat/lng
    return { 
      center: [fireArea.latitude, fireArea.longitude],
      radius_km: fireArea.radius_km || 5
    };
  } else {
    throw new Error('Invalid fire area format');
  }
}

function calculateDamageMetrics(coordinates, radius_km) {
  // Calculate approximate area in hectares
  let areaHectares;
  if (Array.isArray(coordinates[0])) {
    // For polygon, use a simple approximation
    // In a real system, this would use proper geospatial calculations
    const numPoints = coordinates.length;
    areaHectares = numPoints * 100; // Just a placeholder approximation
  } else {
    // For circle, calculate area
    areaHectares = Math.PI * Math.pow(radius_km * 1000 / 100, 2);
  }
  
  // Generate random damage metrics
  const burnedAreaPercent = Math.random() * 60 + 30; // 30% to 90%
  const burnedAreaHectares = Math.floor(areaHectares * burnedAreaPercent / 100);
  
  // Calculate vegetation damage distribution
  const vegetation = {
    forest: Math.random() * 0.5 + 0.2, // 20% to 70%
    grassland: Math.random() * 0.3 + 0.1, // 10% to 40%
    shrubland: Math.random() * 0.2 + 0.1, // 10% to 30%
    cropland: Math.random() * 0.1 // 0% to 10%
  };
  
  // Normalize vegetation percentages to sum to 1
  const vegetationSum = Object.values(vegetation).reduce((a, b) => a + b, 0);
  Object.keys(vegetation).forEach(key => {
    vegetation[key] = vegetation[key] / vegetationSum;
  });
  
  // Calculate vegetation damage
  const vegetationDamage = {};
  Object.keys(vegetation).forEach(type => {
    vegetationDamage[type] = {
      area_hectares: Math.floor(burnedAreaHectares * vegetation[type]),
      percentage: Math.floor(Math.random() * 30 + 60) // 60% to 90% damage
    };
  });
  
  // Calculate infrastructure impact
  const infrastructureCount = Math.floor(Math.random() * 50) + 1;
  const infrastructureDamaged = Math.floor(infrastructureCount * (Math.random() * 0.6 + 0.1)); // 10% to 70%
  
  return {
    burned_area: {
      hectares: burnedAreaHectares,
      percentage: burnedAreaPercent
    },
    severity: {
      high: Math.random() * 0.4 + 0.3, // 30% to 70%
      medium: Math.random() * 0.3 + 0.2, // 20% to 50%
      low: Math.random() * 0.2 + 0.1 // 10% to 30%
    },
    vegetation_damage: vegetationDamage,
    infrastructure_impact: {
      total_count: infrastructureCount,
      damaged_count: infrastructureDamaged,
      percentage: (infrastructureDamaged / infrastructureCount) * 100,
      types: {
        buildings: Math.floor(infrastructureDamaged * (Math.random() * 0.5 + 0.3)),
        roads_km: Math.floor(Math.random() * 10) + 1,
        power_lines_km: Math.floor(Math.random() * 5) + 1,
        water_systems: Math.floor(infrastructureDamaged * Math.random() * 0.2)
      }
    },
    soil_erosion_risk: Math.random() * 0.6 + 0.2, // 20% to 80%
    watershed_impact: Math.random() * 0.5 + 0.1, // 10% to 60%
    air_quality_impact: {
      aqi_increase: Math.floor(Math.random() * 100) + 50,
      particulate_matter_increase: Math.floor(Math.random() * 150) + 50
    }
  };
}

function generateRecoveryEstimates(damageMetrics) {
  // Calculate recovery times based on damage metrics
  const burnSeverity = damageMetrics.severity.high * 3 + damageMetrics.severity.medium * 2 + damageMetrics.severity.low;
  const vegetationRecoveryBase = 12; // Base months for vegetation recovery
  
  // Calculate vegetation recovery times for each type
  const vegetationRecovery = {};
  Object.keys(damageMetrics.vegetation_damage).forEach(type => {
    let recoveryTime;
    switch (type) {
      case 'forest':
        recoveryTime = Math.floor(vegetationRecoveryBase * 5 * burnSeverity);
        break;
      case 'grassland':
        recoveryTime = Math.floor(vegetationRecoveryBase * 0.5 * burnSeverity);
        break;
      case 'shrubland':
        recoveryTime = Math.floor(vegetationRecoveryBase * 2 * burnSeverity);
        break;
      case 'cropland':
        recoveryTime = Math.floor(vegetationRecoveryBase * 0.3 * burnSeverity);
        break;
      default:
        recoveryTime = Math.floor(vegetationRecoveryBase * burnSeverity);
    }
    vegetationRecovery[type] = {
      time_months: recoveryTime,
      phases: [
        {
          name: 'Initial Regrowth',
          time_months: Math.floor(recoveryTime * 0.2),
          percentage: 20
        },
        {
          name: 'Intermediate Recovery',
          time_months: Math.floor(recoveryTime * 0.5),
          percentage: 60
        },
        {
          name: 'Mature Recovery',
          time_months: recoveryTime,
          percentage: 100
        }
      ]
    };
  });
  
  // Calculate infrastructure recovery time
  const infraDamagePercentage = damageMetrics.infrastructure_impact.percentage / 100;
  const infraRecoveryTime = Math.floor(infraDamagePercentage * 24) + 1; // 1-24 months
  
  // Calculate cost estimates
  const areaFactor = damageMetrics.burned_area.hectares / 1000;
  const severityFactor = damageMetrics.severity.high * 3 + damageMetrics.severity.medium * 1.5 + damageMetrics.severity.low * 0.5;
  const infraFactor = damageMetrics.infrastructure_impact.damaged_count;
  
  const costEstimate = {
    total: Math.floor((areaFactor * 500000) + (severityFactor * 1000000) + (infraFactor * 250000)),
    breakdown: {
      immediate_response: Math.floor((areaFactor * 200000) + (severityFactor * 300000)),
      restoration: Math.floor((areaFactor * 150000) + (severityFactor * 500000)),
      infrastructure_repair: Math.floor(infraFactor * 250000),
      monitoring: Math.floor(areaFactor * 50000)
    }
  };
  
  return {
    vegetation_recovery: vegetationRecovery,
    infrastructure_recovery: {
      time_months: infraRecoveryTime,
      phases: [
        {
          name: 'Assessment and Planning',
          time_months: Math.ceil(infraRecoveryTime * 0.2),
          percentage: 10
        },
        {
          name: 'Critical Repairs',
          time_months: Math.ceil(infraRecoveryTime * 0.5),
          percentage: 60
        },
        {
          name: 'Complete Restoration',
          time_months: infraRecoveryTime,
          percentage: 100
        }
      ]
    },
    watershed_recovery: {
      time_months: Math.floor(burnSeverity * 36),
      risk_mitigation_measures: [
        'Erosion control barriers',
        'Replanting native vegetation',
        'Stream channel stabilization',
        'Water quality monitoring'
      ]
    },
    cost_estimates: costEstimate,
    long_term_monitoring: {
      duration_years: Math.ceil(burnSeverity * 5),
      key_indicators: [
        'Vegetation regrowth density',
        'Soil stability',
        'Water quality parameters',
        'Wildlife population return'
      ]
    }
  };
}

function generateDamageMapUrl(coordinates, metrics) {
  // In a real system, this would generate an actual map
  // For now, we'll just return a placeholder URL
  const severity = metrics.severity.high > 0.5 ? 'high' : 
                  metrics.severity.medium > 0.5 ? 'medium' : 'low';
  
  return `https://firesight-ai-maps.example.com/damage-assessment/map-${Date.now()}-${severity}`;
}

function generateMockImageUrl(type) {
  // Generate mock satellite image URLs
  // In a real system, these would be actual image URLs
  return `https://firesight-ai-data.example.com/satellite-imagery/${type}-fire-${Date.now()}.png`;
}

module.exports = router; 