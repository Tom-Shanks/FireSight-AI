// Dashboard mock data

export const dashboardStats = {
  activeFires: 12,
  highRiskAreas: 35,
  averageRiskScore: 67,
  recentRainfall: 2,
  
  riskByRegion: [
    { region: 'Northern California', riskScore: 85 },
    { region: 'Southern California', riskScore: 73 },
    { region: 'Central Valley', riskScore: 45 },
    { region: 'Sierra Nevada', riskScore: 92 },
    { region: 'Coastal', riskScore: 32 }
  ],
  
  firesByType: [
    { type: 'Brush', count: 23 },
    { type: 'Forest', count: 18 },
    { type: 'Grass', count: 9 },
    { type: 'Structure', count: 3 },
    { type: 'Other', count: 5 }
  ],
  
  monthlyPredictions: [
    { month: 'Jan', predictedFires: 3 },
    { month: 'Feb', predictedFires: 4 },
    { month: 'Mar', predictedFires: 6 },
    { month: 'Apr', predictedFires: 8 },
    { month: 'May', predictedFires: 12 },
    { month: 'Jun', predictedFires: 18 },
    { month: 'Jul', predictedFires: 25 },
    { month: 'Aug', predictedFires: 28 },
    { month: 'Sep', predictedFires: 22 },
    { month: 'Oct', predictedFires: 14 },
    { month: 'Nov', predictedFires: 8 },
    { month: 'Dec', predictedFires: 4 }
  ]
};

export const highRiskAreas = Array.from({ length: 50 }, (_, i) => {
  const latOffset = (Math.random() - 0.5) * 5;
  const lngOffset = (Math.random() - 0.5) * 5;
  
  return {
    latitude: 37.5 + latOffset,
    longitude: -120 + lngOffset,
    riskScore: Math.floor(Math.random() * 100),
    region: `Region ${Math.floor(Math.random() * 10) + 1}`,
    vegetationDensity: `${Math.floor(Math.random() * 100)}%`,
    lastRainfall: `${Math.floor(Math.random() * 30) + 1} days ago`
  };
});

export const recentFires = Array.from({ length: 15 }, (_, i) => {
  const latOffset = (Math.random() - 0.5) * 5;
  const lngOffset = (Math.random() - 0.5) * 5;
  const statuses = ['Active', 'Contained', 'Under Control'];
  
  return {
    latitude: 37.5 + latOffset,
    longitude: -120 + lngOffset,
    name: `Wildfire ${String.fromCharCode(65 + i)}`,
    startDate: `${Math.floor(Math.random() * 30) + 1}/05/2023`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    acres: Math.floor(Math.random() * 10000),
    containment: Math.floor(Math.random() * 100)
  };
});

export default {
  dashboardStats,
  highRiskAreas,
  recentFires
}; 