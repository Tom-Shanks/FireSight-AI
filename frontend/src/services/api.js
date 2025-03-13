import axios from 'axios';

// Get the API URL from environment variables, or use a default for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const endpoints = {
  // Health check
  health: '/health',
  
  // Risk prediction
  predictRisk: '/predict/risk',
  
  // Fire spread simulation
  simulateFireSpread: '/simulate/spread',
  
  // Damage assessment
  assessDamage: '/assess/damage',
  
  // Data endpoints
  recentFires: '/data/recent-fires',
  highRiskAreas: '/data/high-risk-areas',
};

// API service functions
const apiService = {
  // Health check
  checkHealth: async () => {
    try {
      const response = await api.get(endpoints.health);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  // Risk prediction
  predictRisk: async (location, radius, startDate, endDate) => {
    try {
      const response = await api.post(endpoints.predictRisk, {
        location,
        radius_km: radius,
        start_date: startDate,
        end_date: endDate,
      });
      return response.data;
    } catch (error) {
      console.error('Risk prediction failed:', error);
      throw error;
    }
  },

  // Fire spread simulation
  simulateFireSpread: async (ignitionPoints, simulationHours, resolutionMeters) => {
    try {
      const response = await api.post(endpoints.simulateFireSpread, {
        ignition_points: ignitionPoints,
        simulation_hours: simulationHours,
        resolution_meters: resolutionMeters,
      });
      return response.data;
    } catch (error) {
      console.error('Fire spread simulation failed:', error);
      throw error;
    }
  },

  // Damage assessment
  assessDamage: async (fireArea, preFireDate, postFireDate) => {
    try {
      const response = await api.post(endpoints.assessDamage, {
        fire_area: fireArea,
        pre_fire_date: preFireDate,
        post_fire_date: postFireDate,
      });
      return response.data;
    } catch (error) {
      console.error('Damage assessment failed:', error);
      throw error;
    }
  },

  // Get recent fires
  getRecentFires: async (days = 7) => {
    try {
      const response = await api.get(`${endpoints.recentFires}?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch recent fires:', error);
      throw error;
    }
  },

  // Get high risk areas
  getHighRiskAreas: async (threshold = 0.7) => {
    try {
      const response = await api.get(`${endpoints.highRiskAreas}?threshold=${threshold}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch high risk areas:', error);
      throw error;
    }
  },
};

export default apiService; 