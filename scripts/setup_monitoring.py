#!/usr/bin/env python
"""
Setup monitoring for the Wildfire Prediction System using UptimeRobot.
This script creates monitors for the API endpoints and sets up alert contacts.
"""

import os
import sys
import json
import logging
import requests
from typing import Dict, List, Optional, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("monitoring-setup")

# UptimeRobot API constants
UPTIME_ROBOT_API_URL = "https://api.uptimerobot.com/v2"
MONITOR_TYPE_HTTP = 1
MONITOR_TYPE_KEYWORD = 2
MONITOR_SUBTYPE_HTTP = 1
MONITOR_SUBTYPE_HTTPS = 2
ALERT_TYPE_EMAIL = 2
ALERT_TYPE_SMS = 3
ALERT_TYPE_WEBHOOK = 4

class UptimeRobotMonitoring:
    """
    Class to handle setting up monitoring with UptimeRobot.
    """
    
    def __init__(self, api_key: str, api_gateway_url: str):
        """
        Initialize the UptimeRobot monitoring setup.
        
        Args:
            api_key: UptimeRobot API key
            api_gateway_url: Base URL of the API Gateway
        """
        self.api_key = api_key
        self.api_gateway_url = api_gateway_url
        self.headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        }
        
        # Validate inputs
        if not api_key:
            raise ValueError("UptimeRobot API key is required")
        if not api_gateway_url:
            raise ValueError("API Gateway URL is required")
            
        logger.info(f"Initializing UptimeRobot monitoring for {api_gateway_url}")
    
    def _make_request(self, endpoint: str, method: str = "POST", data: Optional[Dict] = None) -> Dict:
        """
        Make a request to the UptimeRobot API.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            data: Request data
            
        Returns:
            Response data
        """
        url = f"{UPTIME_ROBOT_API_URL}/{endpoint}"
        
        if data is None:
            data = {}
        
        # Add API key to data
        data["api_key"] = self.api_key
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=self.headers, params=data)
            else:
                response = requests.post(url, headers=self.headers, json=data)
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making request to UptimeRobot API: {e}")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Response: {e.response.text}")
            raise
    
    def get_monitors(self) -> List[Dict]:
        """
        Get all monitors.
        
        Returns:
            List of monitors
        """
        logger.info("Getting existing monitors")
        response = self._make_request("getMonitors", method="POST")
        return response.get("monitors", [])
    
    def create_monitor(
        self, 
        name: str, 
        url: str, 
        type: int = MONITOR_TYPE_HTTP,
        subtype: int = MONITOR_SUBTYPE_HTTPS,
        keyword_type: Optional[int] = None,
        keyword_value: Optional[str] = None,
        alert_contacts: Optional[str] = None
    ) -> Dict:
        """
        Create a new monitor.
        
        Args:
            name: Monitor name
            url: URL to monitor
            type: Monitor type
            subtype: Monitor subtype
            keyword_type: Keyword type for keyword monitors
            keyword_value: Keyword value for keyword monitors
            alert_contacts: Alert contact IDs
            
        Returns:
            Response data
        """
        logger.info(f"Creating monitor for {name} at {url}")
        
        data = {
            "friendly_name": name,
            "url": url,
            "type": type,
            "sub_type": subtype,
        }
        
        if keyword_type is not None and keyword_value is not None:
            data["keyword_type"] = keyword_type
            data["keyword_value"] = keyword_value
            
        if alert_contacts:
            data["alert_contacts"] = alert_contacts
            
        return self._make_request("newMonitor", data=data)
    
    def create_alert_contact(self, type: int, value: str, friendly_name: str) -> Dict:
        """
        Create a new alert contact.
        
        Args:
            type: Alert contact type
            value: Alert contact value (email, phone, webhook URL)
            friendly_name: Alert contact name
            
        Returns:
            Response data
        """
        logger.info(f"Creating alert contact: {friendly_name}")
        
        data = {
            "type": type,
            "value": value,
            "friendly_name": friendly_name
        }
        
        return self._make_request("newAlertContact", data=data)
    
    def setup_api_monitoring(self) -> None:
        """
        Set up monitoring for the API endpoints.
        """
        # Define endpoints to monitor
        endpoints = [
            {"name": "Health Check", "path": "/health", "keyword": "status"},
            {"name": "Risk Prediction API", "path": "/api/v1/risk-prediction", "keyword": None},
            {"name": "Fire Spread API", "path": "/api/v1/fire-spread", "keyword": None},
            {"name": "Damage Assessment API", "path": "/api/v1/damage-assessment", "keyword": None}
        ]
        
        # Get existing monitors to avoid duplicates
        existing_monitors = self.get_monitors()
        existing_urls = [monitor.get("url") for monitor in existing_monitors]
        
        # Create monitors for each endpoint
        for endpoint in endpoints:
            url = f"{self.api_gateway_url.rstrip('/')}{endpoint['path']}"
            
            # Skip if monitor already exists
            if url in existing_urls:
                logger.info(f"Monitor for {url} already exists, skipping")
                continue
            
            # Create HTTP monitor
            if endpoint["keyword"] is None:
                self.create_monitor(
                    name=f"Wildfire System - {endpoint['name']}",
                    url=url,
                    type=MONITOR_TYPE_HTTP,
                    subtype=MONITOR_SUBTYPE_HTTPS
                )
            # Create keyword monitor
            else:
                self.create_monitor(
                    name=f"Wildfire System - {endpoint['name']}",
                    url=url,
                    type=MONITOR_TYPE_KEYWORD,
                    keyword_type=2,  # Exists
                    keyword_value=endpoint["keyword"]
                )
                
        logger.info("API monitoring setup complete")

def main():
    """
    Main function to set up monitoring.
    """
    # Get environment variables
    api_key = os.environ.get("UPTIME_ROBOT_API_KEY")
    api_gateway_url = os.environ.get("API_GATEWAY_URL")
    
    if not api_key:
        logger.error("UPTIME_ROBOT_API_KEY environment variable is required")
        sys.exit(1)
    
    if not api_gateway_url:
        logger.error("API_GATEWAY_URL environment variable is required")
        sys.exit(1)
    
    try:
        # Initialize monitoring
        monitoring = UptimeRobotMonitoring(api_key, api_gateway_url)
        
        # Set up API monitoring
        monitoring.setup_api_monitoring()
        
        logger.info("Monitoring setup completed successfully")
    except Exception as e:
        logger.error(f"Error setting up monitoring: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 