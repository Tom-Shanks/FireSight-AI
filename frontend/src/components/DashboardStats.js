import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  LocalFireDepartment as FireIcon,
  Warning as WarningIcon,
  Terrain as TerrainIcon,
  WaterDrop as WaterIcon
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import apiService from '../services/api';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DashboardStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeFires: 0,
    highRiskAreas: 0,
    averageRiskScore: 0,
    recentRainfall: 0,
    riskByRegion: [],
    firesByType: [],
    monthlyPredictions: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the API service to get dashboard stats
        console.log('Fetching dashboard stats...');
        const data = await apiService.getDashboardStats();
        console.log('Dashboard stats:', data);
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Prepare chart data
  const pieChartData = {
    labels: stats.firesByType.map(item => item.type),
    datasets: [
      {
        data: stats.firesByType.map(item => item.count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const barChartData = {
    labels: stats.riskByRegion.map(item => item.region),
    datasets: [
      {
        label: 'Risk Score',
        data: stats.riskByRegion.map(item => item.riskScore),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthlyChartData = {
    labels: stats.monthlyPredictions.map(item => item.month),
    datasets: [
      {
        label: 'Predicted Fires',
        data: stats.monthlyPredictions.map(item => item.predictedFires),
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Risk by Region',
      },
    },
  };

  const monthlyOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Fire Predictions',
      },
    },
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>FireSight AI Dashboard</Typography>
      
      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <FireIcon sx={{ fontSize: 40, color: 'error.main', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Active Fires</Typography>
              <Typography variant="h4">{stats.activeFires}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <WarningIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">High Risk Areas</Typography>
              <Typography variant="h4">{stats.highRiskAreas}</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <TerrainIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Average Risk Score</Typography>
              <Typography variant="h4">{stats.averageRiskScore}/100</Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', alignItems: 'center', height: '100%' }}>
            <WaterIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Recent Rainfall</Typography>
              <Typography variant="h4">{stats.recentRainfall} in</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Fires by Type</Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <Pie data={pieChartData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Risk by Region</Typography>
              <Box sx={{ height: 250 }}>
                <Bar options={barOptions} data={barChartData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Monthly Fire Predictions</Typography>
              <Box sx={{ height: 300 }}>
                <Bar options={monthlyOptions} data={monthlyChartData} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardStats; 