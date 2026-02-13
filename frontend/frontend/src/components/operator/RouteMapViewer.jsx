import React, { useEffect, useState } from 'react';
import { GoogleMap, Polyline, Marker, DirectionsRenderer } from '@react-google-maps/api';

const RouteMapViewer = ({ 
  fromLocation,
  toLocation,
  polyline,
  checkpoints = [],
  onRouteCalculated
}) => {
  const [directions, setDirections] = useState(null);
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    if (fromLocation && toLocation && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: fromLocation,
          destination: toLocation,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            
            // Calculate center point
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].legs[0].steps.forEach(step => {
              bounds.extend(step.start_location);
              bounds.extend(step.end_location);
            });
            
            const center = bounds.getCenter();
            setCenter({ lat: center.lat(), lng: center.lng() });
            
            if (onRouteCalculated) {
              const leg = result.routes[0].legs[0];
              onRouteCalculated({
                distance: leg.distance.text,
                duration: leg.duration.text,
                polyline: result.routes[0].overview_polyline
              });
            }
          }
        }
      );
    }
  }, [fromLocation, toLocation, onRouteCalculated]);

  const containerStyle = {
    width: '100%',
    height: '400px'
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onLoad={map => setMap(map)}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: '#3B82F6',
                strokeWeight: 5,
                strokeOpacity: 0.8
              },
              suppressMarkers: true
            }}
          />
        )}
        
        {polyline && !directions && window.google?.maps?.geometry?.encoding && (
          <Polyline
            path={window.google.maps.geometry.encoding.decodePath(polyline)}
            options={{
              strokeColor: '#3B82F6',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }}
          />
        )}
        
        {/* Markers remain the same */}
        {fromLocation && (
          <Marker
            position={directions?.routes[0]?.legs[0]?.start_location || fromLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white'
            }}
          />
        )}
        
        {toLocation && (
          <Marker
            position={directions?.routes[0]?.legs[0]?.end_location || toLocation}
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
        
        {checkpoints.map((checkpoint, index) => (
          <Marker
            key={index}
            position={{ lat: checkpoint.lat, lng: checkpoint.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white'
            }}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default RouteMapViewer;
