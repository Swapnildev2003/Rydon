import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { FiRefreshCw, FiClock, FiNavigation } from 'react-icons/fi';

const LiveVehicleTrackingView = ({ vehicleId }) => {
  const [vehiclePosition, setVehiclePosition] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket(`wss://your-api.com/vehicles/${vehicleId}/tracking`);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsTracking(true);
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newPosition = {
          lat: data.latitude,
          lng: data.longitude,
          timestamp: new Date(data.timestamp)
        };
        
        setVehiclePosition(newPosition);
        setLastUpdated(new Date(data.timestamp));
        setRouteHistory(prev => [...prev.slice(-100), newPosition]); // Keep last 100 points
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsTracking(false);
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsTracking(false);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [vehicleId]);

  // Center map on vehicle position when it updates
  useEffect(() => {
    if (vehiclePosition && mapRef.current) {
      mapRef.current.panTo({
        lat: vehiclePosition.lat,
        lng: vehiclePosition.lng
      });
    }
  }, [vehiclePosition]);

  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  const center = vehiclePosition || { lat: 0, lng: 0 };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Live Vehicle Tracking</h2>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${isTracking ? 'text-green-500' : 'text-red-500'}`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isTracking ? 'Live' : 'Disconnected'}
          </div>
          {lastUpdated && (
            <div className="flex items-center text-sm text-gray-500">
              <FiClock className="mr-1" />
              {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={16}
          onLoad={map => {
            mapRef.current = map;
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Vehicle marker */}
          {vehiclePosition && (
            <Marker
              position={{ lat: vehiclePosition.lat, lng: vehiclePosition.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#EF4444',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
              }}
            />
          )}

          {/* Route history */}
          {routeHistory.length > 1 && (
            <Polyline
              path={routeHistory.map(point => ({
                lat: point.lat,
                lng: point.lng
              }))}
              options={{
                strokeColor: '#3B82F6',
                strokeWeight: 3,
                strokeOpacity: 0.7
              }}
            />
          )}
        </GoogleMap>

        {vehiclePosition && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md">
            <div className="font-medium">Vehicle Position</div>
            <div className="flex items-center text-sm text-gray-500">
              <FiNavigation className="mr-1" />
              {vehiclePosition.lat.toFixed(6)}, {vehiclePosition.lng.toFixed(6)}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <FiClock className="mr-1" />
              {vehiclePosition.timestamp.toLocaleTimeString()}
            </div>
            <div className="mt-2 text-xs">
              Speed: 45 km/h (sample)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveVehicleTrackingView;
