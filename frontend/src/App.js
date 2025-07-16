import React, { useState, useEffect } from 'react';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Container, 
  Box, 
  Typography, 
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Fab,
  Tooltip,
  Tab,
  Tabs,
  Chip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import BugReportIcon from '@mui/icons-material/BugReport';
import MapIcon from '@mui/icons-material/Map';
import CalculateIcon from '@mui/icons-material/Calculate';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import Navigation from './components/Navigation';
import MapComponent from './components/MapComponent';
import ColoradoFireMap from './components/ColoradoFireMap';
import CostCalculator from './components/CostCalculator';
import LiveDataFeed from './components/LiveDataFeed';
import DashboardStats from './components/DashboardStats';
import PredictionForm from './components/PredictionForm';
import DebugInfo from './components/DebugInfo';
import apiService from './services/api';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App({ defaultPage = 'dashboard', showDebug: initialShowDebug = false }) {
  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [tabValue, setTabValue] = useState(0);
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiStatusMessage, setApiStatusMessage] = useState('');
  const [showDebug, setShowDebug] = useState(initialShowDebug);
  
  // Set initial page based on props
  useEffect(() => {
    setCurrentPage(defaultPage);
  }, [defaultPage]);
  
  // Add keyboard listener for debug mode (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check for Ctrl+Shift+D keyboard shortcut
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log('Checking API status...');
        // Actually check the API now
        const status = await apiService.checkHealth();
        console.log('API status check result:', status);
        
        setApiStatus('connected');
        setApiStatusMessage(status.message || 'API is operational');
      } catch (error) {
        console.error('API status check failed:', error);
        setApiStatus('error');
        setApiStatusMessage(`Failed to connect to API: ${error.message}. Please check your configuration.`);
      }
    };
    
    checkApiStatus();
  }, []);
  
  const handleNavigate = (pageId) => {
    setCurrentPage(pageId);
  };
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Box>
            <Paper sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Colorado Wildfire Monitoring System
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="🚁 Part 107 Pilot Available" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="📍 Denver-Based" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                  <Chip label="🔥 Real-time Monitoring" sx={{ background: 'rgba(255,255,255,0.2)', color: 'white' }} />
                </Box>
              </Box>
            </Paper>
            
            <Paper sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab icon={<MapIcon />} label="Live Fire Map" />
                <Tab icon={<CalculateIcon />} label="Cost Calculator" />
                <Tab icon={<RssFeedIcon />} label="Activity Feed" />
              </Tabs>
            </Paper>
            
            <Box sx={{ mt: 2 }}>
              {tabValue === 0 && <ColoradoFireMap />}
              {tabValue === 1 && <CostCalculator />}
              {tabValue === 2 && <LiveDataFeed />}
            </Box>
          </Box>
        );
      case 'map':
        return <ColoradoFireMap />;
      case 'prediction':
        return <PredictionForm />;
      case 'alerts':
        return <LiveDataFeed />;
      case 'settings':
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>
            <Typography>
              Settings feature is coming soon. You'll be able to customize the dashboard and notification preferences.
            </Typography>
          </Paper>
        );
      default:
        return <ColoradoFireMap />;
    }
  };
  
  // Show debug panel if explicitly enabled
  if (showDebug) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <DebugInfo onClose={() => setShowDebug(false)} />
      </ThemeProvider>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation onNavigate={handleNavigate} currentPage={currentPage} />
          
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
            {/* API Status Alert */}
            {apiStatus === 'checking' && (
              <Alert 
                severity="info" 
                sx={{ mb: 3, display: 'flex', alignItems: 'center' }}
              >
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Checking connection to backend API...
              </Alert>
            )}
            
            {apiStatus === 'error' && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {apiStatusMessage}
              </Alert>
            )}
            
            {apiStatus === 'connected' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {apiStatusMessage}
              </Alert>
            )}
            
            {/* Main Content */}
            {renderPage()}
            
            {/* Debug button visible only in development or with URL param */}
            {(process.env.NODE_ENV !== 'production' || window.location.search.includes('debug=true')) && (
              <Tooltip title="Open Debug Panel (Ctrl+Shift+D)">
                <Fab 
                  color="secondary" 
                  size="medium" 
                  onClick={() => setShowDebug(true)}
                  sx={{ position: 'fixed', bottom: 20, right: 20 }}
                >
                  <BugReportIcon />
                </Fab>
              </Tooltip>
            )}
          </Container>
          
          {/* Footer */}
          <Box 
            component="footer" 
            sx={{ 
              py: 3, 
              px: 2, 
              mt: 'auto', 
              backgroundColor: (theme) => theme.palette.grey[100]
            }}
          >
            <Container maxWidth="xl">
              <Typography variant="body2" color="text.secondary" align="center">
                FireSight AI © {new Date().getFullYear()} | Wildfire Prediction and Prevention System
              </Typography>
            </Container>
          </Box>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App; 