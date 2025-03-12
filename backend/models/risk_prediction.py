import os
import json
import logging
import time
import pickle
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional

import boto3
import pandas as pd
import numpy as np
import geopandas as gpd
import xgboost as xgb
from sklearn.preprocessing import StandardScaler
import requests
from shapely.geometry import Point, Polygon
import rasterio
from rasterio.features import geometry_mask

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
REGION = os.environ.get("REGION", "us-west-2")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
MODEL_VERSION = "v1.0.0"

# Initialize AWS clients
s3_client = boto3.client("s3", region_name=REGION)

# Model artifact paths in S3
MODEL_S3_KEY = f"models/risk_prediction/xgboost_model_{MODEL_VERSION}.pkl"
SCALER_S3_KEY = f"models/risk_prediction/scaler_{MODEL_VERSION}.pkl"
FEATURE_IMPORTANCE_S3_KEY = f"models/risk_prediction/feature_importance_{MODEL_VERSION}.json"

# Cache for model and scaler to avoid reloading between invocations
MODEL_CACHE = None
SCALER_CACHE = None
FEATURE_IMPORTANCE_CACHE = None


def load_model() -> xgb.Booster:
    """
    Load the XGBoost model from S3 or cache.
    
    Returns:
        XGBoost model
    """
    global MODEL_CACHE
    if MODEL_CACHE is not None:
        return MODEL_CACHE
    
    try:
        logger.info(f"Loading model from S3: {MODEL_S3_KEY}")
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=MODEL_S3_KEY)
        model_bytes = response['Body'].read()
        MODEL_CACHE = pickle.loads(model_bytes)
        return MODEL_CACHE
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        
        # Fallback to a simple model for demonstration purposes only
        # In production, you would want to handle this error differently
        logger.warning("Using fallback model for demonstration")
        params = {
            'objective': 'binary:logistic',
            'max_depth': 3,
            'learning_rate': 0.1,
            'n_estimators': 100
        }
        MODEL_CACHE = xgb.XGBClassifier(**params)
        return MODEL_CACHE


def load_scaler() -> StandardScaler:
    """
    Load the StandardScaler from S3 or cache.
    
    Returns:
        StandardScaler object
    """
    global SCALER_CACHE
    if SCALER_CACHE is not None:
        return SCALER_CACHE
    
    try:
        logger.info(f"Loading scaler from S3: {SCALER_S3_KEY}")
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=SCALER_S3_KEY)
        scaler_bytes = response['Body'].read()
        SCALER_CACHE = pickle.loads(scaler_bytes)
        return SCALER_CACHE
    except Exception as e:
        logger.error(f"Error loading scaler: {str(e)}")
        
        # Fallback to a new scaler
        logger.warning("Using fallback scaler")
        SCALER_CACHE = StandardScaler()
        return SCALER_CACHE


def load_feature_importance() -> Dict[str, float]:
    """
    Load feature importance from S3 or cache.
    
    Returns:
        Dict mapping feature names to importance scores
    """
    global FEATURE_IMPORTANCE_CACHE
    if FEATURE_IMPORTANCE_CACHE is not None:
        return FEATURE_IMPORTANCE_CACHE
    
    try:
        logger.info(f"Loading feature importance from S3: {FEATURE_IMPORTANCE_S3_KEY}")
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=FEATURE_IMPORTANCE_S3_KEY)
        feature_importance_bytes = response['Body'].read()
        FEATURE_IMPORTANCE_CACHE = json.loads(feature_importance_bytes)
        return FEATURE_IMPORTANCE_CACHE
    except Exception as e:
        logger.error(f"Error loading feature importance: {str(e)}")
        
        # Fallback to default feature importance
        logger.warning("Using fallback feature importance")
        FEATURE_IMPORTANCE_CACHE = {
            "ndvi": 0.2,
            "erc": 0.15,
            "vpd": 0.1,
            "pdsi": 0.1,
            "temperature": 0.1,
            "relative_humidity": 0.1,
            "wind_speed": 0.1,
            "precipitation": 0.05,
            "elevation": 0.05,
            "slope": 0.03,
            "aspect": 0.02
        }
        return FEATURE_IMPORTANCE_CACHE


