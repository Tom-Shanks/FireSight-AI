"""
Utility functions for data pipeline operations.
"""

import os
import logging
import json
import boto3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union

# Configure logging
logger = logging.getLogger("data-pipeline")
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

def get_date_range(days_back: int = 7) -> tuple:
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