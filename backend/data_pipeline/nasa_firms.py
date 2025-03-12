import os
import logging
import json
import requests
import datetime
import time
from typing import Dict, List, Optional, Union
import boto3
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import psycopg2
from psycopg2.extras import execute_values

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
REGION = os.environ.get("REGION", "us-west-2")

# NASA FIRMS API information
# Note: Using the publicly available FIRMS data download
# This doesn't require API key for the publicly available datasets
FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire"
FIRMS_SOURCES = {
    "MODIS": "c6/csv/MODIS_C6_Global_24h.csv",
    "VIIRS_SNPP": "suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_Global_24h.csv",
    "VIIRS_NOAA": "noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv"
}

# Initialize AWS clients
s3_client = boto3.client("s3", region_name=REGION)


def fetch_firms_data(source: str = "VIIRS_SNPP") -> pd.DataFrame:
    """
    Fetch active fire data from NASA FIRMS.
    
    Args:
        source: Data source (MODIS, VIIRS_SNPP, or VIIRS_NOAA)
        
    Returns:
        DataFrame with fire detection data
    """
    if source not in FIRMS_SOURCES:
        raise ValueError(f"Invalid source: {source}. Must be one of {list(FIRMS_SOURCES.keys())}")
    
    url = f"{FIRMS_BASE_URL}/{FIRMS_SOURCES[source]}"
    logger.info(f"Fetching FIRMS data from {url}")
    
    try:
        # Download CSV file
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Save to temporary CSV and load as DataFrame
        with open("/tmp/firms_data.csv", "wb") as f:
            f.write(response.content)
        
        # Read CSV into pandas DataFrame
        df = pd.read_csv("/tmp/firms_data.csv")
        logger.info(f"Successfully fetched {len(df)} fire detections from {source}")
        return df
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching FIRMS data: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error processing FIRMS data: {str(e)}")
        raise


def process_firms_data(df: pd.DataFrame, source: str) -> gpd.GeoDataFrame:
    """
    Process FIRMS data and create a GeoDataFrame.
    
    Args:
        df: DataFrame with FIRMS data
        source: Data source name
        
    Returns:
        GeoDataFrame with processed data
    """
    logger.info(f"Processing {len(df)} rows from {source}")
    
    # Column mapping for different sources
    column_mapping = {
        "MODIS": {
            "latitude": "latitude",
            "longitude": "longitude",
            "acq_date": "acq_date",
            "acq_time": "acq_time",
            "confidence": "confidence",
            "brightness": "brightness",
            "frp": "frp"
        },
        "VIIRS_SNPP": {
            "latitude": "latitude",
            "longitude": "longitude",
            "acq_date": "acq_date",
            "acq_time": "acq_time",
            "confidence": "confidence",
            "bright_ti4": "brightness",
            "frp": "frp"
        },
        "VIIRS_NOAA": {
            "latitude": "latitude",
            "longitude": "longitude",
            "acq_date": "acq_date",
            "acq_time": "acq_time",
            "confidence": "confidence",
            "bright_ti4": "brightness",
            "frp": "frp"
        }
    }
    
    # Standardize column names
    cols = column_mapping[source]
    
    # Select and rename columns
    try:
        df = df[[
            cols["latitude"], cols["longitude"], 
            cols["acq_date"], cols["acq_time"],
            cols["confidence"], cols["brightness"], cols["frp"]
        ]]
        
        df.columns = ["latitude", "longitude", "acq_date", "acq_time", 
                    "confidence", "brightness", "frp"]
        
        # Convert acquisition date and time to datetime
        df["acquisition_datetime"] = pd.to_datetime(
            df["acq_date"] + " " + df["acq_time"].astype(str).str.zfill(4),
            format="%Y-%m-%d %H%M"
        )
        
        # Add source information
        df["source"] = source
        df["collection_datetime"] = datetime.datetime.utcnow().isoformat()
        
        # Create geometry column for GeoPandas
        geometry = [Point(xy) for xy in zip(df.longitude, df.latitude)]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        
        logger.info(f"Successfully processed {len(gdf)} fire detections")
        return gdf
        
    except Exception as e:
        logger.error(f"Error processing FIRMS data: {str(e)}")
        raise


def store_in_s3(gdf: gpd.GeoDataFrame, source: str) -> str:
    """
    Store the GeoDataFrame in S3 as GeoJSON.
    
    Args:
        gdf: GeoDataFrame with fire detection data
        source: Data source name
        
    Returns:
        S3 key where data was stored
    """
    # Create timestamp for filename
    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    s3_key = f"firms_data/{source}_{timestamp}.geojson"
    
    logger.info(f"Storing {len(gdf)} records in S3: {s3_key}")
    
    try:
        # Convert to GeoJSON and store in S3
        geo_json = gdf.to_json()
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=geo_json,
            ContentType="application/json"
        )
        logger.info(f"Successfully stored data in S3: s3://{S3_BUCKET}/{s3_key}")
        return s3_key
        
    except Exception as e:
        logger.error(f"Error storing data in S3: {str(e)}")
        raise


