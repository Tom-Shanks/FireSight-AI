"""
Module for calculating vegetation indices from satellite imagery.
"""

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

import boto3
import numpy as np
import pandas as pd

from .utils import setup_logging, upload_to_s3, get_date_range, format_date

# Configure logging
logger = setup_logging("vegetation-indices")

# Constants
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
VEGETATION_DATA_PREFIX = "vegetation"

def handler(event, context):
    """
    Lambda handler for calculating vegetation indices.
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Dict containing the result of the operation
    """
    logger.info("Starting vegetation indices calculation")
    
    try:
        # Get date range (default: last 14 days)
        days_back = event.get("days_back", 14)
        start_date, end_date = get_date_range(days_back)
        
        # Get regions to process (default: Western US states)
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
        
        # Calculate vegetation indices for each region
        results = []
        for region in regions:
            logger.info(f"Calculating vegetation indices for {region['name']}")
            
            # In a real implementation, we would download and process satellite imagery
            # For this example, we'll generate synthetic data
            veg_indices = generate_synthetic_vegetation_indices(
                region["state"], 
                start_date, 
                end_date
            )
            
            # Upload to S3
            s3_key = f"{VEGETATION_DATA_PREFIX}/{region['state']}/{format_date(start_date)}_to_{format_date(end_date)}.json"
            upload_success = upload_to_s3(veg_indices, S3_BUCKET, s3_key)
            
            results.append({
                "region": region["name"],
                "state": region["state"],
                "start_date": format_date(start_date),
                "end_date": format_date(end_date),
                "indices_calculated": len(veg_indices["indices"]),
                "upload_success": upload_success,
                "s3_location": f"s3://{S3_BUCKET}/{s3_key}" if upload_success else None
            })
        
        logger.info(f"Completed vegetation indices calculation for {len(regions)} regions")
        return {
            "statusCode": 200,
            "body": {
                "message": "Vegetation indices calculation completed successfully",
                "results": results
            }
        }
    
    except Exception as e:
        logger.error(f"Error calculating vegetation indices: {str(e)}")
        return {
            "statusCode": 500,
            "body": {
                "message": f"Error calculating vegetation indices: {str(e)}"
            }
        }

