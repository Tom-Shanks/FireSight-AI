import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const apiUrl = process.env.REACT_APP_API_URL || 'API URL not configured';

  useEffect(() => {
    // This is just a placeholder - in a real app, you'd fetch from your API
    setTimeout(() => {
      setApiStatus('API not connected yet. Configure REACT_APP_API_URL in GitHub secrets.');
    }, 2000);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>FireSight AI</h1>
        <h2>Wildfire Prediction and Prevention System</h2>
        <div className="status-container">
          <p>Backend API: {apiStatus}</p>
          <p>API URL: {apiUrl}</p>
        </div>
        <p className="description">
          This system uses machine learning and geospatial data to predict, monitor, 
          and respond to wildfire threats.
        </p>
        <div className="feature-list">
          <h3>Features:</h3>
          <ul>
            <li>Wildfire Risk Prediction</li>
            <li>Fire Spread Simulation</li>
            <li>Damage Assessment</li>
            <li>Emergency Response Integration</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App; 