/**
 * Satellite Service
 * Handles interactions with Sentinel Hub API for satellite imagery and data
 * Documentation: https://docs.sentinel-hub.com/api/latest/
 */
const axios = require('axios');
const apiKeys = require('../config/api_keys');

// Base URLs
const SENTINEL_HUB_BASE_URL = 'https://services.sentinel-hub.com';
const SENTINEL_HUB_AUTH_URL = 'https://services.sentinel-hub.com/oauth/token';

let authToken = null;
let tokenExpiration = 0;

/**
 * Authenticate with Sentinel Hub API to get OAuth token
 * @returns {Promise<string>} - Authentication token
 */
const authenticate = async () => {
  // Check if token is still valid
  if (authToken && tokenExpiration > Date.now()) {
    return authToken;
  }

  try {
    const response = await axios.post(
      SENTINEL_HUB_AUTH_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKeys.sentinelHub.clientId,
        client_secret: apiKeys.sentinelHub.clientSecret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Set token expiration to 1 hour minus 5 minutes (in milliseconds)
    authToken = response.data.access_token;
    tokenExpiration = Date.now() + ((response.data.expires_in - 300) * 1000);
    
    return authToken;
  } catch (error) {
    console.error('Error authenticating with Sentinel Hub:', error.message);
    throw new Error(`Failed to authenticate with Sentinel Hub: ${error.message}`);
  }
};

/**
 * Get vegetation indices (NDVI) for a specific area
 * @param {number} minLat - Minimum latitude (southern boundary)
 * @param {number} maxLat - Maximum latitude (northern boundary)
 * @param {number} minLon - Minimum longitude (western boundary)
 * @param {number} maxLon - Maximum longitude (eastern boundary)
 * @param {string} date - Date in YYYY-MM-DD format (or 'latest')
 * @returns {Promise<Object>} - NDVI data response
 */
const getVegetationIndices = async (minLat, maxLat, minLon, maxLon, date = 'latest') => {
  try {
    const token = await authenticate();
    
    // Construct the request body for the Sentinel Hub Process API
    const requestBody = {
      input: {
        bounds: {
          bbox: [minLon, minLat, maxLon, maxLat],
          properties: {
            crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
          }
        },
        data: [
          {
            dataFilter: {
              timeRange: {
                from: date === 'latest' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : date,
                to: date === 'latest' ? new Date().toISOString() : date
              }
            },
            type: 'sentinel-2-l2a'
          }
        ]
      },
      output: {
        width: 512,
        height: 512,
        responses: [
          {
            identifier: 'default',
            format: {
              type: 'image/png'
            }
          },
          {
            identifier: 'ndvi',
            format: {
              type: 'image/png'
            }
          },
          {
            identifier: 'statistics',
            format: {
              type: 'application/json'
            }
          }
        ]
      },
      evalscript: `
        function setup() {
          return {
            input: ["B04", "B08", "dataMask"],
            output: {
              bands: 4,
              sampleType: "FLOAT32"
            }
          };
        }

        function evaluatePixel(sample) {
          // Calculate NDVI: (NIR - RED) / (NIR + RED)
          // NIR = B08, RED = B04
          let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
          
          // Return RGBA values for visualization
          if (sample.dataMask == 0) {
            return [0, 0, 0, 0];
          }
          
          // Color scale from red (low NDVI) to green (high NDVI)
          if (ndvi < 0) {
            return [0.5, 0.5, 0.5, 1]; // Gray for negative NDVI
          } else if (ndvi < 0.2) {
            return [1, 0, 0, 1]; // Red for very low vegetation
          } else if (ndvi < 0.4) {
            return [1, 1, 0, 1]; // Yellow for low vegetation
          } else if (ndvi < 0.6) {
            return [0.5, 1, 0, 1]; // Light green for moderate vegetation
          } else {
            return [0, 1, 0, 1]; // Green for high vegetation
          }
        }
      `
    };
    
    const response = await axios.post(
      `${SENTINEL_HUB_BASE_URL}/api/v1/process`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching vegetation indices:', error.message);
    throw new Error(`Failed to fetch vegetation data: ${error.message}`);
  }
};

/**
 * Get vegetation density scores for a specific area
 * This processes the NDVI data to produce a simpler vegetation density score
 * @param {number} latitude - Center point latitude
 * @param {number} longitude - Center point longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Promise<Object>} - Vegetation density data
 */
const getVegetationDensity = async (latitude, longitude, radiusKm = 10) => {
  try {
    // Convert radius to approximate degree offsets (rough estimate)
    const degreeOffset = radiusKm / 111;
    
    const minLat = latitude - degreeOffset;
    const maxLat = latitude + degreeOffset;
    const minLon = longitude - degreeOffset;
    const maxLon = longitude + degreeOffset;
    
    // Get NDVI data
    const ndviData = await getVegetationIndices(minLat, maxLat, minLon, maxLon);
    
    // Process statistics to get a vegetation density score
    // This would normally analyze the actual NDVI values from the statistics response
    // For now, we'll return a simplified result
    
    // In real implementation, you would analyze the statistics from ndviData.statistics
    const vegetationScore = Math.random() * 50 + 50; // Placeholder score between 50-100
    
    return {
      location: {
        latitude,
        longitude,
        radiusKm
      },
      vegetationDensity: vegetationScore,
      vegetationCategory: getVegetationCategory(vegetationScore),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calculating vegetation density:', error.message);
    throw new Error(`Failed to calculate vegetation density: ${error.message}`);
  }
};

/**
 * Get vegetation category based on density score
 * @param {number} score - Vegetation density score (0-100)
 * @returns {string} - Category descriptor
 */
const getVegetationCategory = (score) => {
  if (score < 20) return 'Barren';
  if (score < 40) return 'Sparse';
  if (score < 60) return 'Moderate';
  if (score < 80) return 'Dense';
  return 'Very Dense';
};

module.exports = {
  getVegetationIndices,
  getVegetationDensity
}; 