def generate_synthetic_vegetation_indices(state_code: str, start_date: datetime, end_date: datetime) -> Dict:
    """
    Generate synthetic vegetation indices data for testing.
    
    Args:
        state_code: Two-letter state code
        start_date: Start date
        end_date: End date
        
    Returns:
        Dictionary containing synthetic vegetation indices data
    """
    # Define grid size based on state (simplified)
    grid_sizes = {
        "CA": (100, 100), "OR": (80, 80), "WA": (70, 70),
        "ID": (80, 80), "NV": (90, 90), "AZ": (90, 90),
        "UT": (70, 70), "CO": (80, 80), "NM": (90, 90),
        "MT": (90, 90), "WY": (70, 70)
    }
    
    grid_size = grid_sizes.get(state_code, (50, 50))
    rows, cols = grid_size
    
    # Base vegetation characteristics by state (simplified)
    # Higher values = more vegetation
    veg_characteristics = {
        "CA": 0.6, "OR": 0.7, "WA": 0.8, "ID": 0.6, "NV": 0.3,
        "AZ": 0.4, "UT": 0.5, "CO": 0.6, "NM": 0.4, "MT": 0.6, "WY": 0.5
    }
    
    veg_base = veg_characteristics.get(state_code, 0.5)
    
    # Generate date range
    date_range = []
    current_date = start_date
    while current_date <= end_date:
        date_range.append(current_date)
        current_date += timedelta(days=1)
    
    # Generate indices for each date
    indices = []
    for date in date_range:
        # Seasonal adjustment (simplified)
        month = date.month
        seasonal_factor = 1.0
        if month in [12, 1, 2]:  # Winter
            seasonal_factor = 0.7
        elif month in [3, 4, 5]:  # Spring
            seasonal_factor = 1.1
        elif month in [6, 7, 8]:  # Summer
            seasonal_factor = 1.0
        elif month in [9, 10, 11]:  # Fall
            seasonal_factor = 0.9
        
        # Generate NDVI (Normalized Difference Vegetation Index)
        ndvi_base = veg_base * seasonal_factor
        ndvi = generate_correlated_grid(grid_size, (ndvi_base - 0.2, ndvi_base + 0.2))
        ndvi = np.clip(ndvi, -1.0, 1.0)  # NDVI ranges from -1 to 1
        
        # Generate EVI (Enhanced Vegetation Index)
        evi_base = ndvi_base * 0.9  # EVI is typically lower than NDVI
        evi = generate_correlated_grid(grid_size, (evi_base - 0.2, evi_base + 0.2))
        evi = np.clip(evi, -1.0, 1.0)
        
        # Generate NDMI (Normalized Difference Moisture Index)
        ndmi_base = ndvi_base * 0.8  # NDMI is typically lower than NDVI
        ndmi = generate_correlated_grid(grid_size, (ndmi_base - 0.3, ndmi_base + 0.1))
        ndmi = np.clip(ndmi, -1.0, 1.0)
        
        # Generate NBR (Normalized Burn Ratio)
        nbr_base = ndvi_base * 0.85
        nbr = generate_correlated_grid(grid_size, (nbr_base - 0.25, nbr_base + 0.15))
        nbr = np.clip(nbr, -1.0, 1.0)
        
        # Calculate statistics
        indices.append({
            "date": format_date(date),
            "ndvi": {
                "mean": float(np.mean(ndvi)),
                "min": float(np.min(ndvi)),
                "max": float(np.max(ndvi)),
                "std": float(np.std(ndvi))
            },
            "evi": {
                "mean": float(np.mean(evi)),
                "min": float(np.min(evi)),
                "max": float(np.max(evi)),
                "std": float(np.std(evi))
            },
            "ndmi": {
                "mean": float(np.mean(ndmi)),
                "min": float(np.min(ndmi)),
                "max": float(np.max(ndmi)),
                "std": float(np.std(ndmi))
            },
            "nbr": {
                "mean": float(np.mean(nbr)),
                "min": float(np.min(nbr)),
                "max": float(np.max(nbr)),
                "std": float(np.std(nbr))
            },
            "drought_risk": calculate_drought_risk(ndvi, ndmi),
            "fire_fuel_load": calculate_fire_fuel_load(ndvi, evi, nbr)
        })
    
    # Calculate trends
    ndvi_means = [day["ndvi"]["mean"] for day in indices]
    ndmi_means = [day["ndmi"]["mean"] for day in indices]
    
    return {
        "state": state_code,
        "grid_size": grid_size,
        "start_date": format_date(start_date),
        "end_date": format_date(end_date),
        "indices": indices,
        "trends": {
            "ndvi_trend": calculate_trend(ndvi_means),
            "ndmi_trend": calculate_trend(ndmi_means),
            "drought_intensifying": is_drought_intensifying(ndmi_means)
        }
    }

def generate_correlated_grid(grid_size: Tuple[int, int], value_range: Tuple[float, float]) -> np.ndarray:
    """
    Generate a spatially correlated grid using a simple method.
    
    Args:
        grid_size: Tuple of (rows, cols)
        value_range: Tuple of (min_value, max_value)
        
    Returns:
        2D numpy array with spatially correlated values
    """
    rows, cols = grid_size
    min_val, max_val = value_range
    
    # Start with random noise
    grid = np.random.normal(0, 1, (rows, cols))
    
    # Apply simple spatial smoothing
    for _ in range(5):  # Number of smoothing iterations
        # Pad the grid to handle edges
        padded = np.pad(grid, 1, mode='edge')
        
        # Apply smoothing kernel
        for i in range(rows):
            for j in range(cols):
                # Average with neighbors
                grid[i, j] = np.mean(padded[i:i+3, j:j+3])
    
    # Scale to desired range
    grid = (grid - grid.min()) / (grid.max() - grid.min())  # Scale to [0, 1]
    grid = grid * (max_val - min_val) + min_val  # Scale to [min_val, max_val]
    
    return grid

