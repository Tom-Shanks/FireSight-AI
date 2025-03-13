"""
Module for processing terrain data for wildfire prediction.
"""

import os
import json
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

import boto3
import numpy as np
import pandas as pd

from .utils import setup_logging, upload_to_s3

# Configure logging
logger = setup_logging("terrain-processor")

# Constants
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
TERRAIN_DATA_PREFIX = "terrain"

def handler(event, context):
    """
    Lambda handler for processing terrain data.
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Dict containing the result of the operation
    """
    logger.info("Starting terrain data processing")
    
    try:
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
        
        # Process terrain data for each region
        results = []
        for region in regions:
            logger.info(f"Processing terrain data for {region['name']}")
            
            # In a real implementation, we would download and process USGS terrain data
            # For this example, we'll generate synthetic data
            terrain_data = generate_synthetic_terrain_data(region["state"])
            
            # Calculate terrain metrics
            metrics = calculate_terrain_metrics(terrain_data)
            
            # Upload to S3
            timestamp = datetime.utcnow().strftime("%Y-%m-%d")
            s3_key = f"{TERRAIN_DATA_PREFIX}/{region['state']}/terrain_metrics_{timestamp}.json"
            upload_success = upload_to_s3(metrics, S3_BUCKET, s3_key)
            
            results.append({
                "region": region["name"],
                "state": region["state"],
                "metrics_calculated": len(metrics),
                "upload_success": upload_success,
                "s3_location": f"s3://{S3_BUCKET}/{s3_key}" if upload_success else None
            })
        
        logger.info(f"Completed terrain data processing for {len(regions)} regions")
        return {
            "statusCode": 200,
            "body": {
                "message": "Terrain data processing completed successfully",
                "results": results
            }
        }
    
    except Exception as e:
        logger.error(f"Error processing terrain data: {str(e)}")
        return {
            "statusCode": 500,
            "body": {
                "message": f"Error processing terrain data: {str(e)}"
            }
        }

