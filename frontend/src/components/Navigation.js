import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Divider,
  useMediaQuery,
  useTheme,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  LocalFireDepartment as FireIcon
} from '@mui/icons-material';

const Navigation = ({ onNavigate, currentPage }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'map', label: 'Risk Map', icon: <MapIcon /> },
    { id: 'prediction', label: 'Risk Prediction', icon: <AssessmentIcon /> },
    { id: 'alerts', label: 'Alerts', icon: <NotificationsIcon /> },
    { id: 'about', label: 'About', icon: <InfoIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> }
  ];
  
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const handleNavigation = (pageId) => {
    onNavigate(pageId);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <FireIcon sx={{ color: 'error.main', mr: 1, fontSize: 30 }} />
        <Typography variant="h6" component="div">
          FireSight AI
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.id} 
            onClick={() => handleNavigation(item.id)}
            selected={currentPage === item.id}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: currentPage === item.id ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{
                fontWeight: currentPage === item.id ? 'bold' : 'normal',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {isMobile ? (
              <>
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleDrawer(true)}
                  sx={{ mr: 2 }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                  <FireIcon sx={{ mr: 1 }} />
                  FireSight AI
                </Typography>
              </>
            ) : (
              <>
                <FireIcon sx={{ mr: 1 }} />
                <Typography variant="h6" component="div" sx={{ mr: 4 }}>
                  FireSight AI
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex' }}>
                  {menuItems.slice(0, 4).map((item) => (
                    <Button 
                      key={item.id}
                      color="inherit"
                      onClick={() => handleNavigation(item.id)}
                      sx={{ 
                        mx: 1,
                        fontWeight: currentPage === item.id ? 'bold' : 'normal',
                        borderBottom: currentPage === item.id ? '2px solid white' : 'none',
                        borderRadius: 0,
                        paddingBottom: '4px'
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Box>
                <Box>
                  {menuItems.slice(4).map((item) => (
                    <IconButton 
                      key={item.id} 
                      color="inherit"
                      onClick={() => handleNavigation(item.id)}
                      sx={{ 
                        ml: 1,
                        backgroundColor: currentPage === item.id ? 'rgba(255, 255, 255, 0.2)' : 'transparent'
                      }}
                    >
                      {item.icon}
                    </IconButton>
                  ))}
                </Box>
              </>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Navigation; 