def get_weather_data(lat: float, lon: float, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Get weather data for a location and time period from OpenWeatherMap API.
    
    Args:
        lat: Latitude
        lon: Longitude
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Dict with weather data
    """
    logger.info(f"Fetching weather data for {lat}, {lon} from {start_date} to {end_date}")
    
    # If using the free tier, we can't get historical data
    # We'll use the current weather and forecast instead
    try:
        # Current weather
        if WEATHER_API_KEY:
            current_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            
            current_response = requests.get(current_url, timeout=10)
            current_response.raise_for_status()
            current_data = current_response.json()
            
            forecast_response = requests.get(forecast_url, timeout=10)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            # Extract the needed weather parameters
            weather_data = {
                "current": {
                    "temperature": current_data.get("main", {}).get("temp", 20.0),
                    "relative_humidity": current_data.get("main", {}).get("humidity", 50.0),
                    "wind_speed": current_data.get("wind", {}).get("speed", 5.0),
                    "precipitation": current_data.get("rain", {}).get("1h", 0.0) if "rain" in current_data else 0.0,
                    "pressure": current_data.get("main", {}).get("pressure", 1013.0)
                },
                "forecast": []
            }
            
            # Extract forecast data for the next 5 days (every 3 hours)
            for item in forecast_data.get("list", []):
                forecast_item = {
                    "datetime": item.get("dt_txt", ""),
                    "temperature": item.get("main", {}).get("temp", 20.0),
                    "relative_humidity": item.get("main", {}).get("humidity", 50.0),
                    "wind_speed": item.get("wind", {}).get("speed", 5.0),
                    "precipitation": item.get("rain", {}).get("3h", 0.0) if "rain" in item else 0.0,
                    "pressure": item.get("main", {}).get("pressure", 1013.0)
                }
                weather_data["forecast"].append(forecast_item)
            
            return weather_data
        else:
            # If no API key, generate simulated weather data for demonstration
            logger.warning("No OpenWeatherMap API key provided, using simulated weather data")
            return generate_simulated_weather_data(start_date, end_date)
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        logger.warning("Using simulated weather data due to API error")
        return generate_simulated_weather_data(start_date, end_date)


def generate_simulated_weather_data(start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Generate simulated weather data for demonstration purposes.
    
    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        
    Returns:
        Dict with simulated weather data
    """
    # Parse dates
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    days = (end - start).days + 1
    
    # Current conditions
    current = {
        "temperature": 25.0 + np.random.normal(0, 2),
        "relative_humidity": 40.0 + np.random.normal(0, 5),
        "wind_speed": 4.0 + np.random.normal(0, 1),
        "precipitation": max(0, np.random.normal(0, 0.5)),
        "pressure": 1013.0 + np.random.normal(0, 2)
    }
    
    # Forecast for future days
    forecast = []
    current_date = start
    
    for _ in range(days):
        # Generate 8 entries per day (every 3 hours)
        for hour in [0, 3, 6, 9, 12, 15, 18, 21]:
            # Temperature follows a sinusoidal pattern during the day
            temp_variation = 5 * np.sin(np.pi * hour / 12 - np.pi/2) + np.random.normal(0, 1)
            
            forecast_item = {
                "datetime": (current_date + timedelta(hours=hour)).strftime("%Y-%m-%d %H:%M:%S"),
                "temperature": max(0, 25.0 + temp_variation + np.random.normal(0, 2)),
                "relative_humidity": min(100, max(0, 40.0 - temp_variation + np.random.normal(0, 5))),
                "wind_speed": max(0, 4.0 + np.random.normal(0, 1)),
                "precipitation": max(0, np.random.normal(0, 0.5)),
                "pressure": 1013.0 + np.random.normal(0, 2)
            }
            forecast.append(forecast_item)
        
        current_date += timedelta(days=1)
    
    return {
        "current": current,
        "forecast": forecast
    }


def get_terrain_data(lat: float, lon: float, radius_km: float) -> Dict[str, float]:
    """
    Get terrain data for a location.
    
    Args:
        lat: Latitude
        lon: Longitude
        radius_km: Radius in kilometers
        
    Returns:
        Dict with terrain data
    """
    logger.info(f"Fetching terrain data for {lat}, {lon} with radius {radius_km} km")
    
    # In a real implementation, this would fetch digital elevation model (DEM) data
    # and calculate elevation, slope, and aspect.
    # For the MVP, we'll simulate this data
    
    # Simulated elevation based on latitude (higher elevations in mid-latitudes)
    base_elevation = 500 + 1000 * np.exp(-(lat - 40)**2 / 400)
    elevation = base_elevation + np.random.normal(0, 100)
    
    # Simulated slope and aspect
    slope = np.random.uniform(0, 30)  # degrees
    aspect = np.random.uniform(0, 360)  # degrees
    
    return {
        "elevation": elevation,
        "slope": slope,
        "aspect": aspect
    }


def get_vegetation_indices(lat: float, lon: float, radius_km: float) -> Dict[str, float]:
    """
    Get vegetation indices for a location.
    
    Args:
        lat: Latitude
        lon: Longitude
        radius_km: Radius in kilometers
        
    Returns:
        Dict with vegetation indices
    """
    logger.info(f"Fetching vegetation indices for {lat}, {lon} with radius {radius_km} km")
    
    # In a real implementation, this would fetch satellite imagery and calculate indices
    # For the MVP, we'll simulate this data
    
    # Simulated NDVI (Normalized Difference Vegetation Index)
    # Values range from -1 to 1, with higher values indicating more vegetation
    ndvi = np.random.uniform(0.2, 0.8)
    
    # Simulated ERC (Energy Release Component)
    # Higher values indicate higher wildfire potential
    erc = np.random.uniform(30, 80)
    
    # Simulated VPD (Vapor Pressure Deficit)
    # Higher values indicate drier conditions
    vpd = np.random.uniform(0.5, 3.0)
    
    # Simulated PDSI (Palmer Drought Severity Index)
    # Negative values indicate drought conditions
    pdsi = np.random.uniform(-4, 4)
    
    return {
        "ndvi": ndvi,
        "erc": erc,
        "vpd": vpd,
        "pdsi": pdsi
    }


def prepare_features(
    lat: float, 
    lon: float, 
    radius_km: float,
    weather_data: Dict[str, Any],
    terrain_data: Dict[str, float],
    vegetation_data: Dict[str, float]
) -> pd.DataFrame:
    """
    Prepare features for risk prediction.
    
    Args:
        lat: Latitude
        lon: Longitude
        radius_km: Radius in kilometers
        weather_data: Weather data dict
        terrain_data: Terrain data dict
        vegetation_data: Vegetation data dict
        
    Returns:
        DataFrame with features
    """
    logger.info("Preparing features for risk prediction")
    
    # Get current weather
    current_weather = weather_data["current"]
    
    # Create feature dict
    features = {
        # Location features
        "latitude": lat,
        "longitude": lon,
        
        # Weather features
        "temperature": current_weather["temperature"],
        "relative_humidity": current_weather["relative_humidity"],
        "wind_speed": current_weather["wind_speed"],
        "precipitation": current_weather["precipitation"],
        
        # Terrain features
        "elevation": terrain_data["elevation"],
        "slope": terrain_data["slope"],
        "aspect": terrain_data["aspect"],
        
        # Vegetation features
        "ndvi": vegetation_data["ndvi"],
        "erc": vegetation_data["erc"],
        "vpd": vegetation_data["vpd"],
        "pdsi": vegetation_data["pdsi"]
    }
    
    # Create DataFrame
    df = pd.DataFrame([features])
    
    # Select only features that the model was trained on
    feature_importance = load_feature_importance()
    model_features = list(feature_importance.keys())
    
    # Fill missing features with zeros
    for feature in model_features:
        if feature not in df.columns:
            df[feature] = 0
    
    # Select and order features according to the model
    df = df[model_features]
    
    return df


def predict_risk(features: pd.DataFrame) -> Tuple[float, float, Dict[str, float]]:
    """
    Predict wildfire risk using the XGBoost model.
    
    Args:
        features: DataFrame with features
        
    Returns:
        Tuple of (risk_score, confidence, factors)
    """
    logger.info("Predicting wildfire risk")
    
    try:
        # Load model and scaler
        model = load_model()
        scaler = load_scaler()
        feature_importance = load_feature_importance()
        
        # Scale features
        scaled_features = scaler.transform(features)
        
        # Make prediction
        if hasattr(model, 'predict_proba'):
            # For sklearn XGBClassifier with predict_proba method
            probabilities = model.predict_proba(scaled_features)
            risk_score = float(probabilities[0][1])  # Probability of positive class
        else:
            # For xgboost Booster with predict method
            dmatrix = xgb.DMatrix(scaled_features)
            risk_score = float(model.predict(dmatrix)[0])
        
        # Calculate confidence based on feature distribution
        # This is a simplified approach - in a real system you would use a more sophisticated method
        confidence = 0.85  # Fixed confidence for demo
        
        # Calculate contribution of each factor
        factors = {}
        total_importance = sum(feature_importance.values())
        
        for feature, importance in feature_importance.items():
            if feature in features.columns:
                # Normalize importance to sum to 1
                normalized_importance = importance / total_importance
                
                # Calculate factor contribution (simplified)
                factors[feature] = round(normalized_importance, 3)
        
        return risk_score, confidence, factors
        
    except Exception as e:
        logger.error(f"Error predicting risk: {str(e)}")
        
        # Return fallback values for demonstration
        return 0.5, 0.5, {"error": 1.0}


def generate_forecast(
    lat: float, 
    lon: float, 
    weather_data: Dict[str, Any],
    terrain_data: Dict[str, float],
    vegetation_data: Dict[str, float]
) -> Tuple[List[str], List[float]]:
    """
    Generate risk forecast for future days.
    
    Args:
        lat: Latitude
        lon: Longitude
        weather_data: Weather data dict
        terrain_data: Terrain data dict
        vegetation_data: Vegetation data dict
        
    Returns:
        Tuple of (dates, risk_scores)
    """
    logger.info("Generating risk forecast")
    
    forecast_dates = []
    forecast_values = []
    
    # Get forecast weather data
    forecast = weather_data.get("forecast", [])
    
    # Group forecast by day
    daily_forecast = {}
    for item in forecast:
        date_str = item["datetime"].split(" ")[0]
        if date_str not in daily_forecast:
            daily_forecast[date_str] = []
        daily_forecast[date_str].append(item)
    
    # For each day, make a prediction
    for date_str, items in daily_forecast.items():
        if not items:
            continue
            
        # Average the weather data for the day
        avg_temp = sum(item["temperature"] for item in items) / len(items)
        avg_humidity = sum(item["relative_humidity"] for item in items) / len(items)
        avg_wind = sum(item["wind_speed"] for item in items) / len(items)
        avg_precip = sum(item["precipitation"] for item in items) / len(items)
        
        # Create feature dict for this day
        features = {
            # Location features
            "latitude": lat,
            "longitude": lon,
            
            # Weather features
            "temperature": avg_temp,
            "relative_humidity": avg_humidity,
            "wind_speed": avg_wind,
            "precipitation": avg_precip,
            
            # Terrain features
            "elevation": terrain_data["elevation"],
            "slope": terrain_data["slope"],
            "aspect": terrain_data["aspect"],
            
            # Vegetation features (simplified assumption - vegetation doesn't change day to day)
            "ndvi": vegetation_data["ndvi"],
            "erc": vegetation_data["erc"],
            "vpd": vegetation_data["vpd"],
            "pdsi": vegetation_data["pdsi"]
        }
        
        # Create DataFrame
        df = pd.DataFrame([features])
        
        # Select only features that the model was trained on
        feature_importance = load_feature_importance()
        model_features = list(feature_importance.keys())
        
        # Fill missing features with zeros
        for feature in model_features:
            if feature not in df.columns:
                df[feature] = 0
        
        # Select and order features according to the model
        df = df[model_features]
        
        # Make prediction
        risk_score, _, _ = predict_risk(df)
        
        forecast_dates.append(date_str)
        forecast_values.append(risk_score)
    
    return forecast_dates, forecast_values


def handler(event, context):
    """
    AWS Lambda handler for risk prediction.
    
    Args:
        event: AWS Lambda event
        context: AWS Lambda context
        
    Returns:
        Dict with prediction results
    """
    logger.info("Starting wildfire risk prediction")
    start_time = time.time()
    
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Get location
        location = body.get("location", {})
        lat = float(location.get("latitude", 0))
        lon = float(location.get("longitude", 0))
        
        # Get other parameters
        radius_km = float(body.get("radius_km", 10.0))
        start_date = body.get("start_date", datetime.now().strftime("%Y-%m-%d"))
        end_date = body.get("end_date", (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"))
        
        # Get data
        weather_data = get_weather_data(lat, lon, start_date, end_date)
        terrain_data = get_terrain_data(lat, lon, radius_km)
        vegetation_data = get_vegetation_indices(lat, lon, radius_km)
        
        # Prepare features
        features = prepare_features(lat, lon, radius_km, weather_data, terrain_data, vegetation_data)
        
        # Predict risk
        risk_score, confidence, factors = predict_risk(features)
        
        # Generate forecast
        forecast_dates, forecast_values = generate_forecast(
            lat, lon, weather_data, terrain_data, vegetation_data
        )
        
        # Prepare response
        response = {
            "location": {
                "latitude": lat,
                "longitude": lon
            },
            "risk_score": round(risk_score, 3),
            "confidence": round(confidence, 3),
            "factors": factors,
            "forecast_dates": forecast_dates,
            "forecast_values": [round(v, 3) for v in forecast_values]
        }
        
        processing_time = time.time() - start_time
        logger.info(f"Risk prediction completed in {processing_time:.2f} seconds")
        
        return {
            "statusCode": 200,
            "body": json.dumps(response),
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in risk prediction: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        } 