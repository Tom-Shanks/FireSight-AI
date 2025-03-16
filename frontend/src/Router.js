import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';

/**
 * Main Router Component
 * 
 * This provides proper routing for the application, especially important
 * for Vercel deployments to handle client-side routing correctly.
 */
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main application route */}
        <Route path="/" element={<App />} />
        
        {/* Dashboard routes */}
        <Route path="/dashboard" element={<App defaultPage="dashboard" />} />
        <Route path="/map" element={<App defaultPage="map" />} />
        <Route path="/prediction" element={<App defaultPage="prediction" />} />
        <Route path="/alerts" element={<App defaultPage="alerts" />} />
        <Route path="/settings" element={<App defaultPage="settings" />} />
        
        {/* Debug route explicitly enabled */}
        <Route path="/debug" element={<App showDebug={true} />} />
        
        {/* Fallback route - redirect to root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router; 