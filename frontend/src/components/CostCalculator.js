import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Slider,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  AttachMoney,
  TrendingDown,
  AccessTime,
  CheckCircle,
  Flight,
  LocalFireDepartment,
  Email
} from '@mui/icons-material';

const CostCalculator = () => {
  const [surveyArea, setSurveyArea] = useState(100); // square miles
  const [surveyFrequency, setSurveyFrequency] = useState(4); // times per month
  const [fireRiskLevel, setFireRiskLevel] = useState(3); // 1-5 scale
  
  // Cost calculations
  const [helicopterCost, setHelicopterCost] = useState(0);
  const [droneCost, setDroneCost] = useState(0);
  const [monthlySavings, setMonthlySavings] = useState(0);
  const [annualSavings, setAnnualSavings] = useState(0);
  const [paybackPeriod, setPaybackPeriod] = useState(0);

  // Colorado-specific costs
  const HELICOPTER_HOURLY_RATE = 1200; // $/hour for Bell 206 in Colorado
  const DRONE_HOURLY_RATE = 150; // $/hour for Part 107 pilot + equipment
  const HELICOPTER_SPEED = 120; // mph
  const DRONE_SPEED = 40; // mph for commercial drone
  const SETUP_TIME_HELICOPTER = 2; // hours
  const SETUP_TIME_DRONE = 0.5; // hours
  
  useEffect(() => {
    calculateCosts();
  }, [surveyArea, surveyFrequency, fireRiskLevel]);
  
  const calculateCosts = () => {
    // Calculate survey time
    const helicopterSurveyTime = (surveyArea / HELICOPTER_SPEED) + SETUP_TIME_HELICOPTER;
    const droneSurveyTime = (surveyArea / DRONE_SPEED) + SETUP_TIME_DRONE;
    
    // Risk multiplier for high-risk areas
    const riskMultiplier = 1 + (fireRiskLevel - 1) * 0.25;
    
    // Monthly costs
    const monthlyHelicopterCost = helicopterSurveyTime * HELICOPTER_HOURLY_RATE * surveyFrequency * riskMultiplier;
    const monthlyDroneCost = droneSurveyTime * DRONE_HOURLY_RATE * surveyFrequency * riskMultiplier;
    
    setHelicopterCost(monthlyHelicopterCost);
    setDroneCost(monthlyDroneCost);
    setMonthlySavings(monthlyHelicopterCost - monthlyDroneCost);
    setAnnualSavings((monthlyHelicopterCost - monthlyDroneCost) * 12);
    
    // Calculate payback period (assuming $30k initial drone investment)
    const initialInvestment = 30000;
    setPaybackPeriod(initialInvestment / (monthlyHelicopterCost - monthlyDroneCost));
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
        Colorado Wildfire Monitoring Cost Calculator
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        See how much your agency can save with drone-based monitoring
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Input Parameters */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Survey Parameters
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Survey Area: <strong>{surveyArea} square miles</strong>
              </Typography>
              <Slider
                value={surveyArea}
                onChange={(e, newValue) => setSurveyArea(newValue)}
                min={10}
                max={500}
                step={10}
                marks={[
                  { value: 10, label: '10' },
                  { value: 250, label: '250' },
                  { value: 500, label: '500' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Survey Frequency: <strong>{surveyFrequency} times per month</strong>
              </Typography>
              <Slider
                value={surveyFrequency}
                onChange={(e, newValue) => setSurveyFrequency(newValue)}
                min={1}
                max={30}
                marks={[
                  { value: 1, label: 'Weekly' },
                  { value: 4, label: 'Weekly' },
                  { value: 30, label: 'Daily' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography gutterBottom>
                Fire Risk Level: <strong>{fireRiskLevel}/5</strong>
              </Typography>
              <Slider
                value={fireRiskLevel}
                onChange={(e, newValue) => setFireRiskLevel(newValue)}
                min={1}
                max={5}
                marks={[
                  { value: 1, label: 'Low' },
                  { value: 3, label: 'Medium' },
                  { value: 5, label: 'Extreme' }
                ]}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="body2" color="text.secondary">
              Based on Colorado fire season data and FAA Part 107 operational costs
            </Typography>
          </Paper>
        </Grid>
        
        {/* Cost Comparison */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Cost Comparison
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Card sx={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Traditional Helicopter
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {formatCurrency(helicopterCost)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card sx={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '2px solid white' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      Drone Solution
                    </Typography>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {formatCurrency(droneCost)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, p: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                Monthly Savings: {formatCurrency(monthlySavings)}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {Math.round((monthlySavings / helicopterCost) * 100)}% cost reduction
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Annual Projections */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Annual Projections
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <AttachMoney sx={{ fontSize: 48, color: '#4caf50' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                    {formatCurrency(annualSavings)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Annual Savings
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <TrendingDown sx={{ fontSize: 48, color: '#2196f3' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                    {paybackPeriod.toFixed(1)} mo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ROI Period
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <AccessTime sx={{ fontSize: 48, color: '#ff9800' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                    {Math.round((1 - droneCost/helicopterCost) * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Efficiency
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <LocalFireDepartment sx={{ fontSize: 48, color: '#f44336' }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                    24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coverage Available
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Benefits List */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Additional Benefits
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Real-time Data Collection"
                  secondary="Live streaming and instant fire detection"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Weather-Independent Operations"
                  secondary="Fly in conditions unsafe for helicopters"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="AI-Powered Analysis"
                  secondary="Automated fire detection and spread prediction"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText 
                  primary="Colorado Terrain Optimized"
                  secondary="Specialized for mountain and forest monitoring"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* CTA Card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 3, 
            background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
            color: 'white'
          }}>
            <Typography variant="h6" gutterBottom>
              Ready to Save {formatCurrency(annualSavings)}?
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
              Get a custom quote for your Colorado agency's specific needs. 
              Our Part 107 certified pilots are ready to deploy immediately.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Flight />} 
                label="FAA Part 107 Certified" 
                sx={{ background: 'rgba(255,255,255,0.2)' }}
              />
              <Chip 
                icon={<LocalFireDepartment />} 
                label="Wildfire Specialist" 
                sx={{ background: 'rgba(255,255,255,0.2)' }}
              />
            </Box>
            
            <Button 
              variant="contained" 
              size="large"
              startIcon={<Email />}
              sx={{ 
                mt: 3, 
                background: 'white',
                color: '#1976d2',
                '&:hover': {
                  background: 'rgba(255,255,255,0.9)'
                }
              }}
              onClick={() => {
                const subject = `FireSight AI Quote Request - Save ${formatCurrency(annualSavings)}/year`;
                const body = `Hi,\n\nI'm interested in FireSight AI drone monitoring services.\n\nSurvey Area: ${surveyArea} sq miles\nFrequency: ${surveyFrequency} times/month\nProjected Annual Savings: ${formatCurrency(annualSavings)}\n\nPlease provide a detailed quote.\n\nThank you!`;
                window.location.href = `mailto:contact@firesight.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }}
            >
              Get Your Custom Quote
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CostCalculator;