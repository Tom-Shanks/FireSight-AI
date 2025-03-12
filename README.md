# Wildfire Risk Prediction & Response System

A comprehensive AI-driven wildfire prediction and response system that leverages existing public data sources, machine learning models, and emergency response integration - all using free-tier services and open-source tools.

## Project Overview

This system includes three core components:
1. **Predictive Wildfire Risk Assessment** - Uses historical data, weather conditions, and terrain information to predict wildfire risk
2. **Live Fire Detection & Spread Forecasting** - Monitors active fires and predicts their spread pattern
3. **Post-Fire Damage & Recovery Automation** - Assesses damage and helps plan recovery efforts

## Architecture

The system uses a serverless architecture with these components:
- Data Integration Pipeline (AWS Lambda)
- Machine Learning Models (XGBoost, Cellular Automata, Computer Vision)
- FastAPI Backend (AWS Lambda)
- React Frontend Dashboard (GitHub Pages)
- PostgreSQL/PostGIS Database (Supabase free tier)

## Zero-Cost Deployment

This project is designed to run entirely on free-tier services:
- **Compute**: AWS Lambda Free Tier, Google Cloud Functions
- **Database**: PostgreSQL with PostGIS on Supabase, MongoDB Atlas
- **Storage**: AWS S3 Free Tier, GitHub LFS
- **CI/CD**: GitHub Actions
- **Monitoring**: Grafana Cloud, UptimeRobot

## Getting Started

### Prerequisites
- AWS Account (Free Tier)
- GitHub Account
- Supabase Account (Free Tier)
- Python 3.8+
- Node.js 14+

### Setup Instructions

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/wildfire-prediction-system.git
   cd wildfire-prediction-system
   ```

2. **Set up the Python environment**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure AWS credentials**
   ```
   aws configure
   ```

4. **Deploy the serverless backend**
   ```
   cd backend
   serverless deploy
   ```

5. **Deploy the frontend**
   ```
   cd frontend
   npm install
   npm run deploy
   ```

6. **Set up the database**
   Follow the instructions in `docs/database_setup.md`

## Project Structure

```
wildfire-prediction-system/
├── backend/                 # Serverless backend
│   ├── api/                 # FastAPI application
│   ├── data_pipeline/       # Data integration functions
│   ├── models/              # ML models implementation
│   └── serverless.yml       # Serverless framework config
├── frontend/                # React frontend application
├── models/                  # ML model training code
│   ├── risk_prediction/     # Risk prediction model
│   ├── fire_spread/         # Fire spread simulation
│   └── damage_assessment/   # Damage assessment model
├── data/                    # Sample data and preprocessing
├── docs/                    # Documentation
└── tests/                   # Test suite
```

## Documentation

Detailed documentation is available in the `docs/` directory:
- [System Architecture](docs/architecture.md)
- [Data Pipeline](docs/data_pipeline.md)
- [Machine Learning Models](docs/ml_models.md)
- [API Documentation](docs/api.md)
- [Frontend Dashboard](docs/frontend.md)
- [Deployment Guide](docs/deployment.md)

## Scientific References

This project implements methodologies from these scientific papers:
1. Finney, M. A. (1998). "FARSITE: Fire Area Simulator—Model Development and Evaluation."
2. Rothermel, R. C. (1972). "A Mathematical Model for Predicting Fire Spread in Wildland Fuels."
3. Khabarov, N., et al. (2016). "Forest Fires and Adaptation Options in Europe."
4. Yu, Z., et al. (2020). "Mapping Wildfire Risk in the United States: A Machine Learning Approach."
5. Tymstra, C., et al. (2010). "Development and Structure of Prometheus."
6. Collins, K. M., et al. (2018). "Spatial Patterns of Wildfire Risk in Australia."
7. Tedim, F., et al. (2020). "Extreme Wildfire Events and Disasters."
8. Van Wagner, C. E. (1977). "Conditions for the Start and Spread of Crown Fire."

## License

This project is licensed under the MIT License - see the LICENSE file for details. 