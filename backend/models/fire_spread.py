import os
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple, Optional, Union
import math

import boto3
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, Polygon, LineString, MultiPolygon
import pyproj
from pyproj import Transformer
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
S3_BUCKET = os.environ.get("S3_BUCKET", "wildfire-data-dev-us-west-2")
REGION = os.environ.get("REGION", "us-west-2")
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")

# Initialize AWS clients
s3_client = boto3.client("s3", region_name=REGION)


class FireSpreadSimulator:
    """Cellular automata based fire spread simulator."""
    
    def __init__(
        self, 
        ignition_points: List[Dict[str, Any]], 
        bounds: Dict[str, float],
        resolution_meters: int = 500,
        simulation_hours: int = 24,
        time_step_minutes: int = 30,
        weather_data: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize the fire spread simulator.
        
        Args:
            ignition_points: List of fire ignition points with location, intensity, and detection time
            bounds: Geographic bounds of the simulation area (min_lat, min_lon, max_lat, max_lon)
            resolution_meters: Resolution in meters for the simulation grid
            simulation_hours: Number of hours to simulate
            time_step_minutes: Time step in minutes for the simulation
            weather_data: Weather data for the simulation period
        """
        self.ignition_points = ignition_points
        self.bounds = bounds
        self.resolution_meters = resolution_meters
        self.simulation_hours = simulation_hours
        self.time_step_minutes = time_step_minutes
        self.weather_data = weather_data or {}
        
        # Calculate grid dimensions
        self.grid_setup()
        
        # Initialize the simulation grid
        self.init_grid()
        
        # Set up fuel model parameters (simplified for the MVP)
        self.setup_fuel_parameters()
        
        # Set up wind and terrain effects
        self.setup_wind_and_terrain()
        
    def grid_setup(self):
        """Set up the simulation grid based on geographic bounds and resolution."""
        # Convert lat/lon bounds to UTM for a regular grid
        self.utm_zone = int((self.bounds["min_lon"] + self.bounds["max_lon"]) / 2 / 6) + 31
        self.proj_wgs84 = pyproj.CRS("EPSG:4326")  # WGS84 lat/lon
        self.proj_utm = pyproj.CRS(f"+proj=utm +zone={self.utm_zone} +datum=WGS84 +units=m +no_defs")
        
        self.transformer_to_utm = Transformer.from_crs(self.proj_wgs84, self.proj_utm, always_xy=True)
        self.transformer_to_wgs84 = Transformer.from_crs(self.proj_utm, self.proj_wgs84, always_xy=True)
        
        # Convert bounds to UTM
        min_x, min_y = self.transformer_to_utm.transform(self.bounds["min_lon"], self.bounds["min_lat"])
        max_x, max_y = self.transformer_to_utm.transform(self.bounds["max_lon"], self.bounds["max_lat"])
        
        # Calculate grid dimensions
        self.x_size = int((max_x - min_x) / self.resolution_meters) + 1
        self.y_size = int((max_y - min_y) / self.resolution_meters) + 1
        
        # Store UTM bounds
        self.utm_bounds = {
            "min_x": min_x,
            "min_y": min_y,
            "max_x": max_x,
            "max_y": max_y
        }
        
        logger.info(f"Grid dimensions: {self.x_size} x {self.y_size} cells")
        
    def init_grid(self):
        """Initialize the simulation grid."""
        # Fire state grid (0 = unburned, 0-1 = burning intensity, -1 = burned out)
        self.fire_grid = np.zeros((self.y_size, self.x_size), dtype=np.float32)
        
        # Fuel grid (simplified for MVP: 1 = burnable, 0 = non-burnable)
        self.fuel_grid = np.ones((self.y_size, self.x_size), dtype=np.float32)
        
        # Terrain grid (elevation in meters)
        self.elevation_grid = np.zeros((self.y_size, self.x_size), dtype=np.float32)
        
        # Slope grid (derived from elevation, in degrees)
        self.slope_grid = np.zeros((self.y_size, self.x_size), dtype=np.float32)
        
        # Aspect grid (derived from elevation, in degrees from North)
        self.aspect_grid = np.zeros((self.y_size, self.x_size), dtype=np.float32)
        
        # Fuel moisture grid (simplified for MVP: uniform value)
        self.moisture_grid = np.full((self.y_size, self.x_size), 0.1, dtype=np.float32)
        
        # Add ignition points to the grid
        self.add_ignition_points()
        
        # History of fire state at each time step
        self.history = {}
        
        # Time step counter
        self.current_step = 0
        self.current_time = None
        
    def latlon_to_grid(self, lat: float, lon: float) -> Tuple[int, int]:
        """
        Convert lat/lon coordinates to grid indices.
        
        Args:
            lat: Latitude
            lon: Longitude
            
        Returns:
            Tuple of (row, col) grid indices
        """
        x, y = self.transformer_to_utm.transform(lon, lat)
        
        # Calculate grid indices
        col = int((x - self.utm_bounds["min_x"]) / self.resolution_meters)
        row = int((y - self.utm_bounds["min_y"]) / self.resolution_meters)
        
        # Ensure within grid bounds
        col = max(0, min(col, self.x_size - 1))
        row = max(0, min(row, self.y_size - 1))
        
        return row, col
    
    def grid_to_latlon(self, row: int, col: int) -> Tuple[float, float]:
        """
        Convert grid indices to lat/lon coordinates.
        
        Args:
            row: Grid row index
            col: Grid column index
            
        Returns:
            Tuple of (lat, lon) coordinates
        """
        # Calculate UTM coordinates of grid cell center
        x = self.utm_bounds["min_x"] + col * self.resolution_meters + self.resolution_meters / 2
        y = self.utm_bounds["min_y"] + row * self.resolution_meters + self.resolution_meters / 2
        
        # Convert to lat/lon
        lon, lat = self.transformer_to_wgs84.transform(x, y)
        
        return lat, lon
    
    def add_ignition_points(self):
        """Add ignition points to the grid."""
        earliest_time = None
        
        for point in self.ignition_points:
            # Get grid coordinates
            lat = point["location"]["latitude"]
            lon = point["location"]["longitude"]
            row, col = self.latlon_to_grid(lat, lon)
            
            # Set initial fire intensity at ignition point
            intensity = point["intensity"]
            self.fire_grid[row, col] = min(1.0, intensity / 100.0)  # Normalize to 0-1
            
            # Track earliest detection time to use as simulation start time
            detection_time = datetime.fromisoformat(point["detection_time"].replace('Z', '+00:00'))
            if earliest_time is None or detection_time < earliest_time:
                earliest_time = detection_time
        
        # Set start time for simulation
        self.current_time = earliest_time or datetime.utcnow()
        
        logger.info(f"Added {len(self.ignition_points)} ignition points. Start time: {self.current_time}")
    
    def setup_fuel_parameters(self):
        """Set up fuel model parameters (simplified for the MVP)."""
        # Simplified fuel parameters based on Rothermel's model
        # These would normally vary across the landscape based on vegetation types
        
        # Fuel bed depth (m)
        self.fuel_depth = 0.3
        
        # Surface area to volume ratio (1/m)
        self.fuel_sav = 5000
        
        # Fuel load (kg/m²)
        self.fuel_load = 1.0
        
        # Heat content (J/kg)
        self.heat_content = 18000000
        
        # Moisture of extinction (fraction)
        self.moisture_extinction = 0.3
        
        logger.info("Set up simplified fuel parameters")
    
    def setup_wind_and_terrain(self):
        """Set up wind and terrain effects from weather data and elevation."""
        # Default wind speed and direction if not available
        self.wind_speed = 5.0  # m/s
        self.wind_direction = 0.0  # degrees (from North)
        
        # If weather data is available, use it
        if self.weather_data and "current" in self.weather_data:
            self.wind_speed = self.weather_data["current"].get("wind_speed", 5.0)
            self.wind_direction = self.weather_data["current"].get("wind_direction", 0.0)
        
        # Simplified terrain effect (could be enhanced with actual DEM data)
        # For MVP, we'll generate a random terrain with some hills
        
        # Generate a simple elevation model
        x = np.linspace(0, 1, self.x_size)
        y = np.linspace(0, 1, self.y_size)
        X, Y = np.meshgrid(x, y)
        
        # Add some random hills
        for _ in range(5):
            hill_x = np.random.uniform(0, 1)
            hill_y = np.random.uniform(0, 1)
            hill_height = np.random.uniform(100, 500)
            hill_width = np.random.uniform(0.1, 0.3)
            
            self.elevation_grid += hill_height * np.exp(-((X - hill_x)**2 + (Y - hill_y)**2) / hill_width**2)
        
        # Calculate slope and aspect
        gradient_y, gradient_x = np.gradient(self.elevation_grid, self.resolution_meters)
        self.slope_grid = np.degrees(np.arctan(np.sqrt(gradient_x**2 + gradient_y**2)))
        self.aspect_grid = np.degrees(np.arctan2(-gradient_x, gradient_y))
        # Convert to 0-360 degrees
        self.aspect_grid = (self.aspect_grid + 360) % 360
        
        logger.info(f"Set up wind (speed: {self.wind_speed} m/s, direction: {self.wind_direction}°) and terrain")
    
    def calculate_spread_rate(self, row: int, col: int) -> Tuple[float, Dict[str, float]]:
        """
        Calculate fire spread rate for a cell using Rothermel's equations.
        
        Args:
            row: Grid row index
            col: Grid column index
            
        Returns:
            Tuple of (spread_rate, spread_directions)
        """
        # Skip if cell is not burning
        if self.fire_grid[row, col] <= 0:
            return 0.0, {}
        
        # Get cell parameters
        fuel = self.fuel_grid[row, col]
        moisture = self.moisture_grid[row, col]
        slope = self.slope_grid[row, col]
        aspect = self.aspect_grid[row, col]
        
        # Skip if no fuel or moisture above extinction
        if fuel <= 0 or moisture >= self.moisture_extinction:
            return 0.0, {}
        
        # ------ Simplified Rothermel's fire spread model ------
        
        # Calculate reaction intensity
        moisture_damping = 1.0 - 2.59 * (moisture / self.moisture_extinction) + 5.11 * (moisture / self.moisture_extinction)**2
        moisture_damping = max(0.0, min(1.0, moisture_damping))
        
        reaction_intensity = self.fuel_load * self.heat_content * moisture_damping
        
        # Base spread rate (m/min)
        base_spread = 0.048 * reaction_intensity / (self.fuel_load * self.fuel_sav)
        
        # Wind effect
        # Convert wind direction from meteorological (from) to mathematical (to)
        wind_dir_math = (self.wind_direction + 180) % 360
        wind_dir_rad = np.radians(wind_dir_math)
        
        # Wind factor using empirical formula
        wind_factor = 1.0 + 0.5 * self.wind_speed
        
        # Slope effect
        # Maximum effect is in the upslope direction (aspect)
        slope_factor = 1.0 + 0.2 * slope
        
        # Directional spread rates based on wind, slope, and direction
        spread_directions = {}
        
        # Calculate spread in 8 directions (N, NE, E, SE, S, SW, W, NW)
        for direction, azimuth in [
            ('N', 0), ('NE', 45), ('E', 90), ('SE', 135),
            ('S', 180), ('SW', 225), ('W', 270), ('NW', 315)
        ]:
            # Convert to radians
            azimuth_rad = np.radians(azimuth)
            
            # Wind effect in this direction
            wind_effect = wind_factor * max(0, np.cos(azimuth_rad - wind_dir_rad))
            
            # Slope effect in this direction
            slope_direction_effect = 1.0
            if slope > 0:
                # Maximum effect is in the upslope direction (aspect)
                aspect_rad = np.radians(aspect)
                slope_effect = slope_factor * max(0, np.cos(azimuth_rad - aspect_rad))
                slope_direction_effect = 1.0 + 0.5 * slope_effect
            
            # Combined effect
            direction_factor = max(1.0, wind_effect * slope_direction_effect)
            
            # Spread rate in this direction (m/min)
            spread_directions[direction] = base_spread * direction_factor
        
        # Maximum spread rate
        max_spread = max(spread_directions.values())
        
        return max_spread, spread_directions
    
    def step(self) -> bool:
        """
        Run one time step of the simulation.
        
        Returns:
            Boolean indicating if the fire is still burning
        """
        # Advance time
        self.current_time += timedelta(minutes=self.time_step_minutes)
        self.current_step += 1
        
        # Save current state
        self.history[self.current_time.isoformat()] = self.fire_grid.copy()
        
        # Skip if we've reached the simulation end time
        if self.current_step * self.time_step_minutes >= self.simulation_hours * 60:
            logger.info(f"Reached simulation end time: {self.current_time}")
            return False
        
        # Create a new grid for the next state
        new_grid = self.fire_grid.copy()
        
        # Flag to check if fire is still burning
        still_burning = False
        
        # Iterate through burning cells
        burning_indices = np.where((self.fire_grid > 0) & (self.fire_grid < 1))
        for i in range(len(burning_indices[0])):
            row, col = burning_indices[0][i], burning_indices[1][i]
            
            # Calculate spread rate
            spread_rate, spread_directions = self.calculate_spread_rate(row, col)
            
            # If no spread, skip
            if spread_rate <= 0:
                continue
            
            # Flag that fire is still burning
            still_burning = True
            
            # Increase burning intensity in current cell
            new_grid[row, col] = min(1.0, new_grid[row, col] + 0.1)
            
            # If fully burned, mark as burned out
            if new_grid[row, col] >= 0.95:
                new_grid[row, col] = -1  # Burned out
            
            # Calculate spread distance for this time step
            spread_distance_meters = spread_rate * self.time_step_minutes
            spread_distance_cells = spread_distance_meters / self.resolution_meters
            
            # Spread to neighbors based on directional spread rates
            for direction, dir_spread_rate in spread_directions.items():
                # Skip if no spread in this direction
                if dir_spread_rate <= 0:
                    continue
                
                # Calculate spread distance in this direction
                dir_spread_distance = dir_spread_rate * self.time_step_minutes / self.resolution_meters
                
                # Get neighbor coordinates
                d_row, d_col = 0, 0
                if 'N' in direction:
                    d_row = -1
                if 'S' in direction:
                    d_row = 1
                if 'E' in direction:
                    d_col = 1
                if 'W' in direction:
                    d_col = -1
                
                # Calculate neighbor coordinates
                n_row, n_col = row + d_row, col + d_col
                
                # Skip if out of bounds
                if n_row < 0 or n_row >= self.y_size or n_col < 0 or n_col >= self.x_size:
                    continue
                
                # Skip if already burned out
                if self.fire_grid[n_row, n_col] < 0:
                    continue
                
                # Skip if no fuel
                if self.fuel_grid[n_row, n_col] <= 0:
                    continue
                
                # Calculate probability of spread
                spread_prob = min(1.0, dir_spread_distance / math.sqrt(d_row**2 + d_col**2))
                
                # Apply spread with probability
                if np.random.random() < spread_prob:
                    # Start a new fire at the neighbor with intensity proportional to spread rate
                    new_intensity = min(0.5, self.fire_grid[row, col] * dir_spread_rate / spread_rate)
                    
                    # Only set if greater than current value and not burned out
                    if new_grid[n_row, n_col] >= 0 and new_intensity > new_grid[n_row, n_col]:
                        new_grid[n_row, n_col] = new_intensity
                        still_burning = True
        
        # Update grid
        self.fire_grid = new_grid
        
        logger.info(f"Completed step {self.current_step} at {self.current_time}, still burning: {still_burning}")
        
        return still_burning
    
    def run_simulation(self) -> Dict[str, Any]:
        """
        Run the full simulation for the specified number of hours.
        
        Returns:
            Dict with simulation results
        """
        logger.info(f"Starting fire spread simulation for {self.simulation_hours} hours")
        start_time = time.time()
        
        # Run simulation steps until fire stops or time limit is reached
        step_count = 0
        still_burning = True
        while still_burning and step_count < (self.simulation_hours * 60 / self.time_step_minutes):
            still_burning = self.step()
            step_count += 1
        
        simulation_time = time.time() - start_time
        logger.info(f"Completed {step_count} simulation steps in {simulation_time:.2f} seconds")
        
        # Generate results
        results = self.generate_results()
        
        return results
    
    def extract_perimeters(self, grid: np.ndarray) -> List[List[Dict[str, float]]]:
        """
        Extract fire perimeters from the grid as geojson-compatible coordinates.
        
        Args:
            grid: Fire state grid
            
        Returns:
            List of fire perimeter polygons as lists of coordinate pairs
        """
        # Create a binary grid of burning/burned cells
        binary_grid = (grid > 0) | (grid < 0)
        
        # Find contiguous regions (simplified approach)
        perimeters = []
        
        # Generate a simplified perimeter by finding the edge cells
        # This is a simplified approach - in a real implementation, you would use
        # a proper contour-finding algorithm or polygonization technique
        
        # Find all cells that are burning or burned
        rows, cols = np.where(binary_grid)
        
        # If no fire, return empty list
        if len(rows) == 0:
            return []
        
        # Create a list of (lat, lon) coordinates for each fire cell
        fire_cells = []
        for i in range(len(rows)):
            lat, lon = self.grid_to_latlon(rows[i], cols[i])
            fire_cells.append((lat, lon))
        
        # Use a convex hull as a simple perimeter (this is an oversimplification)
        # In a real implementation, you would use a more sophisticated algorithm
        try:
            from scipy.spatial import ConvexHull
            import matplotlib.path as mpath
            
            # Create a convex hull of the fire cells
            points = np.array(fire_cells)
            hull = ConvexHull(points)
            
            # Convert hull vertices to polygon
            perimeter = []
            for vertex_idx in hull.vertices:
                lat, lon = points[vertex_idx]
                perimeter.append({"latitude": lat, "longitude": lon})
            
            # Close the polygon
            perimeter.append(perimeter[0])
            
            perimeters.append(perimeter)
            
        except Exception as e:
            logger.error(f"Error extracting perimeter: {str(e)}")
            
            # Fallback: Just return a bounding box of the fire
            min_lat = min(lat for lat, _ in fire_cells)
            max_lat = max(lat for lat, _ in fire_cells)
            min_lon = min(lon for _, lon in fire_cells)
            max_lon = max(lon for _, lon in fire_cells)
            
            perimeter = [
                {"latitude": min_lat, "longitude": min_lon},
                {"latitude": min_lat, "longitude": max_lon},
                {"latitude": max_lat, "longitude": max_lon},
                {"latitude": max_lat, "longitude": min_lon},
                {"latitude": min_lat, "longitude": min_lon}  # Close the polygon
            ]
            
            perimeters.append(perimeter)
        
        return perimeters
    
    def generate_results(self) -> Dict[str, Any]:
        """
        Generate formatted results from the simulation.
        
        Returns:
            Dict with simulation results
        """
        # Generate perimeters at several time points
        perimeters = {}
        intensity_grid = {}
        
        # Use a subset of history for performance
        num_steps = len(self.history)
        if num_steps > 10:
            # Use approximately 10 time points
            step_size = max(1, num_steps // 10)
            time_points = list(self.history.keys())[::step_size]
        else:
            time_points = list(self.history.keys())
        
        # Add final time point if not included
        if list(self.history.keys())[-1] not in time_points:
            time_points.append(list(self.history.keys())[-1])
        
        # Extract perimeters for each time point
        for time_str in time_points:
            # Extract perimeter
            perimeter = self.extract_perimeters(self.history[time_str])
            perimeters[time_str] = perimeter
            
            # Extract intensity grid (downsampled for performance)
            grid = self.history[time_str]
            # Replace negative values (burned out) with 1.0 for visualization
            vis_grid = grid.copy()
            vis_grid[vis_grid < 0] = 1.0
            
            # Downsample grid if larger than 100x100
            if self.x_size > 100 or self.y_size > 100:
                # Calculate downsampling factor
                factor = max(1, max(self.x_size, self.y_size) // 100)
                downsampled = vis_grid[::factor, ::factor]
                intensity_grid[time_str] = downsampled.tolist()
            else:
                intensity_grid[time_str] = vis_grid.tolist()
        
        # Calculate fire statistics
        initial_grid = list(self.history.values())[0]
        final_grid = list(self.history.values())[-1]
        
        # Count initially burning cells
        initial_burning = np.sum(initial_grid > 0)
        
        # Count cells that burned during the simulation
        ever_burned = np.sum((final_grid > 0) | (final_grid < 0))
        
        # Calculate area burned
        area_burned = ever_burned * (self.resolution_meters / 1000)**2  # in sq km
        
        # Metadata about the simulation
        metadata = {
            "model_version": "1.0.0",
            "simulation_start_time": list(self.history.keys())[0],
            "simulation_end_time": list(self.history.keys())[-1],
            "resolution_meters": self.resolution_meters,
            "grid_size": {
                "width": self.x_size,
                "height": self.y_size
            },
            "bounds": self.bounds,
            "weather_conditions": {
                "wind_speed": self.wind_speed,
                "wind_direction": self.wind_direction,
                "relative_humidity": self.weather_data.get("current", {}).get("relative_humidity", 50),
                "temperature": self.weather_data.get("current", {}).get("temperature", 25)
            },
            "fuel_parameters": {
                "fuel_depth": self.fuel_depth,
                "fuel_load": self.fuel_load,
                "moisture": self.moisture_grid[0, 0]  # Just use the first cell as an example
            },
            "fire_statistics": {
                "initial_burning_cells": int(initial_burning),
                "total_burned_cells": int(ever_burned),
                "area_burned_sqkm": float(area_burned),
                "time_steps_simulated": len(self.history),
                "simulation_duration_hours": self.simulation_hours
            }
        }
        
        return {
            "perimeters": perimeters,
            "intensity_grid": intensity_grid,
            "metadata": metadata
        }


def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get current weather data for a location from OpenWeatherMap API.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dict with weather data
    """
    logger.info(f"Fetching weather data for {lat}, {lon}")
    
    try:
        if WEATHER_API_KEY:
            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            weather_data = {
                "current": {
                    "temperature": data.get("main", {}).get("temp", 20.0),
                    "relative_humidity": data.get("main", {}).get("humidity", 50.0),
                    "wind_speed": data.get("wind", {}).get("speed", 5.0),
                    "wind_direction": data.get("wind", {}).get("deg", 0.0),
                    "precipitation": data.get("rain", {}).get("1h", 0.0) if "rain" in data else 0.0,
                    "pressure": data.get("main", {}).get("pressure", 1013.0)
                }
            }
            
            return weather_data
        else:
            # If no API key, generate simulated weather data
            logger.warning("No OpenWeatherMap API key provided, using simulated weather data")
            return generate_simulated_weather_data()
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        logger.warning("Using simulated weather data due to API error")
        return generate_simulated_weather_data()


def generate_simulated_weather_data() -> Dict[str, Any]:
    """
    Generate simulated weather data for demonstration purposes.
    
    Returns:
        Dict with simulated weather data
    """
    return {
        "current": {
            "temperature": 25.0 + np.random.normal(0, 2),
            "relative_humidity": 40.0 + np.random.normal(0, 5),
            "wind_speed": 4.0 + np.random.normal(0, 1),
            "wind_direction": np.random.uniform(0, 360),
            "precipitation": max(0, np.random.normal(0, 0.5)),
            "pressure": 1013.0 + np.random.normal(0, 2)
        }
    }


def calculate_bounds(ignition_points: List[Dict[str, Any]], radius_km: float) -> Dict[str, float]:
    """
    Calculate geographic bounds for the simulation area.
    
    Args:
        ignition_points: List of fire ignition points
        radius_km: Radius in kilometers around ignition points
        
    Returns:
        Dict with bounds (min_lat, min_lon, max_lat, max_lon)
    """
    # Initial bounds from ignition points
    min_lat = min(point["location"]["latitude"] for point in ignition_points)
    max_lat = max(point["location"]["latitude"] for point in ignition_points)
    min_lon = min(point["location"]["longitude"] for point in ignition_points)
    max_lon = max(point["location"]["longitude"] for point in ignition_points)
    
    # Add buffer based on radius
    # Approximate degrees per km (varies with latitude)
    lat_km = 1 / 111  # 1 degree latitude is approximately 111 km
    lon_km = 1 / (111 * np.cos(np.radians((min_lat + max_lat) / 2)))  # Varies with latitude
    
    # Add buffer
    min_lat -= radius_km * lat_km
    max_lat += radius_km * lat_km
    min_lon -= radius_km * lon_km
    max_lon += radius_km * lon_km
    
    return {
        "min_lat": min_lat,
        "max_lat": max_lat,
        "min_lon": min_lon,
        "max_lon": max_lon
    }


def handler(event, context):
    """
    AWS Lambda handler for fire spread simulation.
    
    Args:
        event: AWS Lambda event
        context: AWS Lambda context
        
    Returns:
        Dict with simulation results
    """
    logger.info("Starting fire spread simulation")
    start_time = time.time()
    
    try:
        # Parse request body
        body = json.loads(event.get("body", "{}"))
        
        # Get ignition points
        ignition_points = body.get("ignition_points", [])
        if not ignition_points:
            raise ValueError("No ignition points provided")
        
        # Get other parameters
        simulation_hours = int(body.get("simulation_hours", 24))
        resolution_meters = int(body.get("resolution_meters", 500))
        
        # Use first ignition point for weather data
        first_point = ignition_points[0]
        lat = first_point["location"]["latitude"]
        lon = first_point["location"]["longitude"]
        
        # Get weather data
        weather_data = get_weather_data(lat, lon)
        
        # Calculate bounds for simulation area
        bounds = calculate_bounds(ignition_points, 10.0)  # 10 km radius
        
        # Initialize simulator
        simulator = FireSpreadSimulator(
            ignition_points=ignition_points,
            bounds=bounds,
            resolution_meters=resolution_meters,
            simulation_hours=simulation_hours,
            time_step_minutes=30,  # 30-minute time steps
            weather_data=weather_data
        )
        
        # Run simulation
        results = simulator.run_simulation()
        
        processing_time = time.time() - start_time
        logger.info(f"Fire spread simulation completed in {processing_time:.2f} seconds")
        
        return {
            "statusCode": 200,
            "body": json.dumps(results),
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in fire spread simulation: {str(e)}")
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