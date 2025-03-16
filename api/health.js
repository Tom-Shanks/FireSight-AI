// Health check endpoint for Vercel
module.exports = (req, res) => {
  const healthData = {
    status: 'operational',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      isVercel: !!process.env.VERCEL || false,
      vercelEnv: process.env.VERCEL_ENV || 'unknown'
    },
    meta: {
      requestMethod: req.method,
      requestPath: req.url,
      userAgent: req.headers['user-agent'] || 'unknown',
      acceptHeader: req.headers['accept'] || 'unknown',
      contentType: req.headers['content-type'] || 'not specified'
    }
  };

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Send the health data
  res.status(200).json(healthData);
}; 