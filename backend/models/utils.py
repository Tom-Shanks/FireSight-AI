"""
Utility functions for wildfire prediction models.
"""

import os
import logging
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
import numpy as np
import pandas as pd

# Configure logging
logger = logging.getLogger("models")
logger.setLevel(logging.INFO)

def setup_logging(name: str) -> logging.Logger:
    """
    Set up a logger with the given name.
    
    Args:
        name: The name of the logger
        
    Returns:
        A configured logger instance
    """
    log = logging.getLogger(name)
    log.setLevel(logging.INFO)
    
    # Add console handler if not already added
    if not log.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        log.addHandler(handler)
    
    return log

def get_s3_client():
    """
    Get an S3 client.
    
    Returns:
        boto3 S3 client
    """
    return boto3.client('s3')

def upload_to_s3(data: Union[Dict, List, str], 
                bucket: str, 
                key: str, 
                content_type: str = 'application/json') -> bool:
    """
    Upload data to S3.
    
    Args:
        data: The data to upload
        bucket: The S3 bucket name
        key: The S3 object key
        content_type: The content type of the data
        
    Returns:
        True if successful, False otherwise
    """
    s3 = get_s3_client()
    
    try:
        # Convert data to JSON string if it's a dict or list
        if isinstance(data, (dict, list)):
            data = json.dumps(data)
        
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=content_type
        )
        logger.info(f"Successfully uploaded data to s3://{bucket}/{key}")
        return True
    except Exception as e:
        logger.error(f"Error uploading to S3: {str(e)}")
        return False

def download_from_s3(bucket: str, key: str) -> Optional[Dict]:
    """
    Download data from S3.
    
    Args:
        bucket: The S3 bucket name
        key: The S3 object key
        
    Returns:
        The downloaded data as a dictionary, or None if an error occurred
    """
    s3 = get_s3_client()
    
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        data = json.loads(response['Body'].read().decode('utf-8'))
        logger.info(f"Successfully downloaded data from s3://{bucket}/{key}")
        return data
    except Exception as e:
        logger.error(f"Error downloading from S3: {str(e)}")
        return None

def normalize_data(data: np.ndarray, min_val: float = 0.0, max_val: float = 1.0) -> np.ndarray:
    """
    Normalize data to a specified range.
    
    Args:
        data: The data to normalize
        min_val: The minimum value of the normalized data
        max_val: The maximum value of the normalized data
        
    Returns:
        Normalized data
    """
    data_min = np.min(data)
    data_max = np.max(data)
    
    if data_max == data_min:
        return np.full_like(data, (min_val + max_val) / 2)
    
    normalized = (data - data_min) / (data_max - data_min)
    return normalized * (max_val - min_val) + min_val

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth.
    
    Args:
        lat1: Latitude of point 1 (in degrees)
        lon1: Longitude of point 1 (in degrees)
        lat2: Latitude of point 2 (in degrees)
        lon2: Longitude of point 2 (in degrees)
        
    Returns:
        Distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

def get_date_range(days_back: int = 7) -> Tuple[datetime, datetime]:
    """
    Get a date range from today to N days back.
    
    Args:
        days_back: Number of days to go back
        
    Returns:
        Tuple of (start_date, end_date) as datetime objects
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    return start_date, end_date

def format_date(date: datetime, format_str: str = '%Y-%m-%d') -> str:
    """
    Format a datetime object as a string.
    
    Args:
        date: The datetime object
        format_str: The format string
        
    Returns:
        Formatted date string
    """
    return date.strftime(format_str) 