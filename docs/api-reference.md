# FireSight AI API Reference

This document provides detailed information about the FireSight AI REST API endpoints.

*Last updated: March 2025*

## Base URL

```
https://api.firesight-ai.com/v2
```

For local development:

```
http://localhost:3001/api/v2
```

## Authentication

Most API endpoints require authentication. Include an Authorization header with a valid JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

To obtain a token, use the authentication endpoints described below.

## Response Format

All responses are returned in JSON format. Successful responses have the following structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses have the following structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## API Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "firstName": "John",
  "lastName": "Doe"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "JWT_TOKEN"
  }
}
```

#### Login

```
POST /auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "token": "JWT_TOKEN"
  }
}
```

### Risk Assessment

#### Get risk assessment for a location

```
GET /risk/assessment
```

Query parameters:

- `latitude` (required): Latitude of the location
- `longitude` (required): Longitude of the location
- `radius` (optional): Radius in kilometers (default: 1)
- `timeframe` (optional): Prediction timeframe in days (default: 7)

Response:

```json
{
  "success": true,
  "data": {
    "riskScore": 75,
    "riskLevel": "high",
    "factors": [
      {
        "factor": "dryness",
        "value": 85,
        "contribution": 0.4
      },
      {
        "factor": "temperature",
        "value": 95,
        "contribution": 0.3
      },
      {
        "factor": "windSpeed",
        "value": 15,
        "contribution": 0.2
      },
      {
        "factor": "vegetation",
        "value": 60,
        "contribution": 0.1
      }
    ],
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "timestamp": "2023-08-01T12:00:00Z"
  }
}
```

#### Get historical risk data

```
GET /risk/history
```

Query parameters:

- `latitude` (required): Latitude of the location
- `longitude` (required): Longitude of the location
- `startDate` (required): Start date in ISO format
- `endDate` (required): End date in ISO format

Response:

```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "riskData": [
      {
        "date": "2023-07-01T00:00:00Z",
        "riskScore": 65,
        "riskLevel": "medium"
      },
      {
        "date": "2023-07-02T00:00:00Z",
        "riskScore": 70,
        "riskLevel": "high"
      }
      // ... additional days
    ]
  }
}
```

### Fire Simulation

#### Run fire spread simulation

```
POST /simulation/fire-spread
```

Request body:

```json
{
  "ignitionPoint": {
    "latitude": 34.0522,
    "longitude": -118.2437
  },
  "windSpeed": 15,
  "windDirection": 270,
  "duration": 24,
  "timeStep": 1
}
```

Response:

```json
{
  "success": true,
  "data": {
    "simulationId": "sim-123",
    "ignitionPoint": {
      "latitude": 34.0522,
      "longitude": -118.2437
    },
    "status": "completed",
    "results": {
      "affectedArea": 250,
      "spreadDirections": [
        {
          "direction": "NE",
          "distanceKm": 3.2,
          "timeHours": 8
        },
        {
          "direction": "E",
          "distanceKm": 4.5,
          "timeHours": 12
        }
        // ... other directions
      ],
      "spreadMap": "https://storage.firesight-ai.com/simulations/sim-123/map.png"
    }
  }
}
```

### Damage Assessment

#### Get damage assessment for a fire event

```
GET /assessment/damage
```

Query parameters:

- `fireEventId` (required): ID of the fire event
- `includeDetails` (optional): Boolean to include detailed breakdown (default: false)

Response:

```json
{
  "success": true,
  "data": {
    "fireEventId": "fire-123",
    "affectedArea": 1250,
    "affectedPopulation": 3500,
    "infrastructureDamage": {
      "residential": {
        "buildings": 45,
        "estimatedValue": 12500000
      },
      "commercial": {
        "buildings": 5,
        "estimatedValue": 3500000
      },
      "utilities": {
        "powerLines": 8,
        "waterSystems": 2,
        "estimatedValue": 1800000
      }
    },
    "environmentalImpact": {
      "forestArea": 850,
      "protectedSpecies": 3,
      "waterBodies": 2
    },
    "estimatedRecoveryTime": {
      "months": 18,
      "confidence": 0.75
    }
  }
}
```

### User Settings

#### Get user profile

```
GET /user/profile
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "preferences": {
      "notifications": {
        "email": true,
        "push": false
      },
      "defaultLocation": {
        "latitude": 34.0522,
        "longitude": -118.2437
      }
    }
  }
}
```

#### Update user profile

```
PUT /user/profile
```

Request body:

```json
{
  "firstName": "Updated Name",
  "preferences": {
    "notifications": {
      "email": false,
      "push": true
    }
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "firstName": "Updated Name",
    "lastName": "Doe",
    "preferences": {
      "notifications": {
        "email": false,
        "push": true
      },
      "defaultLocation": {
        "latitude": 34.0522,
        "longitude": -118.2437
      }
    }
  }
}
```

## Rate Limiting

The API enforces rate limiting to ensure fair usage. Limits are as follows:

- Authentication endpoints: 10 requests per minute
- General endpoints: 60 requests per minute
- Heavy computation endpoints (simulations): 10 requests per hour

When a rate limit is exceeded, the API returns a 429 Too Many Requests status code.

## Webhooks

FireSight AI supports webhooks for real-time notifications. Configure webhook endpoints in your user settings to receive notifications about:

- New risk assessments
- Risk level changes
- Simulation completions
- System alerts

## API Versioning

The API uses URL versioning (e.g., `/v2/` in the base URL). We maintain two active API versions:

- **v2**: Current stable version (released January 2025)
- **v1**: Legacy version (deprecated, scheduled for end-of-life December 2025)

When breaking changes are introduced, a new version will be released and the old version will be supported for at least 6 months.

## API Change Log

### v2.0.0 (January 2025)
- Added advanced risk prediction algorithms
- Improved authentication with multi-factor options
- Enhanced performance for large-scale simulations
- New endpoints for evacuation planning

### v1.5.0 (June 2024)
- Added data export capabilities
- Expanded historical data access
- Performance improvements

### v1.0.0 (March 2023)
- Initial release

## Support

For API support, please contact api-support@firesight-ai.com or visit our developer forum at https://developers.firesight-ai.com. 