def generate_synthetic_terrain_data(state_code: str) -> Dict:
    """
    Generate synthetic terrain data for testing.
    
    Args:
        state_code: Two-letter state code
        
    Returns:
        Dictionary containing synthetic terrain data
    """
    # Define grid size based on state (simplified)
    grid_sizes = {
        "CA": (100, 100), "OR": (80, 80), "WA": (70, 70),
        "ID": (80, 80), "NV": (90, 90), "AZ": (90, 90),
        "UT": (70, 70), "CO": (80, 80), "NM": (90, 90),
        "MT": (90, 90), "WY": (70, 70)
    }
    
    grid_size = grid_sizes.get(state_code, (50, 50))
    
    # Base elevation ranges by state (simplified, in meters)
    elevation_ranges = {
        "CA": (0, 4500), "OR": (0, 3500), "WA": (0, 4500),
        "ID": (500, 3500), "NV": (500, 4000), "AZ": (100, 3800),
        "UT": (1000, 4000), "CO": (1000, 4500), "NM": (1000, 4000),
        "MT": (500, 4000), "WY": (1000, 4000)
    }
    
    elev_range = elevation_ranges.get(state_code, (0, 3000))
    
    # Generate elevation grid with some spatial correlation
    elevation = generate_correlated_grid(grid_size, elev_range)
    
    # Generate slope and aspect from elevation
    slope, aspect = calculate_slope_aspect(elevation)
    
    # Generate land cover types
    land_cover = generate_land_cover(grid_size, state_code)
    
    return {
        "state": state_code,
        "grid_size": grid_size,
        "elevation": elevation.tolist(),
        "slope": slope.tolist(),
        "aspect": aspect.tolist(),
        "land_cover": land_cover.tolist()
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

def calculate_slope_aspect(elevation: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Calculate slope and aspect from elevation data.
    
    Args:
        elevation: 2D numpy array of elevation values
        
    Returns:
        Tuple of (slope, aspect) as 2D numpy arrays
    """
    rows, cols = elevation.shape
    
    # Initialize output arrays
    slope = np.zeros((rows, cols))
    aspect = np.zeros((rows, cols))
    
    # Cell size (arbitrary for synthetic data)
    cell_size = 30  # 30 meters
    
    # Calculate slope and aspect using central difference
    for i in range(1, rows-1):
        for j in range(1, cols-1):
            # Calculate elevation differences
            dz_dx = (elevation[i, j+1] - elevation[i, j-1]) / (2 * cell_size)
            dz_dy = (elevation[i+1, j] - elevation[i-1, j]) / (2 * cell_size)
            
            # Calculate slope (in degrees)
            slope[i, j] = np.degrees(np.arctan(np.sqrt(dz_dx**2 + dz_dy**2)))
            
            # Calculate aspect (in degrees)
            aspect[i, j] = np.degrees(np.arctan2(dz_dy, -dz_dx))
            
            # Convert to 0-360 degrees
            if aspect[i, j] < 0:
                aspect[i, j] += 360
    
    return slope, aspect

def generate_land_cover(grid_size: Tuple[int, int], state_code: str) -> np.ndarray:
    """
    Generate synthetic land cover data.
    
    Args:
        grid_size: Tuple of (rows, cols)
        state_code: Two-letter state code
        
    Returns:
        2D numpy array with land cover codes
    """
    rows, cols = grid_size
    
    # Land cover codes:
    # 1: Forest
    # 2: Shrubland
    # 3: Grassland
    # 4: Wetland
    # 5: Developed
    # 6: Barren
    # 7: Water
    
    # Approximate land cover distributions by state (simplified)
    distributions = {
        "CA": [0.40, 0.30, 0.15, 0.05, 0.05, 0.03, 0.02],  # More forest and shrubland
        "OR": [0.50, 0.20, 0.15, 0.05, 0.05, 0.03, 0.02],  # More forest
        "WA": [0.55, 0.15, 0.15, 0.05, 0.05, 0.03, 0.02],  # More forest
        "ID": [0.45, 0.25, 0.20, 0.02, 0.03, 0.03, 0.02],  # Forest and shrubland
        "NV": [0.10, 0.40, 0.30, 0.02, 0.03, 0.13, 0.02],  # More shrubland and barren
        "AZ": [0.15, 0.45, 0.25, 0.02, 0.03, 0.08, 0.02],  # More shrubland
        "UT": [0.20, 0.40, 0.25, 0.02, 0.03, 0.08, 0.02],  # Shrubland and grassland
        "CO": [0.30, 0.30, 0.25, 0.03, 0.05, 0.05, 0.02],  # Mixed
        "NM": [0.20, 0.40, 0.25, 0.02, 0.03, 0.08, 0.02],  # More shrubland
        "MT": [0.35, 0.25, 0.30, 0.03, 0.02, 0.03, 0.02],  # Forest and grassland
        "WY": [0.25, 0.30, 0.35, 0.02, 0.02, 0.04, 0.02]   # More grassland
    }
    
    dist = distributions.get(state_code, [0.33, 0.33, 0.20, 0.03, 0.05, 0.04, 0.02])
    
    # Generate random land cover based on distribution
    land_cover = np.zeros((rows, cols), dtype=int)
    for i in range(rows):
        for j in range(cols):
            land_cover[i, j] = np.random.choice(range(1, 8), p=dist)
    
    # Apply some spatial correlation (simple method)
    for _ in range(3):  # Number of smoothing iterations
        # Pad the grid to handle edges
        padded = np.pad(land_cover, 1, mode='edge')
        
        for i in range(rows):
            for j in range(cols):
                # Get most common value in neighborhood
                neighborhood = padded[i:i+3, j:j+3].flatten()
                values, counts = np.unique(neighborhood, return_counts=True)
                
                # 80% chance to change to most common neighbor
                if np.random.random() < 0.8:
                    land_cover[i, j] = values[np.argmax(counts)]
    
    return land_cover

def calculate_terrain_metrics(terrain_data: Dict) -> Dict:
    """
    Calculate terrain metrics from terrain data.
    
    Args:
        terrain_data: Dictionary containing terrain data
        
    Returns:
        Dictionary containing terrain metrics
    """
    # Extract arrays from terrain data
    elevation = np.array(terrain_data["elevation"])
    slope = np.array(terrain_data["slope"])
    aspect = np.array(terrain_data["aspect"])
    land_cover = np.array(terrain_data["land_cover"])
    
    # Calculate metrics
    metrics = {
        "state": terrain_data["state"],
        "grid_size": terrain_data["grid_size"],
        "elevation_stats": {
            "min": float(np.min(elevation)),
            "max": float(np.max(elevation)),
            "mean": float(np.mean(elevation)),
            "median": float(np.median(elevation)),
            "std": float(np.std(elevation))
        },
        "slope_stats": {
            "min": float(np.min(slope)),
            "max": float(np.max(slope)),
            "mean": float(np.mean(slope)),
            "median": float(np.median(slope)),
            "std": float(np.std(slope))
        },
        "aspect_distribution": {
            "north": float(np.sum((aspect >= 315) | (aspect < 45)) / aspect.size),
            "east": float(np.sum((aspect >= 45) & (aspect < 135)) / aspect.size),
            "south": float(np.sum((aspect >= 135) & (aspect < 225)) / aspect.size),
            "west": float(np.sum((aspect >= 225) & (aspect < 315)) / aspect.size)
        },
        "land_cover_distribution": {
            "forest": float(np.sum(land_cover == 1) / land_cover.size),
            "shrubland": float(np.sum(land_cover == 2) / land_cover.size),
            "grassland": float(np.sum(land_cover == 3) / land_cover.size),
            "wetland": float(np.sum(land_cover == 4) / land_cover.size),
            "developed": float(np.sum(land_cover == 5) / land_cover.size),
            "barren": float(np.sum(land_cover == 6) / land_cover.size),
            "water": float(np.sum(land_cover == 7) / land_cover.size)
        },
        "steep_slopes": {
            "percent_over_15deg": float(np.sum(slope > 15) / slope.size),
            "percent_over_30deg": float(np.sum(slope > 30) / slope.size)
        },
        "fire_risk_factors": {
            "high_risk_area_percent": calculate_high_risk_area_percent(elevation, slope, aspect, land_cover)
        }
    }
    
    return metrics

def calculate_high_risk_area_percent(elevation: np.ndarray, slope: np.ndarray, 
                                    aspect: np.ndarray, land_cover: np.ndarray) -> float:
    """
    Calculate percentage of high fire risk areas based on terrain factors.
    
    Args:
        elevation: 2D numpy array of elevation values
        slope: 2D numpy array of slope values
        aspect: 2D numpy array of aspect values
        land_cover: 2D numpy array of land cover codes
        
    Returns:
        Percentage of high risk areas
    """
    # Define high risk conditions (simplified)
    # 1. Steep slopes (> 20 degrees)
    steep_slope = slope > 20
    
    # 2. South or west facing (135-315 degrees)
    south_west_facing = (aspect >= 135) & (aspect < 315)
    
    # 3. Flammable vegetation (forest, shrubland, grassland)
    flammable_veg = np.isin(land_cover, [1, 2, 3])
    
    # Combine factors (all must be true for high risk)
    high_risk = steep_slope & south_west_facing & flammable_veg
    
    # Calculate percentage
    percent_high_risk = np.sum(high_risk) / high_risk.size
    
    return float(percent_high_risk * 100)  # Return as percentage 