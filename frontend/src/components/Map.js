import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-heat';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom component for updating map center
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Custom component for rendering heat map
function HeatmapLayer({ points, options }) {
  const map = useMap();
  const heatLayerRef = useRef(null);
  
  useEffect(() => {
    if (!map) return;
    
    // Remove previous heat layer if it exists
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    // Create new heat layer if points are available
    if (points && points.length > 0) {
      const defaultOptions = {
        radius: 20,
        blur: 15,
        maxZoom: 15,
        max: 1.0,
        gradient: {
          0.0: 'green',
          0.3: 'yellow',
          0.6: 'orange',
          0.8: 'red',
          1.0: 'purple'
        }
      };
      
      const heatLayer = L.heatLayer(points, { ...defaultOptions, ...options });
      heatLayer.addTo(map);
      heatLayerRef.current = heatLayer;
    }
    
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, options]);
  
  return null;
}

// Main Map Component
const Map = ({
  center = [37.7749, -122.4194], // Default to San Francisco
  zoom = 7,
  riskPoints = [],
  fires = [],
  predictionAreas = [],
  onMapClick
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // Transform risk points into heatmap format
  const heatmapPoints = riskPoints.map(point => [
    point.latitude || point.lat,
    point.longitude || point.lng,
    point.intensity || point.risk_score || 0.5
  ]);
  
  return (
    <div className="map-container" style={{ height: '600px', width: '100%' }}>
      <div className="map-controls" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px' }}>
        <label>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={() => setShowHeatmap(!showHeatmap)}
          />
          Show Risk Heatmap
        </label>
      </div>
      
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        onClick={onMapClick}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Map view updater */}
        <MapUpdater center={center} zoom={zoom} />
        
        {/* Risk heatmap layer */}
        {showHeatmap && riskPoints.length > 0 && (
          <HeatmapLayer points={heatmapPoints} />
        )}
        
        {/* Active fires markers */}
        {fires.map((fire, index) => (
          <Marker
            key={`fire-${index}`}
            position={[fire.latitude || fire.lat, fire.longitude || fire.lng]}
            icon={L.divIcon({
              className: 'fire-icon',
              html: `<div style="background-color: red; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div>
                <h4>Active Fire</h4>
                <p>Intensity: {fire.intensity || 'Unknown'}</p>
                <p>Detected: {fire.detection_time || 'Unknown'}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Prediction area circles */}
        {predictionAreas.map((area, index) => (
          <Circle
            key={`prediction-${index}`}
            center={[area.latitude || area.lat, area.longitude || area.lng]}
            radius={area.radius_meters || area.radius_km * 1000 || 10000}
            pathOptions={{
              color: area.color || '#0088cc',
              fillColor: area.color || '#0088cc',
              fillOpacity: 0.2
            }}
          >
            <Popup>
              <div>
                <h4>Prediction Area</h4>
                <p>Risk Score: {area.risk_score ? `${(area.risk_score * 100).toFixed(1)}%` : 'Unknown'}</p>
                {area.factors && (
                  <div>
                    <p>Contributing Factors:</p>
                    <ul>
                      {Object.entries(area.factors).map(([factor, value]) => (
                        <li key={factor}>{factor}: {value.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map; 