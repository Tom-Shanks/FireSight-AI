/**
 * Fire Data Service
 * Handles interactions with NASA's FIRMS (Fire Information for Resource Management System) API
 * Documentation: https://firms.modaps.eosdis.nasa.gov/api/
 */
const axios = require('axios');
const apiKeys = require('../config/api_keys');

// Base URL for NASA FIRMS API
const NASA_FIRMS_BASE_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area';

/**
 * Get active fires in a specified region
 * @param {number} minLat - Minimum latitude (southern boundary)
 * @param {number} maxLat - Maximum latitude (northern boundary)
 * @param {number} minLon - Minimum longitude (western boundary)
 * @param {number} maxLon - Maximum longitude (eastern boundary)
 * @param {string} satellite - MODIS (c6.1), VIIRS 375m (suomi-npp), VIIRS 375m (noaa-20)
 * @param {number} days - Number of days of data (1-10)
 * @returns {Promise<Array>} - List of fire data points
 */
const getActiveFires = async (minLat, maxLat, minLon, maxLon, satellite = 'viirs-snpp', days = 1) => {
  try {
    // NASA FIRMS API requires parameters in a specific format
    const params = new URLSearchParams({
      area_type: 'rectangle',
      coords: `${minLon},${minLat},${maxLon},${maxLat}`,
      satellite: satellite,
      days: days,
      API_KEY: apiKeys.nasaFirms
    });
    
    const response = await axios.get(`${NASA_FIRMS_BASE_URL}/csv/${params.toString()}`);
    
    // Parse CSV response
    const parsedData = parseFireDataCsv(response.data);
    return parsedData;
  } catch (error) {
    console.error('Error fetching active fires:', error.message);
    throw new Error(`Failed to fetch fire data: ${error.message}`);
  }
};

/**
 * Get active fires around a specific point
 * @param {number} latitude - Center point latitude
 * @param {number} longitude - Center point longitude
 * @param {number} radiusKm - Radius in kilometers
 * @param {string} satellite - MODIS (c6.1), VIIRS 375m (suomi-npp), VIIRS 375m (noaa-20)
 * @param {number} days - Number of days of data (1-10)
 * @returns {Promise<Array>} - List of fire data points
 */
const getFiresNearPoint = async (latitude, longitude, radiusKm = 100, satellite = 'viirs-snpp', days = 1) => {
  try {
    // NASA FIRMS API requires parameters in a specific format
    const params = new URLSearchParams({
      area_type: 'circle',
      coords: `${longitude},${latitude}`,
      radius: radiusKm,
      satellite: satellite,
      days: days,
      API_KEY: apiKeys.nasaFirms
    });
    
    const response = await axios.get(`${NASA_FIRMS_BASE_URL}/csv/${params.toString()}`);
    
    // Parse CSV response
    const parsedData = parseFireDataCsv(response.data);
    return parsedData;
  } catch (error) {
    console.error('Error fetching fires near point:', error.message);
    throw new Error(`Failed to fetch fire data near point: ${error.message}`);
  }
};

/**
 * Parse CSV data from NASA FIRMS API
 * @param {string} csvData - CSV data from FIRMS API
 * @returns {Array<Object>} - Array of fire objects
 */
const parseFireDataCsv = (csvData) => {
  // Simple CSV parser
  const lines = csvData.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    const values = line.split(',');
    const fireData = {};
    
    headers.forEach((header, index) => {
      // Map CSV headers to our expected format
      let value = values[index];
      if (!isNaN(value) && value !== '') {
        value = parseFloat(value);
      }
      
      switch(header.trim()) {
        case 'latitude':
          fireData.latitude = value;
          break;
        case 'longitude':
          fireData.longitude = value;
          break;
        case 'bright_ti4':
        case 'bright_ti5':
          fireData.intensity = value;
          break;
        case 'acq_date':
          fireData.detectionDate = value;
          break;
        case 'acq_time':
          fireData.detectionTime = value;
          break;
        default:
          fireData[header.trim()] = value;
      }
    });
    
    return fireData;
  });
};

/**
 * Get historical fire data (may require different API or database access)
 * This function is a placeholder for historical fire data integration
 */
const getHistoricalFires = async (region, startDate, endDate) => {
  // This would need to connect to a historical database or API
  // For now, return a placeholder message
  return {
    message: 'Historical fire data integration pending',
    region,
    startDate,
    endDate
  };
};

module.exports = {
  getActiveFires,
  getFiresNearPoint,
  getHistoricalFires
}; 