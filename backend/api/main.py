import os
import json
import logging
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field
import boto3
from boto3.dynamodb.conditions import Key

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Wildfire Prediction System API",
    description="API for wildfire risk prediction, fire spread simulation, and damage assessment",
    version="1.0.0",
)

# Add CORS middleware to allow cross-origin requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get environment variables
STAGE = os.environ.get("STAGE", "dev")
REGION = os.environ.get("REGION", "us-west-2")
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")

# Initialize AWS clients
s3_client = boto3.client("s3", region_name=REGION)

# ------ Model Schemas ------


class GeoPoint(BaseModel):
    """Geographic point with latitude and longitude."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")


class RiskPredictionRequest(BaseModel):
    """Request model for wildfire risk prediction."""
    location: GeoPoint
    radius_km: float = Field(10.0, gt=0, description="Radius in kilometers for the prediction area")
    start_date: str = Field(..., description="Start date for prediction (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date for prediction (YYYY-MM-DD)")


class RiskPredictionResponse(BaseModel):
    """Response model for wildfire risk prediction."""
    location: GeoPoint
    risk_score: float = Field(..., ge=0, le=1, description="Wildfire risk score (0-1)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    factors: Dict[str, float] = Field(
        ..., description="Contributing factors and their weights"
    )
    forecast_dates: List[str] = Field(..., description="Dates for the forecast")
    forecast_values: List[float] = Field(..., description="Risk score for each date")


class FirePoint(BaseModel):
    """Point representing a fire location with intensity."""
    location: GeoPoint
    intensity: float = Field(..., ge=0, description="Fire intensity")
    detection_time: str = Field(..., description="Time of fire detection (ISO format)")


class FireSpreadRequest(BaseModel):
    """Request model for fire spread simulation."""
    ignition_points: List[FirePoint] = Field(..., min_items=1, description="Fire ignition points")
    simulation_hours: int = Field(24, ge=1, le=72, description="Hours to simulate")
    resolution_meters: int = Field(500, ge=100, le=1000, description="Resolution in meters")


class FireSpreadResponse(BaseModel):
    """Response model for fire spread simulation."""
    perimeters: Dict[str, List[List[GeoPoint]]] = Field(
        ..., description="Fire perimeters by timestamp"
    )
    intensity_grid: Dict[str, List[List[float]]] = Field(
        ..., description="Fire intensity grid by timestamp"
    )
    metadata: Dict[str, Any] = Field(..., description="Simulation metadata")


class DamageAssessmentRequest(BaseModel):
    """Request model for damage assessment."""
    fire_area: List[GeoPoint] = Field(..., min_items=3, description="Polygon of fire area")
    pre_fire_date: str = Field(..., description="Date before fire (YYYY-MM-DD)")
    post_fire_date: str = Field(..., description="Date after fire (YYYY-MM-DD)")


class DamageAssessmentResponse(BaseModel):
    """Response model for damage assessment."""
    burned_area_sqkm: float = Field(..., ge=0, description="Burned area in square kilometers")
    vegetation_damage: Dict[str, float] = Field(
        ..., description="Vegetation damage by type"
    )
    infrastructure_impact: Dict[str, int] = Field(
        ..., description="Impact on infrastructure"
    )
    recovery_estimate_months: float = Field(
        ..., ge=0, description="Estimated recovery time in months"
    )
    map_url: str = Field(..., description="URL to damage assessment map")


# ------ API Routes ------


@app.get("/")
async def root():
    """Root endpoint to check if API is running."""
    return {"message": "Wildfire Prediction System API is running", "stage": STAGE}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/predict/risk", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict wildfire risk for a specific location and time period.
    
    This endpoint uses historical weather data, vegetation indices,
    topographical information, and other features to assess wildfire risk.
    """
    logger.info(f"Risk prediction request for {request.location}")
    try:
        # This is a placeholder - in a real implementation, this would call the model function
        # from the Lambda models.risk_prediction module
        
        # Simulated response for demonstration
        response = RiskPredictionResponse(
            location=request.location,
            risk_score=0.75,
            confidence=0.85,
            factors={
                "vegetation_dryness": 0.4,
                "wind_speed": 0.3,
                "temperature": 0.2,
                "topography": 0.1
            },
            forecast_dates=[
                "2023-05-01", "2023-05-02", "2023-05-03", "2023-05-04", "2023-05-05"
            ],
            forecast_values=[0.65, 0.70, 0.75, 0.80, 0.70]
        )
        return response
    except Exception as e:
        logger.error(f"Error in risk prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/simulate/spread", response_model=FireSpreadResponse)
