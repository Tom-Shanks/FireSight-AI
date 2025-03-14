import axios from 'axios';
import mockData from '../mockData/dashboard';

// Get the API URL from environment variables, or use a default for development
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

console.log('Using API URL:', API_URL);

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests
  withCredentials: false,
  // Timeout after 10 seconds
  timeout: 10000,
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

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

// Health check
export const checkHealthStatus = async () => {
  try {
    console.log('Attempting health check to:', API_URL + endpoints.health);
    const response = await api.get(endpoints.health);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    // If in development and API is unreachable, provide mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock health data for development');
      return {
        status: 'mock-healthy',
        message: 'MOCK API (Real API unreachable)',
        timestamp: new Date().toISOString(),
        version: '1.0.0-mock'
      };
    }
    throw error;
  }
};

// Risk prediction
export const getRiskPrediction = async (requestData) => {
  try {
    const response = await api.post(endpoints.predictRisk, requestData);
    return response.data;
  } catch (error) {
    console.error('Risk prediction failed:', error);
    throw error;
  }
};

// Fire spread simulation
export const simulateFireSpread = async (requestData) => {
  try {
    const response = await api.post(endpoints.simulateFireSpread, requestData);
    return response.data;
  } catch (error) {
    console.error('Fire spread simulation failed:', error);
    throw error;
  }
};

// Damage assessment
export const assessDamage = async (requestData) => {
  try {
    const response = await api.post(endpoints.assessDamage, requestData);
    return response.data;
  } catch (error) {
    console.error('Damage assessment failed:', error);
    throw error;
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get(`/data/dashboard-stats`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    // If in development and API is unreachable, provide mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock dashboard stats for development');
      return mockData.dashboardStats;
    }
    throw error;
  }
};

// Get recent fires
export const getRecentFires = async (days = 7) => {
  try {
    const response = await api.get(`${endpoints.recentFires}?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent fires:', error);
    // If in development and API is unreachable, provide mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock fire data for development');
      return mockData.recentFires;
    }
    throw error;
  }
};

// Get high risk areas
export const getHighRiskAreas = async (threshold = 0.7) => {
  try {
    const response = await api.get(`${endpoints.highRiskAreas}?threshold=${threshold}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch high risk areas:', error);
    // If in development and API is unreachable, provide mock data
    if (process.env.NODE_ENV === 'development') {
      console.warn('Falling back to mock high risk areas data for development');
      return mockData.highRiskAreas;
    }
    throw error;
  }
};

// API service functions (for backward compatibility)
const apiService = {
  checkHealth: checkHealthStatus,
  predictRisk: getRiskPrediction,
  simulateFireSpread,
  assessDamage,
  getRecentFires,
  getHighRiskAreas,
  getDashboardStats
};

export default apiService; 