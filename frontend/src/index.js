import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './Router';
import reportWebVitals from './reportWebVitals';

// Add global error handling
if (process.env.NODE_ENV === 'production') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error caught:', { message, source, lineno, colno, error });
    
    // Log to console for Vercel logs
    if (error && error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    // You could send to an error tracking service here
    
    return false; // Let the default error handler run too
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);

// Log some debug info when running in production
if (process.env.NODE_ENV === 'production') {
  console.log('FireSight AI Frontend loaded in production mode');
  console.log(`Build date: ${process.env.REACT_APP_BUILD_DATE || 'unknown'}`);
  console.log(`Host: ${window.location.hostname}`);
}

// Initialize web vitals reporting
reportWebVitals(console.log); 