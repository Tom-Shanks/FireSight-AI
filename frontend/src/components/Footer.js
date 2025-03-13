import React from 'react';
import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              FireSight AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Advanced wildfire prediction and prevention system using machine learning and geospatial data.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Link href="https://github.com" color="inherit" target="_blank" rel="noopener">
                <GitHubIcon />
              </Link>
              <Link href="https://linkedin.com" color="inherit" target="_blank" rel="noopener">
                <LinkedInIcon />
              </Link>
              <Link href="https://twitter.com" color="inherit" target="_blank" rel="noopener">
                <TwitterIcon />
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Resources
            </Typography>
            <Link href="/dashboard" color="inherit" display="block" sx={{ mb: 1 }}>
              Dashboard
            </Link>
            <Link href="/about" color="inherit" display="block" sx={{ mb: 1 }}>
              About
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Documentation
            </Link>
            <Link href="#" color="inherit" display="block">
              API Reference
            </Link>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Have questions or feedback? We'd love to hear from you.
            </Typography>
            <Link href="mailto:info@firesight-ai.example.com" color="inherit">
              info@firesight-ai.example.com
            </Link>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} FireSight AI. All rights reserved.
          </Typography>
          <Box>
            <Link href="#" color="inherit" sx={{ ml: 2 }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" sx={{ ml: 2 }}>
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 