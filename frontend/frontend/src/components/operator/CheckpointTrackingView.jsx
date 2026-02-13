import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const CheckpointTrackingView = ({ routeId }) => {
  const [checkpoints, setCheckpoints] = useState([]);
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  // Fetch checkpoints for the route
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const response = await fetch(`/api/routes/${routeId}/checkpoints`);
        const data = await response.json();
        setCheckpoints(data);
        if (data.length > 0) {
          setCenter({ lat: data[0].lat, lng: data[0].lng });
        }
      } catch (error) {
        console.error('Error fetching checkpoints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckpoints();
  }, [routeId]);

  const handleNextCheckpoint = () => {
    if (currentCheckpointIndex < checkpoints.length - 1) {
      const newIndex = currentCheckpointIndex + 1;
      setCurrentCheckpointIndex(newIndex);
      setCenter(checkpoints[newIndex]);
    }
  };

  const handlePrevCheckpoint = () => {
    if (currentCheckpointIndex > 0) {
      const newIndex = currentCheckpointIndex - 1;
      setCurrentCheckpointIndex(newIndex);
      setCenter(checkpoints[newIndex]);
    }
  };

  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  if (loading) return <div className="text-center py-8">Loading checkpoints...</div>;
  if (checkpoints.length === 0) return <div className="text-center py-8">No checkpoints available</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Checkpoint Tracking</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handlePrevCheckpoint}
            disabled={currentCheckpointIndex === 0}
            className="p-2 bg-gray-100 rounded-full disabled:opacity-50"
          >
            <FiChevronLeft />
          </button>
          <span className="px-4 py-2">
            {currentCheckpointIndex + 1} / {checkpoints.length}
          </span>
          <button 
            onClick={handleNextCheckpoint}
            disabled={currentCheckpointIndex === checkpoints.length - 1}
            className="p-2 bg-gray-100 rounded-full disabled:opacity-50"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
          onLoad={map => setMap(map)}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false
          }}
        >
          {/* Render all checkpoints as gray markers */}
          {checkpoints.map((checkpoint, index) => (
            <Marker
              key={index}
              position={{ lat: checkpoint.lat, lng: checkpoint.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: index <= currentCheckpointIndex ? '#3B82F6' : '#9CA3AF',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
              }}
            />
          ))}

          {/* Draw line between checkpoints */}
          {checkpoints.length > 1 && (
            <Polyline
              path={checkpoints.slice(0, currentCheckpointIndex + 1).map(cp => ({
                lat: cp.lat,
                lng: cp.lng
              }))}
              options={{
                strokeColor: '#3B82F6',
                strokeWeight: 4,
                strokeOpacity: 0.8
              }}
            />
          )}

          {/* Highlight current checkpoint */}
          {checkpoints[currentCheckpointIndex] && (
            <Marker
              position={{
                lat: checkpoints[currentCheckpointIndex].lat,
                lng: checkpoints[currentCheckpointIndex].lng
              }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#10B981',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
              }}
            />
          )}
        </GoogleMap>

        <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow-md">
          <div className="font-medium">Current Checkpoint:</div>
          <div>{checkpoints[currentCheckpointIndex]?.address || 'N/A'}</div>
          <div className="text-sm text-gray-500">
            {checkpoints[currentCheckpointIndex]?.lat?.toFixed(6)}, {checkpoints[currentCheckpointIndex]?.lng?.toFixed(6)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckpointTrackingView;
