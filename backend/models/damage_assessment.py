import os
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional
import uuid

import boto3
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon, shape
from shapely.ops import unary_union
import requests
import io
import base64
from PIL import Image

# Optional imports - only used if TensorFlow Lite is available
try:
    import tensorflow as tf
    import tensorflow.lite as tflite
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
REGION = os.environ.get("REGION", "us-west-2")

# Initialize AWS clients
s3_client = boto3.client("s3", region_name=REGION)

# Model paths
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "damage_assessment_model.tflite")


class DamageAssessment:
    """Damage assessment model for wildfire impacts."""
    
    def __init__(self, fire_area: List[Dict[str, float]], pre_fire_date: str, post_fire_date: str):
        """
        Initialize the damage assessment model.
        
        Args:
            fire_area: List of coordinates defining the fire area polygon
            pre_fire_date: Date before the fire (YYYY-MM-DD)
            post_fire_date: Date after the fire (YYYY-MM-DD)
        """
        self.fire_area = fire_area
        self.pre_fire_date = pre_fire_date
        self.post_fire_date = post_fire_date
        
        # Create a shapely polygon from the fire area
        self.fire_polygon = self._create_polygon()
        
        # Load the model if TensorFlow is available
        self.model = None
        if TF_AVAILABLE:
            self._load_model()
    
    def _create_polygon(self) -> Polygon:
        """
        Create a shapely polygon from the fire area coordinates.
        
        Returns:
            Shapely Polygon representing the fire area
        """
        # Extract coordinates from the fire area
        coordinates = [(point["longitude"], point["latitude"]) for point in self.fire_area]
        
        # Create a shapely polygon
        try:
            polygon = Polygon(coordinates)
            
            # Validate polygon
            if not polygon.is_valid:
                # Try to fix invalid polygon
                polygon = polygon.buffer(0)
                
                if not polygon.is_valid:
                    # If still invalid, create a simplified convex hull
                    points = [Point(lon, lat) for lon, lat in coordinates]
                    polygon = unary_union(points).convex_hull
            
            return polygon
        except Exception as e:
            logger.error(f"Error creating polygon: {str(e)}")
            # Create a simple bounding box as fallback
            lons = [point["longitude"] for point in self.fire_area]
            lats = [point["latitude"] for point in self.fire_area]
            
            min_lon, max_lon = min(lons), max(lons)
            min_lat, max_lat = min(lats), max(lats)
            
            return Polygon([
                (min_lon, min_lat),
                (min_lon, max_lat),
                (max_lon, max_lat),
                (max_lon, min_lat),
                (min_lon, min_lat)
            ])
    
    def _load_model(self):
        """Load the TensorFlow Lite model for damage assessment."""
        try:
            # Check if model exists locally
            if os.path.exists(MODEL_PATH):
                # Load the model
                self.interpreter = tflite.Interpreter(model_path=MODEL_PATH)
                self.interpreter.allocate_tensors()
                logger.info("Loaded local damage assessment model")
            else:
                # Try to download model from S3
                try:
                    model_s3_key = "models/damage_assessment_model.tflite"
                    logger.info(f"Downloading model from S3: {model_s3_key}")
                    
                    # Make directory if it doesn't exist
                    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
                    
                    # Download model
                    s3_client.download_file(S3_BUCKET, model_s3_key, MODEL_PATH)
                    
                    # Load the model
                    self.interpreter = tflite.Interpreter(model_path=MODEL_PATH)
                    self.interpreter.allocate_tensors()
                    logger.info("Downloaded and loaded damage assessment model from S3")
                except Exception as e:
                    logger.error(f"Error downloading model from S3: {str(e)}")
                    logger.warning("Using fallback assessment without ML model")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            logger.warning("Using fallback assessment without ML model")
    
    def get_satellite_imagery(self) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Get pre and post-fire satellite imagery for the fire area.
        
        Returns:
            Tuple of (pre_fire_image, post_fire_image)
        """
        logger.info(f"Fetching satellite imagery for {self.pre_fire_date} and {self.post_fire_date}")
        
        # Get bounds of the fire area
        bounds = self.fire_polygon.bounds  # (minx, miny, maxx, maxy)
        
        # For a real implementation, this would use actual satellite imagery APIs
        # like Sentinel Hub, Planet, or NASA's Earth data
        # For the MVP, we'll simulate this with random images
        
        # In a real implementation, we would:
        # 1. Call an API to get satellite imagery for the specified dates and bounds
        # 2. Process and align the images
        # 3. Crop to the fire area
        # 4. Return the processed images
        
        # For simulation, generate random images
        # Red color values will be higher in the post-fire image to simulate burn scars
        
        # Image size (pixels)
        image_size = (256, 256)
        
        try:
            # Generate pre-fire image
            # Higher green values for healthy vegetation
            pre_fire = np.random.randint(0, 256, (image_size[0], image_size[1], 3), dtype=np.uint8)
            pre_fire[:, :, 1] = np.clip(pre_fire[:, :, 1] + 50, 0, 255)  # Boost green
            
            # Generate post-fire image
            # Higher red values for burned areas
            post_fire = np.random.randint(0, 256, (image_size[0], image_size[1], 3), dtype=np.uint8)
            
            # Create burn pattern
            # Center of the burn
            center_x, center_y = image_size[0] // 2, image_size[1] // 2
            
            # Create a distance matrix from center
            y, x = np.ogrid[:image_size[0], :image_size[1]]
            dist_from_center = np.sqrt((x - center_x)**2 + (y - center_y)**2)
            
            # Normalize to 0-1
            max_dist = np.sqrt(center_x**2 + center_y**2)
            normalized_dist = dist_from_center / max_dist
            
            # Create burn mask (1 where burned, 0 where not)
            burn_mask = normalized_dist < 0.6  # 60% of image is burned
            
            # Apply burn effect
            post_fire[burn_mask, 0] = np.clip(post_fire[burn_mask, 0] + 100, 0, 255)  # Boost red
            post_fire[burn_mask, 1] = np.clip(post_fire[burn_mask, 1] - 50, 0, 255)   # Reduce green
            post_fire[burn_mask, 2] = np.clip(post_fire[burn_mask, 2] - 50, 0, 255)   # Reduce blue
            
            return pre_fire, post_fire
        except Exception as e:
            logger.error(f"Error generating satellite imagery: {str(e)}")
            return None, None
    
    def assess_damage(self) -> Dict[str, Any]:
        """
        Assess wildfire damage by analyzing pre and post-fire satellite imagery.
        
        Returns:
            Dict with damage assessment results
        """
        logger.info("Starting damage assessment")
        start_time = time.time()
        
        # Get satellite imagery
        pre_fire_image, post_fire_image = self.get_satellite_imagery()
        
        # If no images, return error
        if pre_fire_image is None or post_fire_image is None:
            logger.error("Failed to get satellite imagery")
            return {
                "error": "Failed to get satellite imagery"
            }
        
        # Calculate basic metrics
        metrics = self.calculate_damage_metrics(pre_fire_image, post_fire_image)
        
        # Generate map
        map_url = self.generate_damage_map(pre_fire_image, post_fire_image, metrics)
        
        # Add map URL to metrics
        metrics["map_url"] = map_url
        
        # Log completion
        assessment_time = time.time() - start_time
        logger.info(f"Damage assessment completed in {assessment_time:.2f} seconds")
        
        return metrics
    
    def calculate_damage_metrics(self, pre_fire_image: np.ndarray, post_fire_image: np.ndarray) -> Dict[str, Any]:
        """
        Calculate damage metrics from pre and post-fire images.
        
        Args:
            pre_fire_image: Pre-fire satellite image
            post_fire_image: Post-fire satellite image
            
        Returns:
            Dict with damage metrics
        """
        logger.info("Calculating damage metrics")
        
        # For a full implementation, this would use the ML model to classify
        # burned vs. unburned areas and identify damage to different land cover types
        
        # Calculate burned area
        # In a real implementation, this would be based on ML model classification
        # For MVP, we use a simple red channel difference threshold
        
        # Calculate difference in red channel
        red_diff = post_fire_image[:, :, 0].astype(float) - pre_fire_image[:, :, 0].astype(float)
        
        # Threshold for burned pixels
        burned_mask = red_diff > 50
        
        # Count burned pixels
        burned_pixels = np.sum(burned_mask)
        
        # Calculate total area of fire polygon in square kilometers
        # 1 degree of latitude ≈ 111 km
        area_sqkm = self.fire_polygon.area * 111 * 111 * np.cos(np.radians(self.fire_polygon.centroid.y))
        
        # Calculate burned area proportion
        burned_proportion = burned_pixels / (pre_fire_image.shape[0] * pre_fire_image.shape[1])
        
        # Calculate burned area in square kilometers
        burned_area_sqkm = area_sqkm * burned_proportion
        
        # For a real implementation, we would calculate damage to different land cover types
        # using a pre-existing land cover map and the burn classification
        # For MVP, we simulate this with random proportions
        
        # Simulate vegetation damage
        forest_proportion = 0.6  # 60% of the area was forest
        shrubland_proportion = 0.3  # 30% of the area was shrubland
        grassland_proportion = 0.1  # 10% of the area was grassland
        
        vegetation_damage = {
            "forest": burned_area_sqkm * forest_proportion,
            "shrubland": burned_area_sqkm * shrubland_proportion,
            "grassland": burned_area_sqkm * grassland_proportion
        }
        
        # Simulate infrastructure damage
        # In a real implementation, this would use building footprints and road networks
        # For MVP, we simulate this based on the burned area
        
        # Assume 1 building per 0.5 sq km in rural areas
        estimated_buildings = int(area_sqkm * 2)
        damaged_buildings = int(estimated_buildings * burned_proportion)
        
        # Assume 1 km of roads per 1 sq km
        estimated_roads_km = area_sqkm
        damaged_roads_km = estimated_roads_km * burned_proportion
        
        # Assume 0.5 km of power lines per 1 sq km
        estimated_power_lines_km = area_sqkm * 0.5
        damaged_power_lines_km = estimated_power_lines_km * burned_proportion
        
        infrastructure_impact = {
            "buildings": damaged_buildings,
            "roads_km": round(damaged_roads_km, 1),
            "power_lines_km": round(damaged_power_lines_km, 1)
        }
        
        # Estimate recovery time based on vegetation types and burn severity
        # In a real implementation, this would use ecological models
        # For MVP, we use a simple formula
        
        # Forest takes longer to recover than shrubland, which takes longer than grassland
        recovery_months = (
            (vegetation_damage["forest"] * 60) +  # ~5 years for forest
            (vegetation_damage["shrubland"] * 24) +  # ~2 years for shrubland
            (vegetation_damage["grassland"] * 6)  # ~6 months for grassland
        ) / burned_area_sqkm  # Weighted average
        
        # Return metrics
        return {
            "burned_area_sqkm": round(burned_area_sqkm, 2),
            "vegetation_damage": {
                "forest": round(vegetation_damage["forest"], 2),
                "shrubland": round(vegetation_damage["shrubland"], 2),
                "grassland": round(vegetation_damage["grassland"], 2)
            },
            "infrastructure_impact": infrastructure_impact,
            "recovery_estimate_months": round(recovery_months, 1)
        }
    
    def generate_damage_map(self, pre_fire_image: np.ndarray, post_fire_image: np.ndarray, metrics: Dict[str, Any]) -> str:
        """
        Generate a damage assessment map and upload to S3.
        
        Args:
            pre_fire_image: Pre-fire satellite image
            post_fire_image: Post-fire satellite image
            metrics: Damage metrics
            
        Returns:
            URL to the damage map
        """
        logger.info("Generating damage assessment map")
        
        # In a real implementation, this would create an interactive map with burned areas
        # For MVP, we create a simple HTML page with the pre and post fire images
        
        # First, convert images to base64
        def image_to_base64(image):
            pil_image = Image.fromarray(image)
            buffer = io.BytesIO()
            pil_image.save(buffer, format="PNG")
            return base64.b64encode(buffer.getvalue()).decode("utf-8")
        
        pre_fire_base64 = image_to_base64(pre_fire_image)
        post_fire_base64 = image_to_base64(post_fire_image)
        
        # Create HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Wildfire Damage Assessment</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                h1 {{ color: #d32f2f; }}
                .image-container {{ display: flex; margin-bottom: 20px; }}
                .image-card {{ margin-right: 20px; border: 1px solid #ddd; padding: 10px; }}
                .metrics {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
                .metric-row {{ margin-bottom: 10px; }}
                .metric-heading {{ font-weight: bold; }}
            </style>
        </head>
        <body>
            <h1>Wildfire Damage Assessment</h1>
            <p>Fire area assessment between {self.pre_fire_date} and {self.post_fire_date}</p>
            
            <div class="image-container">
                <div class="image-card">
                    <h3>Pre-Fire ({self.pre_fire_date})</h3>
                    <img src="data:image/png;base64,{pre_fire_base64}" alt="Pre-fire image" width="400" />
                </div>
                <div class="image-card">
                    <h3>Post-Fire ({self.post_fire_date})</h3>
                    <img src="data:image/png;base64,{post_fire_base64}" alt="Post-fire image" width="400" />
                </div>
            </div>
            
            <div class="metrics">
                <h2>Damage Assessment</h2>
                
                <div class="metric-row">
                    <span class="metric-heading">Burned Area:</span> {metrics["burned_area_sqkm"]} sq km
                </div>
                
                <div class="metric-row">
                    <span class="metric-heading">Vegetation Damage:</span>
                    <ul>
                        <li>Forest: {metrics["vegetation_damage"]["forest"]} sq km</li>
                        <li>Shrubland: {metrics["vegetation_damage"]["shrubland"]} sq km</li>
                        <li>Grassland: {metrics["vegetation_damage"]["grassland"]} sq km</li>
                    </ul>
                </div>
                
                <div class="metric-row">
                    <span class="metric-heading">Infrastructure Impact:</span>
                    <ul>
                        <li>Buildings: {metrics["infrastructure_impact"]["buildings"]}</li>
                        <li>Roads: {metrics["infrastructure_impact"]["roads_km"]} km</li>
                        <li>Power Lines: {metrics["infrastructure_impact"]["power_lines_km"]} km</li>
                    </ul>
                </div>
                
                <div class="metric-row">
                    <span class="metric-heading">Estimated Recovery Time:</span> {metrics["recovery_estimate_months"]} months
                </div>
            </div>
            
            <p><small>Generated by Wildfire Prediction & Response System</small></p>
        </body>
        </html>
        """
        
        # Generate a unique identifier for the assessment
        assessment_id = str(uuid.uuid4())
        
        # S3 key for the HTML file
        s3_key = f"damage-assessments/assessment-{assessment_id}.html"
        
        try:
            # Upload HTML to S3
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=s3_key,
                Body=html_content,
                ContentType="text/html"
            )
            
            # Generate URL
            url = f"https://{S3_BUCKET}.s3.amazonaws.com/{s3_key}"
            logger.info(f"Uploaded damage assessment map to {url}")
            
            return url
        except Exception as e:
            logger.error(f"Error uploading damage assessment map: {str(e)}")
            return "https://example.com/error-generating-map"


def handler(event, context):
    """
    AWS Lambda handler for damage assessment.
    
    Args:
        event: AWS Lambda event
        context: AWS Lambda context
        
    Returns:
        Dict with assessment results
    """
    logger.info("Starting damage assessment")
    start_time = time.time()
    
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Get fire area
        fire_area = body.get("fire_area", [])
        if not fire_area or len(fire_area) < 3:
            raise ValueError("Invalid fire area. Must provide at least 3 points.")
        
        # Get pre and post fire dates
        pre_fire_date = body.get("pre_fire_date")
        post_fire_date = body.get("post_fire_date")
        
        if not pre_fire_date or not post_fire_date:
            raise ValueError("Must provide pre_fire_date and post_fire_date")
        
        # Create damage assessment
        assessment = DamageAssessment(
            fire_area=fire_area,
            pre_fire_date=pre_fire_date,
            post_fire_date=post_fire_date
        )
        
        # Run assessment
        results = assessment.assess_damage()
        
        processing_time = time.time() - start_time
        logger.info(f"Damage assessment completed in {processing_time:.2f} seconds")
        
        return {
            "statusCode": 200,
            "body": json.dumps(results),
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in damage assessment: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            }),
            "headers": {
                "Content-Type": "application/json"
            }
        } 