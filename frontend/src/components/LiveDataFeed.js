import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  Button,
  Badge
} from '@mui/material';
import {
  LocalFireDepartment,
  Warning,
  CloudQueue,
  Air,
  ThermostatAuto,
  Refresh,
  NotificationsActive,
  LocationOn,
  Timeline
} from '@mui/icons-material';

const LiveDataFeed = () => {
  const [fireAlerts, setFireAlerts] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Generate realistic fire alerts for Colorado
  const generateFireAlerts = () => {
    const alerts = [
      {
        id: 1,
        type: 'active_fire',
        severity: 'high',
        location: 'Cameron Peak, Larimer County',
        coordinates: [40.5594, -105.6081],
        time: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        details: 'Active fire detected via MODIS satellite. 15 acre estimated size.',
        confidence: 89
      },
      {
        id: 2,
        type: 'smoke_detection',
        severity: 'medium',
        location: 'Pine Valley, Jefferson County',
        coordinates: [39.5501, -105.2211],
        time: new Date(Date.now() - 32 * 60000), // 32 minutes ago
        details: 'Smoke plume detected. Possible new ignition.',
        confidence: 72
      },
      {
        id: 3,
        type: 'high_risk',
        severity: 'warning',
        location: 'Boulder Canyon',
        coordinates: [40.0150, -105.2705],
        time: new Date(Date.now() - 45 * 60000), // 45 minutes ago
        details: 'Red flag warning issued. Wind gusts up to 45 mph expected.',
        confidence: 95
      },
      {
        id: 4,
        type: 'contained',
        severity: 'low',
        location: 'Table Mesa, Boulder',
        coordinates: [39.9836, -105.2659],
        time: new Date(Date.now() - 2 * 3600000), // 2 hours ago
        details: 'Small grass fire contained. 0.5 acres burned.',
        confidence: 100
      }
    ];
    
    return alerts;
  };

  // Generate weather data
  const generateWeatherData = () => {
    return {
      temperature: 78,
      humidity: 15,
      windSpeed: 22,
      windDirection: 'SW',
      fireWeatherIndex: 'HIGH',
      lastUpdate: new Date()
    };
  };

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setFireAlerts(generateFireAlerts());
        setWeatherData(generateWeatherData());
        setLastRefresh(new Date());
        setIsLoading(false);
      }, 1000);
    };

    fetchData();

    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'warning': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'active_fire': return <LocalFireDepartment />;
      case 'smoke_detection': return <CloudQueue />;
      case 'high_risk': return <Warning />;
      case 'contained': return <ThermostatAuto />;
      default: return <Warning />;
    }
  };

  const formatTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - date) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={fireAlerts.filter(a => a.severity === 'high').length} color="error">
              <NotificationsActive color="primary" />
            </Badge>
            <Typography variant="h6">
              Colorado Fire Activity Feed
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => setAutoRefresh(!autoRefresh)}
              color={autoRefresh ? 'primary' : 'default'}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
        {isLoading && <LinearProgress sx={{ mt: 1 }} />}
      </Paper>

      {/* Weather Conditions */}
      {weatherData && (
        <Alert 
          severity={weatherData.fireWeatherIndex === 'HIGH' ? 'warning' : 'info'}
          sx={{ mb: 2 }}
          icon={<Air />}
        >
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              <strong>Current Conditions:</strong>
            </Typography>
            <Chip size="small" label={`${weatherData.temperature}°F`} />
            <Chip size="small" label={`${weatherData.humidity}% humidity`} />
            <Chip size="small" label={`Wind: ${weatherData.windSpeed} mph ${weatherData.windDirection}`} />
            <Chip 
              size="small" 
              label={`Fire Risk: ${weatherData.fireWeatherIndex}`}
              color={weatherData.fireWeatherIndex === 'HIGH' ? 'error' : 'warning'}
            />
          </Box>
        </Alert>
      )}

      {/* Fire Alerts List */}
      <Paper sx={{ flex: 1, overflow: 'auto' }}>
        <List>
          {fireAlerts.map((alert, index) => (
            <React.Fragment key={alert.id}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      size="small" 
                      label={`${alert.confidence}% confidence`}
                      color={getSeverityColor(alert.severity)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                      {formatTimeAgo(alert.time)}
                    </Typography>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: getSeverityColor(alert.severity) === 'error' ? 'error.main' : 
                            getSeverityColor(alert.severity) === 'warning' ? 'warning.main' : 
                            getSeverityColor(alert.severity) === 'info' ? 'info.main' : 'success.main'
                  }}>
                    {getAlertIcon(alert.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {alert.location}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          // Open in Google Maps
                          window.open(`https://maps.google.com/?q=${alert.coordinates[0]},${alert.coordinates[1]}`, '_blank');
                        }}
                      >
                        <LocationOn fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {alert.details}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Timeline />}
                        sx={{ mt: 1 }}
                        onClick={() => {
                          const subject = `Fire Alert: ${alert.location}`;
                          const body = `Urgent: ${alert.details}\n\nLocation: ${alert.location}\nCoordinates: ${alert.coordinates.join(', ')}\nTime: ${alert.time.toLocaleString()}\n\nRequest immediate drone survey.`;
                          window.location.href = `mailto:contact@firesight.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        }}
                      >
                        Request Drone Survey
                      </Button>
                    </Box>
                  }
                />
              </ListItem>
              {index < fireAlerts.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
        
        {fireAlerts.length === 0 && !isLoading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No active fire alerts at this time
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Footer Stats */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <Box>
            <Typography variant="h4" color="primary">
              {fireAlerts.filter(a => a.severity === 'high').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active Fires
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="warning.main">
              {fireAlerts.filter(a => a.severity === 'medium').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Smoke Detections
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="success.main">
              247
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Agencies Monitoring
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LiveDataFeed;