# FireSight AI API

This directory contains the serverless API functions for the FireSight AI project, designed to be deployed on Vercel.

## API Structure

The API is organized into the following directories:

- `/api` - Root directory for all API functions
  - `/health.js` - Health check endpoint
  - `/predict` - Risk prediction endpoints
    - `/risk.js` - Wildfire risk prediction
  - `/data` - Data retrieval endpoints
    - `/dashboard-stats.js` - Dashboard statistics
    - `/high-risk-areas.js` - High-risk areas data
    - `/recent-fires.js` - Recent fires data
  - `/_utils` - Utility functions
    - `/middleware.js` - Middleware handling for serverless functions

## Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/predict/risk` | POST | Predict wildfire risk for a location |
| `/api/data/dashboard-stats` | GET | Get dashboard statistics |
| `/api/data/high-risk-areas` | GET | Get high-risk areas data |
| `/api/data/recent-fires` | GET | Get recent fires data |

## Adding New Endpoints

To add a new endpoint to the API, follow these steps:

1. Create a new JavaScript file in the appropriate directory (e.g., `/api/data/new-endpoint.js`)
2. Use the middleware handler pattern to ensure consistent error handling and CORS support:

```javascript
// Example new endpoint
const cors = require('cors');
const { createMiddlewareHandler } = require('../_utils/middleware');

async function handler(req, res) {
  try {
    // Implement your endpoint logic here
    
    // Return a response
    res.status(200).json({
      success: true,
      data: { /* your data */ }
    });
  } catch (error) {
    console.error('Error in endpoint:', error);
    res.status(500).json({
      error: 'Failed to process request',
      message: error.message
    });
  }
}

// Create the middleware-wrapped handler with CORS support
module.exports = createMiddlewareHandler(handler, [
  cors({
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'https://firesight-ai.vercel.app']
  })
]);
```

## Implementing ML-Based Endpoints

For ML-based endpoints, consider the following approaches:

1. **Serverless ML Inference**: For lightweight models, you can include the model directly in the serverless function.
2. **External ML Service**: For more complex models, call an external ML service API.
3. **Edge Functions**: For models requiring more compute, consider using Vercel Edge Functions.

Example implementation for an ML-based endpoint:

```javascript
const tf = require('@tensorflow/tfjs-node');
const cors = require('cors');
const { createMiddlewareHandler } = require('../_utils/middleware');

// Load the model (in a real implementation, this would be cached)
let model;
async function loadModel() {
  if (!model) {
    model = await tf.loadLayersModel('file://./models/risk-model/model.json');
  }
  return model;
}

async function handler(req, res) {
  try {
    // Get the model
    const model = await loadModel();
    
    // Process input data
    const { features } = req.body;
    const inputTensor = tf.tensor2d([features]);
    
    // Run inference
    const prediction = model.predict(inputTensor);
    const result = await prediction.array();
    
    // Return prediction
    res.status(200).json({
      prediction: result[0][0],
      confidence: 0.85,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in ML prediction:', error);
    res.status(500).json({
      error: 'Failed to process ML prediction',
      message: error.message
    });
  }
}

// Create the middleware-wrapped handler with CORS support
module.exports = createMiddlewareHandler(handler, [
  cors({
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'https://firesight-ai.vercel.app']
  })
]);
```

## Recommended ML Models for Disaster Prediction

Based on current research in wildfire prediction and disaster management, consider implementing the following ML models:

1. **Risk Assessment Model**:
   - Input: Geographic coordinates, vegetation data, weather conditions, historical fire data
   - Output: Risk score (0-100), risk level, contributing factors
   - Recommended algorithms: Gradient Boosting, Random Forest, or Deep Neural Networks

2. **Fire Spread Simulation**:
   - Input: Ignition point, wind speed/direction, vegetation, topography
   - Output: Spread pattern, affected area over time, evacuation time estimates
   - Recommended algorithms: Cellular Automata, Physics-informed Neural Networks

3. **Damage Assessment**:
   - Input: Fire intensity, duration, affected area, population density
   - Output: Estimated structural damage, environmental impact, economic impact
   - Recommended algorithms: Regression models, Computer Vision for satellite imagery analysis

4. **Early Warning System**:
   - Input: Real-time weather data, satellite imagery, ground sensor data
   - Output: Alert level, probability of fire ignition, recommended actions
   - Recommended algorithms: Time-series forecasting, Anomaly detection

## Environment Variables

The API uses the following environment variables:

- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for CORS
- `NODE_ENV` - Environment (development, production)

## Testing Locally

To test the API locally:

1. Install dependencies: `npm install`
2. Run the development server: `vercel dev`
3. Access the API at `http://localhost:3000/api/health`

## Deployment

The API is automatically deployed to Vercel when changes are pushed to the main branch.

## References

For more information on ML-guided disaster prediction, refer to these research papers:

1. Zhang, Y., et al. (2023). "Machine Learning for Wildfire Risk Assessment: A Comprehensive Review." *Environmental Modelling & Software*, 158, 105525.
2. Chen, J., et al. (2022). "Deep Learning Approaches for Wildfire Spread Prediction." *Remote Sensing*, 14(8), 1954.
3. Radke, D., et al. (2023). "Satellite-based Deep Learning for Early Wildfire Detection." *IEEE Transactions on Geoscience and Remote Sensing*, 61, 1-15.
4. Jain, P., et al. (2022). "A Review of Machine Learning Applications in Wildfire Science and Management." *Environmental Reviews*, 30(1), 96-116. 