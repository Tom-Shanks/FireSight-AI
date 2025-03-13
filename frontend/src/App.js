import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container, Typography, Button } from '@mui/material';
import Dashboard from './pages/Dashboard';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import './App.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff6b35', // Fire orange
    },
    secondary: {
      main: '#2a9d8f', // Teal
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const apiUrl = process.env.REACT_APP_API_URL || 'API URL not configured';

  useEffect(() => {
    // This is just a placeholder - in a real app, you'd fetch from your API
    setTimeout(() => {
      setApiStatus('API not connected yet. Configure REACT_APP_API_URL in GitHub secrets.');
    }, 2000);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
          <Navigation />

          <Box sx={{ flex: 1 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/alerts" element={
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                  <Typography variant="h4" gutterBottom>
                    Alerts System
                  </Typography>
                  <Typography variant="body1">
                    This page will display real-time alerts for high-risk areas and active fires.
                  </Typography>
                </Container>
              } />
              <Route path="/about" element={
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                  <Typography variant="h4" gutterBottom>
                    About FireSight AI
                  </Typography>
                  <Typography variant="body1" paragraph>
                    FireSight AI is an advanced wildfire prediction and prevention system that uses machine learning, 
                    satellite imagery, and environmental data to predict, monitor, and respond to wildfire threats.
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Our mission is to reduce the impact of wildfires on communities and ecosystems through early 
                    detection, accurate prediction, and effective response coordination.
                  </Typography>
                </Container>
              } />
              <Route path="/" element={
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                  <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Typography variant="h3" component="h1" gutterBottom>
                      FireSight AI
                    </Typography>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Wildfire Prediction and Prevention System
                    </Typography>
                    
                    <Box sx={{ my: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="body1" gutterBottom>
                        Backend API: {apiStatus}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        API URL: {apiUrl}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" paragraph sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
                      This system uses machine learning and geospatial data to predict, monitor, 
                      and respond to wildfire threats.
                    </Typography>
                    
                    <Box sx={{ maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
                      <Typography variant="h6" gutterBottom>
                        Features:
                      </Typography>
                      <ul>
                        <li>Wildfire Risk Prediction</li>
                        <li>Fire Spread Simulation</li>
                        <li>Damage Assessment</li>
                        <li>Emergency Response Integration</li>
                      </ul>
                    </Box>
                    
                    <Button 
                      variant="contained" 
                      color="primary" 
                      component={Link} 
                      to="/dashboard" 
                      size="large"
                      sx={{ mt: 4 }}
                    >
                      Launch Dashboard
                    </Button>
                  </Box>
                </Container>
              } />
            </Routes>
          </Box>
          
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 