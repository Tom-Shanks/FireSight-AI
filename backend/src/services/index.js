/**
 * Services Index
 * Exports all external API service modules
 */

const weatherService = require('./weatherService');
const fireDataService = require('./fireDataService');
const satelliteService = require('./satelliteService');

module.exports = {
  weather: weatherService,
  fireData: fireDataService,
  satellite: satelliteService
}; 