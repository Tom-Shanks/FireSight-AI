import React, { useState, useEffect } from 'react';
import { Box, Container, Tab, Tabs, Typography, Paper, Alert, Grid, Card, CardContent } from '@mui/material';
import RiskAssessment from '../components/RiskAssessment';
import FireSpreadSimulation from '../components/FireSpreadSimulation';
import { checkHealthStatus, getRecentFires, getHighRiskAreas } from '../services/api';

// TabPanel component for managing tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [backendStatus, setBackendStatus] = useState(null);
  const [statusChecking, setStatusChecking] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [recentFires, setRecentFires] = useState([]);
  const [highRiskAreas, setHighRiskAreas] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setStatusChecking(true);
        const status = await checkHealthStatus();
        setBackendStatus(status);
        setStatusError(null);
      } catch (error) {
        console.error('Error checking backend health:', error);
        setStatusError(error.message || 'Could not connect to backend');
        setBackendStatus(null);
      } finally {
        setStatusChecking(false);
      }
    };

    checkBackendHealth();
    // Health check polling every 60 seconds
    const intervalId = setInterval(checkBackendHealth, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setDataLoading(true);
        
        // Fetch recent fires and high risk areas in parallel
        const [firesData, riskAreasData] = await Promise.all([
          getRecentFires(),
          getHighRiskAreas()
        ]);
        
        setRecentFires(firesData);
        setHighRiskAreas(riskAreasData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    
    // Only load data if backend is healthy
    if (backendStatus && backendStatus.status === 'healthy') {
      loadDashboardData();
    }
  }, [backendStatus]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Status Banner */}
      {statusChecking ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Checking connection to backend...
        </Alert>
      ) : statusError ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {statusError}
        </Alert>
      ) : backendStatus && backendStatus.status === 'healthy' ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Connected to FireSight-AI Backend - Version {backendStatus.version || 'Unknown'}
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Backend connection issue. Some features may not work properly.
        </Alert>
      )}

      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          FireSight-AI Dashboard
        </Typography>
      </Box>

      {/* Summary Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Recent Fires
              </Typography>
              <Typography variant="h4">
                {dataLoading ? '...' : recentFires.length}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                in the last 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Risk Areas
              </Typography>
              <Typography variant="h4">
                {dataLoading ? '...' : highRiskAreas.length}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                requiring monitoring
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg. Response Time
              </Typography>
              <Typography variant="h4">
                {dataLoading ? '...' : '14.5 min'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                for emergency services
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Prediction Accuracy
              </Typography>
              <Typography variant="h4">
                {dataLoading ? '...' : '92.3%'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                for risk assessment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Risk Assessment" />
          <Tab label="Fire Spread Simulation" />
          <Tab label="Damage Assessment" />
        </Tabs>
        
        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <RiskAssessment />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <FireSpreadSimulation />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Damage Assessment
          </Typography>
          <Alert severity="info">
            Damage assessment module is coming soon. This feature will allow you to assess post-fire damage and monitor recovery progress using satellite imagery.
          </Alert>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Dashboard; 