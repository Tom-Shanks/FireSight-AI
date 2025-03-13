"""
Module for fetching and processing NOAA weather data.
"""

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

import boto3
import pandas as pd
import numpy as np

from .utils import setup_logging, upload_to_s3, get_date_range, format_date

# Configure logging
logger = setup_logging("noaa-weather")

# Constants
NOAA_API_BASE_URL = "https://api.weather.gov"
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
WEATHER_DATA_PREFIX = "weather/noaa"

def handler(event, context):
    """
    Lambda handler for fetching NOAA weather data.
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Dict containing the result of the operation
    """
    logger.info("Starting NOAA weather data fetch")
    
    try:
        # Get date range (default: last 7 days)
        days_back = event.get("days_back", 7)
        start_date, end_date = get_date_range(days_back)
        
        # Get regions to fetch (default: Western US states)
        regions = event.get("regions", [
            {"state": "CA", "name": "California"},
            {"state": "OR", "name": "Oregon"},
            {"state": "WA", "name": "Washington"},
            {"state": "ID", "name": "Idaho"},
            {"state": "NV", "name": "Nevada"},
            {"state": "AZ", "name": "Arizona"},
            {"state": "UT", "name": "Utah"},
            {"state": "CO", "name": "Colorado"},
            {"state": "NM", "name": "New Mexico"},
            {"state": "MT", "name": "Montana"},
            {"state": "WY", "name": "Wyoming"}
        ])
        
        # Fetch weather data for each region
        results = []
        for region in regions:
            logger.info(f"Fetching weather data for {region['name']}")
            
            # In a real implementation, we would use the NOAA API to fetch data
            # For this example, we'll generate synthetic data
            weather_data = generate_synthetic_weather_data(
                region["state"], 
                start_date, 
                end_date
            )
            
            # Upload to S3
            s3_key = f"{WEATHER_DATA_PREFIX}/{region['state']}/{format_date(start_date)}_to_{format_date(end_date)}.json"
            upload_success = upload_to_s3(weather_data, S3_BUCKET, s3_key)
            
            results.append({
                "region": region["name"],
                "state": region["state"],
                "start_date": format_date(start_date),
                "end_date": format_date(end_date),
                "data_points": len(weather_data),
                "upload_success": upload_success,
                "s3_location": f"s3://{S3_BUCKET}/{s3_key}" if upload_success else None
            })
        
        logger.info(f"Completed NOAA weather data fetch for {len(regions)} regions")
        return {
            "statusCode": 200,
            "body": {
                "message": "Weather data fetch completed successfully",
                "results": results
            }
        }
    
    except Exception as e:
        logger.error(f"Error fetching NOAA weather data: {str(e)}")
        return {
            "statusCode": 500,
            "body": {
                "message": f"Error fetching weather data: {str(e)}"
            }
        }

def generate_synthetic_weather_data(state_code: str, start_date: datetime, end_date: datetime) -> List[Dict]:
    """
    Generate synthetic weather data for testing.
    
    Args:
        state_code: Two-letter state code
        start_date: Start date
        end_date: End date
        
    Returns:
        List of weather data points
    """
    # Generate a date range
    date_range = []
    current_date = start_date
    while current_date <= end_date:
        date_range.append(current_date)
        current_date += timedelta(days=1)
    
    # Base temperature and precipitation by state (rough approximations)
    state_base_temps = {
        "CA": 70, "OR": 60, "WA": 55, "ID": 55, "NV": 75,
        "AZ": 85, "UT": 65, "CO": 60, "NM": 75, "MT": 50, "WY": 55
    }
    
    # Generate data
    weather_data = []
    for date in date_range:
        # Generate multiple readings per day
        for hour in [0, 6, 12, 18]:
            # Base values with some randomness
            base_temp = state_base_temps.get(state_code, 65)
            temp_f = base_temp + np.random.normal(0, 5)  # Add some noise
            
            # Seasonal adjustment (simplified)
            month = date.month
            if month in [12, 1, 2]:  # Winter
                temp_f -= 20
            elif month in [3, 4, 5]:  # Spring
                temp_f -= 5
            elif month in [9, 10, 11]:  # Fall
                temp_f -= 10
            
            # Daily variation
            if hour == 0 or hour == 6:  # Early morning
                temp_f -= 10
            elif hour == 12:  # Noon
                temp_f += 5
            
            # Precipitation (simplified)
            precip_prob = 0.2  # 20% chance of precipitation
            precip_inches = 0
            if np.random.random() < precip_prob:
                precip_inches = np.random.exponential(0.5)  # Exponential distribution
            
            # Wind
            wind_speed = np.random.gamma(2, 5)  # Gamma distribution
            wind_direction = np.random.randint(0, 360)  # Random direction
            
            # Humidity
            humidity = np.random.normal(50, 15)
            humidity = max(0, min(100, humidity))  # Clamp to 0-100
            
            # Create data point
            timestamp = datetime(date.year, date.month, date.day, hour, 0, 0)
            weather_data.append({
                "timestamp": timestamp.isoformat(),
                "state": state_code,
                "temperature_f": round(temp_f, 1),
                "precipitation_inches": round(precip_inches, 2),
                "wind_speed_mph": round(wind_speed, 1),
                "wind_direction_degrees": int(wind_direction),
                "relative_humidity_percent": int(humidity),
                "conditions": get_weather_condition(temp_f, precip_inches, wind_speed)
            })
    
    return weather_data

def get_weather_condition(temp_f: float, precip_inches: float, wind_speed: float) -> str:
    """
    Determine weather condition based on temperature, precipitation, and wind.
    
    Args:
        temp_f: Temperature in Fahrenheit
        precip_inches: Precipitation in inches
        wind_speed: Wind speed in mph
        
    Returns:
        Weather condition string
    """
    if precip_inches > 0.5:
        return "Heavy Rain"
    elif precip_inches > 0.1:
        return "Light Rain"
    elif precip_inches > 0:
        return "Drizzle"
    elif wind_speed > 15:
        if temp_f > 85:
            return "Hot and Windy"
        else:
            return "Windy"
    elif temp_f > 85:
        return "Hot"
    elif temp_f < 32:
        return "Freezing"
    elif temp_f < 50:
        return "Cold"
    else:
        return "Clear" 