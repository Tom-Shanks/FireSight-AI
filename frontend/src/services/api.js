import axios from 'axios';
import mockData from '../mockData/dashboard';

// Debug flag - can be controlled via environment variable
const DEBUG = process.env.REACT_APP_DEBUG === 'true' || process.env.NODE_ENV !== 'production';

// Get the API URL based on environment and hostname
const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hostname = window.location.hostname;
  
  // Add Vercel debugging
  if (DEBUG) {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Hostname:', hostname);
  }
  
  // On Vercel deployment
  if (isProduction || hostname.includes('vercel.app')) {
    // Use relative path for same-domain API
    if (DEBUG) console.log('Using production API path');
    return '/api';
  }
  
  // Local development
  if (DEBUG) console.log('Using development API path');
  return 'http://localhost:3000/api';
};

const API_URL = process.env.REACT_APP_API_URL || getApiUrl();

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

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    if (DEBUG) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('Request data:', config.data);
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(`API Response: ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error.message);
    
    // Detailed error logging for debugging
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      console.error('URL that failed:', error.config.url);
    } else if (error.request) {
      console.error('Request was made but no response received');
      console.error('Request details:', error.request);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints - updated for Vercel serverless format
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
  dashboardStats: '/data/dashboard-stats',
};

// Helper function to retry failed requests with different base URLs
const retryWithAlternativeUrls = async (endpoint, method = 'get', data = null) => {
  // List of possible base URLs to try (in order)
  const baseUrls = [
    API_URL, // Original configured URL
    '/api',  // Relative path (/api)
    '', // Root relative path
  ];
  
  let lastError = null;
  
  for (const baseUrl of baseUrls) {
    try {
      const url = `${baseUrl}${endpoint}`;
      if (DEBUG) console.log(`Trying ${method.toUpperCase()} request to: ${url}`);
      
      if (method.toLowerCase() === 'post') {
        const response = await axios.post(url, data, { 
          headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
      } else {
        const response = await axios.get(url);
        return response.data;
      }
    } catch (error) {
      console.error(`Failed with baseUrl ${baseUrl}:`, error.message);
      lastError = error;
      // Continue to next base URL
    }
  }
  
  // If we get here, all attempts failed
  console.error('All API connection attempts failed');
  throw lastError;
};

// Health check
export const checkHealthStatus = async () => {
  try {
    console.log('Attempting health check to:', API_URL + endpoints.health);
    const response = await api.get(endpoints.health);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    
    try {
      // Try alternative URLs
      if (DEBUG) console.log('Attempting health check with fallback URLs');
      return await retryWithAlternativeUrls(endpoints.health);
    } catch (fallbackError) {
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
  }
};

// Risk prediction
export const getRiskPrediction = async (requestData) => {
  try {
    const response = await api.post(endpoints.predictRisk, requestData);
    return response.data;
  } catch (error) {
    console.error('Risk prediction failed:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(endpoints.predictRisk, 'post', requestData);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

// Fire spread simulation
export const simulateFireSpread = async (requestData) => {
  try {
    const response = await api.post(endpoints.simulateFireSpread, requestData);
    return response.data;
  } catch (error) {
    console.error('Fire spread simulation failed:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(endpoints.simulateFireSpread, 'post', requestData);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

// Damage assessment
export const assessDamage = async (requestData) => {
  try {
    const response = await api.post(endpoints.assessDamage, requestData);
    return response.data;
  } catch (error) {
    console.error('Damage assessment failed:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(endpoints.assessDamage, 'post', requestData);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get(endpoints.dashboardStats);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(endpoints.dashboardStats);
    } catch (fallbackError) {
      // If in development and API is unreachable, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock dashboard stats for development');
        return mockData.dashboardStats;
      }
      throw fallbackError;
    }
  }
};

// Get recent fires
export const getRecentFires = async (days = 7) => {
  try {
    const response = await api.get(`${endpoints.recentFires}?days=${days}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent fires:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(`${endpoints.recentFires}?days=${days}`);
    } catch (fallbackError) {
      // If in development and API is unreachable, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock fire data for development');
        return mockData.recentFires;
      }
      throw fallbackError;
    }
  }
};

// Get high risk areas
export const getHighRiskAreas = async (threshold = 0.7) => {
  try {
    const response = await api.get(`${endpoints.highRiskAreas}?threshold=${threshold}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch high risk areas:', error);
    
    try {
      // Try alternative URLs
      return await retryWithAlternativeUrls(`${endpoints.highRiskAreas}?threshold=${threshold}`);
    } catch (fallbackError) {
      // If in development and API is unreachable, provide mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock high risk areas data for development');
        return mockData.highRiskAreas;
      }
      throw fallbackError;
    }
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