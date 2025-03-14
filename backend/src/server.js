const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const healthRoutes = require('./routes/health');
const predictRoutes = require('./routes/predict');
const simulateRoutes = require('./routes/simulate');
const assessRoutes = require('./routes/assess');
const dataRoutes = require('./routes/data');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/assess', assessRoutes);
app.use('/api/data', dataRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FireSight AI API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      predict: '/api/predict/risk',
      simulate: '/api/simulate/spread',
      assess: '/api/assess/damage',
      data: {
        recentFires: '/api/data/recent-fires',
        highRiskAreas: '/api/data/high-risk-areas'
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 