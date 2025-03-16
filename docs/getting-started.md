# Getting Started with FireSight AI

This guide will help you set up the FireSight AI project on your local machine for development and testing purposes. Last updated: March 2025.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18+)
- npm or yarn or pnpm
- Python 3.11+
- Git
- AWS CLI v2 (for deployment)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/firesight-ai.git
cd firesight-ai
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file with required environment variables
cp .env.example .env
# Edit the .env file with your configuration

# Start the backend server
npm run dev
```

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Create a .env file with required environment variables
cp .env.example .env
# Edit the .env file with your configuration

# Start the frontend development server
npm start
```

The frontend will be available at http://localhost:3000.

### 4. Data Pipeline Setup

```bash
# Install required Python packages
pip install -r requirements.txt

# Run the data pipeline
python data_pipeline/main.py
```

## Project Structure

```
├── .github/workflows    # CI/CD pipeline configurations
├── backend/             # Express.js API server
├── frontend/            # React-based dashboard
├── data_pipeline/       # Data processing and ML model training
├── infrastructure/      # AWS infrastructure as code
└── docs/                # Documentation
```

## Development Workflow

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Run tests to ensure everything works correctly
4. Submit a pull request
5. Wait for review and approval

## Testing

### Backend Tests

```bash
cd backend
npm run test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## Troubleshooting

### Common Issues

#### Backend doesn't connect to the database

- Check your database credentials in the .env file
- Ensure the database server is running
- Verify network connectivity

#### Frontend API calls fail

- Ensure the backend server is running
- Check that the REACT_APP_API_URL is correctly set in the frontend .env file
- Check browser console for CORS errors

## Next Steps

- See the [Architecture documentation](architecture.md) for an overview of the system
- See the [API Reference](api-reference.md) for details on available endpoints
- Review the [Contributing Guide](../CONTRIBUTING.md) if you want to contribute

For more detailed information about the project, refer to the [main README](../README.md) and other documentation in this directory. 