async def simulate_fire_spread(request: FireSpreadRequest):
    """
    Simulate wildfire spread from ignition points over time.
    
    This endpoint uses cellular automata simulation based on Rothermel's
    fire spread equations, accounting for terrain, weather, and fuel conditions.
    """
    logger.info(f"Fire spread simulation request with {len(request.ignition_points)} ignition points")
    try:
        # Placeholder for actual simulation logic
        # In a real implementation, this would call the fire spread model
        
        # Simulated response for demonstration
        perimeters = {
            "2023-05-01T12:00:00": [
                [
                    GeoPoint(latitude=37.7749, longitude=-122.4194),
                    GeoPoint(latitude=37.7750, longitude=-122.4194),
                    GeoPoint(latitude=37.7750, longitude=-122.4195),
                    GeoPoint(latitude=37.7749, longitude=-122.4195),
                    GeoPoint(latitude=37.7749, longitude=-122.4194)
                ]
            ],
            "2023-05-01T18:00:00": [
                [
                    GeoPoint(latitude=37.7749, longitude=-122.4194),
                    GeoPoint(latitude=37.7752, longitude=-122.4194),
                    GeoPoint(latitude=37.7752, longitude=-122.4197),
                    GeoPoint(latitude=37.7749, longitude=-122.4197),
                    GeoPoint(latitude=37.7749, longitude=-122.4194)
                ]
            ]
        }
        
        # Simplified intensity grid for demonstration
        intensity_grid = {
            "2023-05-01T12:00:00": [[0.5, 0.6], [0.7, 0.8]],
            "2023-05-01T18:00:00": [[0.7, 0.8], [0.9, 1.0]]
        }
        
        response = FireSpreadResponse(
            perimeters=perimeters,
            intensity_grid=intensity_grid,
            metadata={
                "model_version": "1.0.0",
                "weather_conditions": {
                    "wind_speed": 10,
                    "wind_direction": 45,
                    "temperature": 30,
                    "humidity": 15
                },
                "terrain_effect": "moderate",
                "simulation_resolution": request.resolution_meters
            }
        )
        return response
    except Exception as e:
        logger.error(f"Error in fire spread simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/assess/damage", response_model=DamageAssessmentResponse)
async def assess_damage(request: DamageAssessmentRequest):
    """
    Assess wildfire damage in an area by comparing pre and post-fire satellite imagery.
    
    This endpoint uses computer vision to detect changes in land cover and infrastructure.
    """
    logger.info(f"Damage assessment request for fire area with {len(request.fire_area)} points")
    try:
        # Placeholder for actual damage assessment logic
        
        # Simulated response for demonstration
        response = DamageAssessmentResponse(
            burned_area_sqkm=25.5,
            vegetation_damage={
                "forest": 15.3,
                "shrubland": 7.2,
                "grassland": 3.0
            },
            infrastructure_impact={
                "buildings": 12,
                "roads_km": 5,
                "power_lines_km": 3
            },
            recovery_estimate_months=36.5,
            map_url=f"https://{S3_BUCKET}.s3.amazonaws.com/damage-assessments/assessment-123456.html"
        )
        return response
    except Exception as e:
        logger.error(f"Error in damage assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Assessment error: {str(e)}")


@app.get("/data/recent-fires")
async def get_recent_fires(
    days: int = Query(7, ge=1, le=30, description="Number of days to look back")
):
    """Get recent fire detections from NASA FIRMS data."""
    try:
        # Placeholder implementation
        # In a real world scenario, this would query the database
        
        recent_fires = [
            {
                "id": "FIRMS_123456",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "detection_time": "2023-05-01T12:00:00Z",
                "confidence": "high",
                "frp": 25.5  # Fire Radiative Power
            },
            {
                "id": "FIRMS_123457",
                "latitude": 34.0522,
                "longitude": -118.2437,
                "detection_time": "2023-05-02T14:30:00Z",
                "confidence": "nominal",
                "frp": 15.2
            }
        ]
        
        return {"fires": recent_fires, "count": len(recent_fires), "days": days}
    except Exception as e:
        logger.error(f"Error fetching recent fires: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data retrieval error: {str(e)}")


@app.get("/data/high-risk-areas")
async def get_high_risk_areas(
    threshold: float = Query(0.7, ge=0, le=1, description="Risk score threshold")
):
    """Get areas with high wildfire risk scores."""
    try:
        # Placeholder implementation
        high_risk_areas = [
            {
                "id": "RISK_001",
                "name": "Northern California Forest",
                "center": {"latitude": 40.7128, "longitude": -122.4194},
                "risk_score": 0.85,
                "factors": {
                    "drought_index": 0.9,
                    "vegetation_dryness": 0.8,
                    "historical_fires": 0.7
                }
            },
            {
                "id": "RISK_002",
                "name": "Southern Arizona Desert",
                "center": {"latitude": 33.4484, "longitude": -112.0740},
                "risk_score": 0.75,
                "factors": {
                    "drought_index": 0.9,
                    "vegetation_dryness": 0.6,
                    "historical_fires": 0.8
                }
            }
        ]
        
        # Filter by threshold
        filtered_areas = [area for area in high_risk_areas if area["risk_score"] >= threshold]
        
        return {
            "areas": filtered_areas,
            "count": len(filtered_areas),
            "threshold": threshold
        }
    except Exception as e:
        logger.error(f"Error fetching high risk areas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Data retrieval error: {str(e)}")


# Create Lambda handler
handler = Mangum(app) 