def calculate_drought_risk(ndvi: np.ndarray, ndmi: np.ndarray) -> Dict:
    """
    Calculate drought risk based on vegetation indices.
    
    Args:
        ndvi: 2D numpy array of NDVI values
        ndmi: 2D numpy array of NDMI values
        
    Returns:
        Dictionary containing drought risk metrics
    """
    # Simplified drought risk calculation
    # Low NDVI and NDMI indicate drought conditions
    
    # Calculate drought risk (0-100 scale)
    # Higher values = higher drought risk
    drought_risk = 100 * (1 - (ndvi + ndmi) / 2)
    
    # Classify risk levels
    low_risk = np.sum(drought_risk < 30) / drought_risk.size
    moderate_risk = np.sum((drought_risk >= 30) & (drought_risk < 60)) / drought_risk.size
    high_risk = np.sum(drought_risk >= 60) / drought_risk.size
    
    return {
        "mean_risk_score": float(np.mean(drought_risk)),
        "percent_low_risk": float(low_risk * 100),
        "percent_moderate_risk": float(moderate_risk * 100),
        "percent_high_risk": float(high_risk * 100)
    }

def calculate_fire_fuel_load(ndvi: np.ndarray, evi: np.ndarray, nbr: np.ndarray) -> Dict:
    """
    Calculate fire fuel load based on vegetation indices.
    
    Args:
        ndvi: 2D numpy array of NDVI values
        evi: 2D numpy array of EVI values
        nbr: 2D numpy array of NBR values
        
    Returns:
        Dictionary containing fire fuel load metrics
    """
    # Simplified fire fuel load calculation
    # Higher NDVI and EVI indicate more vegetation (fuel)
    # NBR helps identify areas with dry vegetation
    
    # Calculate fuel load (0-100 scale)
    # Higher values = higher fuel load
    fuel_load = 100 * ((ndvi + evi) / 2)
    
    # Adjust for moisture (using NBR as a proxy)
    # Lower NBR indicates drier conditions
    moisture_factor = (nbr + 1) / 2  # Scale to 0-1
    dry_fuel_load = fuel_load * (1 - moisture_factor)
    
    # Classify fuel load levels
    low_load = np.sum(dry_fuel_load < 30) / dry_fuel_load.size
    moderate_load = np.sum((dry_fuel_load >= 30) & (dry_fuel_load < 60)) / dry_fuel_load.size
    high_load = np.sum(dry_fuel_load >= 60) / dry_fuel_load.size
    
    return {
        "mean_fuel_load": float(np.mean(fuel_load)),
        "mean_dry_fuel_load": float(np.mean(dry_fuel_load)),
        "percent_low_load": float(low_load * 100),
        "percent_moderate_load": float(moderate_load * 100),
        "percent_high_load": float(high_load * 100)
    }

def calculate_trend(values: List[float]) -> float:
    """
    Calculate the trend (slope) of a time series.
    
    Args:
        values: List of values
        
    Returns:
        Trend (slope) of the time series
    """
    if len(values) < 2:
        return 0.0
    
    # Simple linear regression
    x = np.arange(len(values))
    y = np.array(values)
    
    # Calculate slope
    n = len(x)
    slope = (n * np.sum(x * y) - np.sum(x) * np.sum(y)) / (n * np.sum(x**2) - np.sum(x)**2)
    
    return float(slope)

def is_drought_intensifying(ndmi_means: List[float]) -> bool:
    """
    Determine if drought conditions are intensifying.
    
    Args:
        ndmi_means: List of NDMI mean values over time
        
    Returns:
        True if drought is intensifying, False otherwise
    """
    if len(ndmi_means) < 3:
        return False
    
    # Calculate trend
    trend = calculate_trend(ndmi_means)
    
    # Negative trend in NDMI indicates intensifying drought
    return trend < -0.01 