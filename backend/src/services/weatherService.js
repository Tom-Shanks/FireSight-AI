/**
 * Weather Service
 * Handles interactions with the OpenWeatherMap API
 */
const axios = require('axios');
const apiKeys = require('../config/api_keys');

// Base URLs
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Get current weather data for a specific location
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {string} units - Units of measurement (metric, imperial, standard)
 * @returns {Promise<Object>} - Weather data response
 */
const getCurrentWeather = async (latitude, longitude, units = 'metric') => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        units: units,
        appid: apiKeys.openWeatherMap
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching current weather:', error.message);
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
};

/**
 * Get weather forecast for a specific location
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {string} units - Units of measurement (metric, imperial, standard)
 * @returns {Promise<Object>} - Forecast data response
 */
const getWeatherForecast = async (latitude, longitude, units = 'metric') => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
      params: {
        lat: latitude,
        lon: longitude,
        units: units,
        appid: apiKeys.openWeatherMap
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching weather forecast:', error.message);
    throw new Error(`Failed to fetch forecast data: ${error.message}`);
  }
};

/**
 * Get historical weather data for a specific location and time
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @param {number} timestamp - Unix timestamp for historical data
 * @param {string} units - Units of measurement (metric, imperial, standard)
 * @returns {Promise<Object>} - Historical weather data response
 */
const getHistoricalWeather = async (latitude, longitude, timestamp, units = 'metric') => {
  try {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/onecall/timemachine`, {
      params: {
        lat: latitude,
        lon: longitude,
        dt: timestamp,
        units: units,
        appid: apiKeys.openWeatherMap
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching historical weather:', error.message);
    throw new Error(`Failed to fetch historical weather data: ${error.message}`);
  }
};

/**
 * Extract fire risk related parameters from weather data
 * @param {Object} weatherData - Weather data from OpenWeatherMap
 * @returns {Object} - Extracted parameters relevant to fire risk
 */
const extractFireRiskParameters = (weatherData) => {
  return {
    temperature: weatherData.main?.temp || 0,
    humidity: weatherData.main?.humidity || 0,
    windSpeed: weatherData.wind?.speed || 0,
    windDirection: weatherData.wind?.deg || 0,
    rainfall: weatherData.rain?.['1h'] || 0, // Last hour rainfall in mm
    conditions: weatherData.weather?.[0]?.main || 'Unknown'
  };
};

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getHistoricalWeather,
  extractFireRiskParameters
}; 