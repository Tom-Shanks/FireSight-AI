// Health check endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'FireSight AI API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'vercel'
  });
}; 