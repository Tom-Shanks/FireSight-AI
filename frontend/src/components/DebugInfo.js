import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import apiService from '../services/api';

const DebugInfo = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);
  const [networkInfo, setNetworkInfo] = useState({});
  const [envInfo, setEnvInfo] = useState({});
  const [routeInfo, setRouteInfo] = useState({});
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    collectDebugInfo();
  }, []);

  const collectDebugInfo = async () => {
    // Collect environment info
    setEnvInfo({
      nodeEnv: process.env.NODE_ENV || 'undefined',
      buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
      apiUrl: process.env.REACT_APP_API_URL || 'auto-detected',
      userAgent: navigator.userAgent,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      pathname: window.location.pathname
    });

    // Collect route info
    setRouteInfo({
      currentPath: window.location.pathname,
      currentQuery: window.location.search,
      currentHash: window.location.hash,
      currentUrl: window.location.href,
      previousPage: document.referrer || 'none'
    });

    // Collect network info
    try {
      const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;
      
      setNetworkInfo({
        online: navigator.onLine,
        connectionType: connection ? connection.effectiveType : 'unknown',
        downlink: connection ? connection.downlink : 'unknown',
        rtt: connection ? connection.rtt : 'unknown'
      });
    } catch (e) {
      setNetworkInfo({
        online: navigator.onLine,
        error: e.message
      });
    }

    // Test API connections
    await testApiConnections();

    setLoading(false);
  };

  const testApiConnections = async () => {
    const results = [];
    
    // Test health endpoint
    try {
      const startTime = performance.now();
      const healthData = await apiService.checkHealth();
      const endTime = performance.now();
      
      results.push({
        name: 'Health Endpoint',
        status: 'success',
        latency: Math.round(endTime - startTime),
        data: healthData
      });
    } catch (error) {
      results.push({
        name: 'Health Endpoint',
        status: 'error',
        error: error.message || 'Unknown error'
      });
    }

    // Test dashboard stats endpoint
    try {
      const startTime = performance.now();
      const dashboardData = await apiService.getDashboardStats();
      const endTime = performance.now();
      
      results.push({
        name: 'Dashboard Stats Endpoint',
        status: 'success',
        latency: Math.round(endTime - startTime),
        data: dashboardData
      });
    } catch (error) {
      results.push({
        name: 'Dashboard Stats Endpoint',
        status: 'error',
        error: error.message || 'Unknown error'
      });
    }

    setTestResults(results);
    
    // Determine overall API status
    const hasError = results.some(result => result.status === 'error');
    setApiStatus(hasError ? 'error' : 'success');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      default: return 'warning.main';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircleIcon color="success" />;
      case 'error': return <WarningIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: 800, mx: 'auto' }}>
        <Box display="flex" flexDirection="column" alignItems="center" p={3}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Collecting Debug Information...
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: 800, mx: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Debug Information
        </Typography>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Box>

      <Box mb={3}>
        <Chip 
          icon={getStatusIcon(apiStatus)} 
          label={apiStatus === 'success' ? 'API Connected' : 'API Connection Issues'} 
          color={apiStatus === 'success' ? 'success' : 'error'}
          sx={{ fontWeight: 'bold', mb: 2 }}
        />
        <Typography variant="body2" color="text.secondary">
          This information can help troubleshoot issues with the application, especially on Vercel deployments.
        </Typography>
      </Box>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">API Connection Tests</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {testResults.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText 
                    primary={
                      <Box display="flex" alignItems="center">
                        {getStatusIcon(result.status)}
                        <Typography variant="body1" ml={1} fontWeight="medium">
                          {result.name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      result.status === 'success' 
                        ? `Success (${result.latency}ms)` 
                        : `Error: ${result.error}`
                    }
                  />
                </ListItem>
                {index < testResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">Environment Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {Object.entries(envInfo).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText 
                  primary={key} 
                  secondary={value} 
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">Network Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {Object.entries(networkInfo).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText 
                  primary={key} 
                  secondary={typeof value === 'boolean' ? value.toString() : value} 
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" fontWeight="bold">Route Information</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {Object.entries(routeInfo).map(([key, value]) => (
              <ListItem key={key}>
                <ListItemText 
                  primary={key} 
                  secondary={value} 
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Box display="flex" justifyContent="center" mt={3}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => testApiConnections()} 
          sx={{ mr: 2 }}
        >
          Retest API Connections
        </Button>
        <Button 
          variant="outlined"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>
    </Paper>
  );
};

export default DebugInfo; 