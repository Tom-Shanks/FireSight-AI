# FireSight AI - Frontend

This is the frontend application for the FireSight AI wildfire prediction and prevention system. It provides an interactive dashboard for visualizing wildfire risk assessments, simulating fire spread, and analyzing damage assessments.

## Features

- **Interactive Dashboard**: Comprehensive view of wildfire data and predictions
- **Risk Assessment**: Predict wildfire risk for specific locations based on environmental factors
- **Fire Spread Simulation**: Simulate how fires might spread based on various conditions
- **Damage Assessment**: Analyze the impact of wildfires on affected areas
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- React.js
- Material UI
- Leaflet (for interactive maps)
- Chart.js (for data visualization)
- Axios (for API communication)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/firesight-ai.git
   cd firesight-ai/frontend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the frontend directory with the following content:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

4. Start the development server
   ```
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── public/                # Static files
├── src/                   # Source code
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable components
│   │   ├── Map.js         # Interactive map component
│   │   ├── RiskAssessment.js # Risk assessment interface
│   │   └── ...
│   ├── pages/             # Page components
│   │   └── Dashboard.js   # Main dashboard page
│   ├── services/          # API services
│   │   └── api.js         # API communication
│   ├── utils/             # Utility functions
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Deployment

The frontend is automatically deployed using GitHub Actions when changes are pushed to the main branch. The deployment workflow is defined in `.github/workflows/deploy.yml`.

## Backend Integration

This frontend application communicates with the FireSight AI backend API. Make sure the backend is running and accessible at the URL specified in your `.env` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [OpenStreetMap](https://www.openstreetmap.org/) for map data
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) for fire data inspiration
- [Material UI](https://mui.com/) for UI components 