def insert_into_database(gdf: gpd.GeoDataFrame) -> int:
    """
    Insert fire detection data into PostgreSQL with PostGIS.
    
    Args:
        gdf: GeoDataFrame with fire detection data
        
    Returns:
        Number of records inserted
    """
    if not DB_CONNECTION_STRING:
        logger.warning("Database connection string not provided. Skipping database insertion.")
        return 0
    
    logger.info(f"Inserting {len(gdf)} records into database")
    
    try:
        conn = psycopg2.connect(DB_CONNECTION_STRING)
        cur = conn.cursor()
        
        # Create table if it doesn't exist
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS fire_detections (
            id SERIAL PRIMARY KEY,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            acq_date DATE NOT NULL,
            acq_time VARCHAR(4) NOT NULL,
            confidence VARCHAR(20),
            brightness FLOAT,
            frp FLOAT,
            acquisition_datetime TIMESTAMP NOT NULL,
            source VARCHAR(20) NOT NULL,
            collection_datetime TIMESTAMP NOT NULL,
            geom GEOMETRY(Point, 4326) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_fire_detections_geom ON fire_detections USING GIST(geom);
        CREATE INDEX IF NOT EXISTS idx_fire_detections_datetime ON fire_detections(acquisition_datetime);
        """
        cur.execute(create_table_sql)
        
        # Prepare data for insertion
        columns = [
            "latitude", "longitude", "acq_date", "acq_time", 
            "confidence", "brightness", "frp", 
            "acquisition_datetime", "source", "collection_datetime", "geom"
        ]
        
        values = []
        for _, row in gdf.iterrows():
            values.append((
                float(row.latitude),
                float(row.longitude),
                row.acq_date,
                row.acq_time,
                row.confidence,
                float(row.brightness),
                float(row.frp),
                row.acquisition_datetime,
                row.source,
                datetime.datetime.fromisoformat(row.collection_datetime),
                f"SRID=4326;POINT({row.longitude} {row.latitude})"
            ))
        
        # Insert data using execute_values for better performance
        insert_sql = f"""
        INSERT INTO fire_detections 
        (latitude, longitude, acq_date, acq_time, confidence, brightness, frp, 
         acquisition_datetime, source, collection_datetime, geom)
        VALUES %s
        """
        execute_values(cur, insert_sql, values)
        
        # Commit changes
        conn.commit()
        logger.info(f"Successfully inserted {len(values)} records into database")
        
        # Close connection
        cur.close()
        conn.close()
        
        return len(values)
        
    except Exception as e:
        logger.error(f"Error inserting data into database: {str(e)}")
        if 'conn' in locals() and conn is not None:
            conn.close()
        raise


def handler(event, context):
    """
    AWS Lambda handler function to fetch and process NASA FIRMS data.
    
    Args:
        event: AWS Lambda event data
        context: AWS Lambda context
        
    Returns:
        Dict with processing results
    """
    logger.info("Starting NASA FIRMS data processing")
    
    results = {}
    sources = event.get("sources", ["VIIRS_SNPP"])  # Default to VIIRS_SNPP if not specified
    
    start_time = time.time()
    total_records = 0
    
    try:
        for source in sources:
            if source not in FIRMS_SOURCES:
                logger.warning(f"Skipping invalid source: {source}")
                continue
                
            logger.info(f"Processing source: {source}")
            
            # Fetch data
            df = fetch_firms_data(source)
            
            # Process data
            gdf = process_firms_data(df, source)
            
            # Store in S3
            s3_key = store_in_s3(gdf, source)
            
            # Insert into database
            db_records = insert_into_database(gdf)
            
            # Record results
            results[source] = {
                "records_processed": len(gdf),
                "records_stored_s3": len(gdf),
                "records_stored_db": db_records,
                "s3_key": s3_key
            }
            
            total_records += len(gdf)
            
            # Small delay to avoid hitting rate limits
            time.sleep(1)
        
        processing_time = time.time() - start_time
        logger.info(f"NASA FIRMS data processing completed in {processing_time:.2f} seconds, {total_records} records processed")
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Successfully processed NASA FIRMS data",
                "total_records": total_records,
                "processing_time_seconds": processing_time,
                "results": results
            })
        }
        
    except Exception as e:
        logger.error(f"Error in NASA FIRMS data processing: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({
                "message": f"Error processing NASA FIRMS data: {str(e)}",
                "results": results
            })
        } 