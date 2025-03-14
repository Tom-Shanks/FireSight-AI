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
  Alert
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navigation from './components/Navigation';
import MapComponent from './components/MapComponent';
import DashboardStats from './components/DashboardStats';
import PredictionForm from './components/PredictionForm';
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
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [apiStatus, setApiStatus] = useState('checking');
  const [apiStatusMessage, setApiStatusMessage] = useState('');
  
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
        return <DashboardStats />;
      case 'map':
        return <MapComponent />;
      case 'prediction':
        return <PredictionForm />;
      case 'alerts':
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Wildfire Alerts</Typography>
            <Typography>
              This feature is coming soon. You will be able to set up custom alerts for specific regions.
            </Typography>
          </Paper>
        );
      case 'about':
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>About FireSight AI</Typography>
            <Typography paragraph>
              FireSight AI is an advanced wildfire prediction and prevention system that uses machine learning and satellite imagery to identify high-risk areas before fires start.
            </Typography>
            <Typography paragraph>
              Our system analyzes multiple data sources including weather patterns, vegetation density, historical fire data, and terrain information to provide accurate risk assessments and predictions.
            </Typography>
            <Typography paragraph>
              Key features include:
            </Typography>
            <ul>
              <li>
                <Typography>Real-time wildfire risk mapping</Typography>
              </li>
              <li>
                <Typography>Predictive analytics for fire spread</Typography>
              </li>
              <li>
                <Typography>Custom risk assessments for specific locations</Typography>
              </li>
              <li>
                <Typography>Early warning alerts for high-risk conditions</Typography>
              </li>
              <li>
                <Typography>Historical data analysis and trend identification</Typography>
              </li>
            </ul>
          </Paper>
        );
      case 'settings':
        return (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Settings</Typography>
            <Typography>
              Settings configuration will be available in a future update.
            </Typography>
          </Paper>
        );
      default:
        return <DashboardStats />;
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
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