// components/operator/VehicleTracking.js
import React, { useState } from 'react';
import { FiMap, FiNavigation } from 'react-icons/fi';
import CheckpointTrackingView from './CheckpointTrackingView';
import LiveVehicleTrackingView from './LiveTrackingView';

const VehicleTracking = () => {
  const [viewMode, setViewMode] = useState('live');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

 
  const vehicles = [
    { id: 1, licensePlate: 'ABC-123', routeId: 101 },
    { id: 2, licensePlate: 'XYZ-789', routeId: 102 }
  ];

  const routes = [
    { id: 101, name: 'Downtown Express' },
    { id: 102, name: 'Uptown Loop' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Vehicle Tracking</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Vehicle</label>
            <select
              value={selectedVehicle || ''}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">Select a vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
            <select
              value={selectedRoute || ''}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">Select a route</option>
              {routes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('live')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg flex items-center ${
                viewMode === 'live' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiNavigation className="mr-2" />
              Live Tracking
            </button>
            <button
              onClick={() => setViewMode('checkpoint')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg flex items-center ${
                viewMode === 'checkpoint' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiMap className="mr-2" />
              Checkpoint Tracking
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'live' ? (
        <LiveVehicleTrackingView vehicleId={selectedVehicle} />
      ) : (
        <CheckpointTrackingView routeId={selectedRoute} />
      )}
    </div>
  );
};

export default VehicleTracking;
