import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchBusRoutes, 
  fetchCarRoutes, 
  fetchBikeRoutes,
  fetchBusCheckpoints,
  createBusRoute,
  updateBusRoute,
  deleteBusRoute,
  createBusCheckpoint,
  updateBusCheckpoint,
  deleteBusCheckpoint,
  createCarRoute,
  updateCarRoute,
  deleteCarRoute,
  createBikeRoute,
  updateBikeRoute,
  deleteBikeRoute,
  resetOperationStatus,
  clearCheckpoints
} from '../../redux/slices/routeSlice';
import RouteFormModal from './RouteFormModal';
import CheckpointFormModal from './CheckpointFormModal';
import RouteMapViewer from './RouteMapViewer';
import ConfirmationModal from './ConfirmationModal';
import { formatDate } from './dateUtils';
import { FiPlus, FiEdit2, FiTrash2, FiChevronDown, FiChevronUp, FiCalendar, FiClock, FiNavigation } from 'react-icons/fi';

const RouteManagement = () => {
  const dispatch = useDispatch();
  const {
    busRoutes = [],
    carRoutes = [],
    bikeRoutes = [],
    checkpoints = [],
    status,
    operationStatus,
    error = null
  } = useSelector(state => state.route);

  const [activeTab, setActiveTab] = useState('bus');
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [showCheckpointForm, setShowCheckpointForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [currentCheckpoint, setCurrentCheckpoint] = useState(null);
  const [actionType, setActionType] = useState('create');
  const [routeDetails, setRouteDetails] = useState(null);

  useEffect(() => {
    switch(activeTab) {
      case 'bus':
        dispatch(fetchBusRoutes());
        break;
      case 'car':
        dispatch(fetchCarRoutes());
        break;
      case 'bike':
        dispatch(fetchBikeRoutes());
        break;
      default:
        dispatch(fetchBusRoutes());
    }
    return () => {
      dispatch(resetOperationStatus());
    };
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (expandedRoute) {
      dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
    } else {
      dispatch(clearCheckpoints());
    }
  }, [dispatch, expandedRoute, operationStatus]); // Added operationStatus as dependency

  useEffect(() => {
    if (operationStatus === 'succeeded') {
      if (showRouteForm) setShowRouteForm(false);
      if (showCheckpointForm) setShowCheckpointForm(false);
      if (showDeleteConfirm) setShowDeleteConfirm(false);
      
      dispatch(resetOperationStatus());
      
      // Refresh checkpoints after any operation
      if (expandedRoute) {
        dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
      }
    }
  }, [operationStatus, dispatch, expandedRoute]);

  const getCurrentRoutes = () => {
    switch(activeTab) {
      case 'bus': return busRoutes;
      case 'car': return carRoutes;
      case 'bike': return bikeRoutes;
      default: return busRoutes;
    }
  };

  const getCurrentStatus = () => {
    return status[activeTab] || 'idle';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setExpandedRoute(null);
  };

  const handleRouteAction = (route, action) => {
    setCurrentRoute(route);
    setActionType(action);
    
    if (action === 'edit' || action === 'create') {
      setShowRouteForm(true);
    } else if (action === 'delete') {
      setShowDeleteConfirm(true);
    }
  };

  const handleCheckpointAction = (checkpoint, action) => {
    setCurrentCheckpoint(checkpoint);
    setActionType(action);
    
    if (action === 'edit' || action === 'create') {
      setShowCheckpointForm(true);
    } else if (action === 'delete') {
      setShowDeleteConfirm(true);
    }
  };

  const handleSubmitRoute = async (formData) => {
    const routeData = {
      ...formData,
      vehicle_type: activeTab,
      start_date: formData.start_date, 
      end_date: formData.end_date
    };

    try {
      if (actionType === 'create') {
        switch(activeTab) {
          case 'bus':
            await dispatch(createBusRoute(routeData));
            break;
          case 'car':
            await dispatch(createCarRoute(routeData));
            break;
          case 'bike':
            await dispatch(createBikeRoute(routeData));
            break;
        }
      } else {
        switch(activeTab) {
          case 'bus':
            await dispatch(updateBusRoute({ id: currentRoute.id, data: routeData }));
            break;
          case 'car':
            await dispatch(updateCarRoute({ id: currentRoute.id, data: routeData }));
            break;
          case 'bike':
            await dispatch(updateBikeRoute({ id: currentRoute.id, data: routeData }));
            break;
        }
      }
    } catch (error) {
      console.error('Error submitting route:', error);
    }
  };

  const handleSubmitCheckpoint = async (formData) => {
    const checkpointData = {
      ...formData,
      route: expandedRoute
    };

    try {
      if (actionType === 'create') {
        await dispatch(createBusCheckpoint(checkpointData));
        // Immediately refetch checkpoints after creation
        dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
      } else {
        await dispatch(updateBusCheckpoint({ 
          id: currentCheckpoint.id, 
          data: checkpointData 
        }));
        // Immediately refetch checkpoints after update
        dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
      }
    } catch (error) {
      console.error('Error submitting checkpoint:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (currentRoute) {
        switch(activeTab) {
          case 'bus':
            await dispatch(deleteBusRoute(currentRoute.id));
            break;
          case 'car':
            await dispatch(deleteCarRoute(currentRoute.id));
            break;
          case 'bike':
            await dispatch(deleteBikeRoute(currentRoute.id));
            break;
        }
      } else if (currentCheckpoint) {
        await dispatch(deleteBusCheckpoint(currentCheckpoint.id));
        // Immediately refetch checkpoints after deletion
        dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleRouteCalculated = (details) => {
    setRouteDetails(details);
  };

  const routes = getCurrentRoutes();
  const currentStatus = getCurrentStatus();

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header and Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Route Management</h2>
          <button
            onClick={() => {
              setCurrentRoute(null);
              setActionType('create');
              setShowRouteForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            disabled={operationStatus === 'loading'}
          >
            <FiPlus className="mr-2" /> Add New Route
          </button>
        </div>
        
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {['bus', 'car', 'bike'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                disabled={operationStatus === 'loading'}
              >
                {tab} Routes
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Loading and Error States */}
      {currentStatus === 'loading' && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Routes List */}
      {currentStatus === 'succeeded' && routes.length > 0 && (
        <div className="divide-y divide-gray-200">
          {routes.map((route) => (
            <div key={route.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    <span className="text-green-600">{route.from_location}</span> to{' '}
                    <span className="text-red-600">{route.to_location}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {route.start_date && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-1.5" />
                        {formatDate(route.start_date)}
                        {route.end_date && ` - ${formatDate(route.end_date)}`}
                      </div>
                    )}
                    {route.distance && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FiNavigation className="mr-1.5" />
                        {route.distance}
                      </div>
                    )}
                    {route.duration && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-1.5" />
                        {route.duration}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRouteAction(route, 'edit')}
                    className="p-2 text-gray-500 hover:text-blue-600"
                    title="Edit route"
                    disabled={operationStatus === 'loading'}
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleRouteAction(route, 'delete')}
                    className="p-2 text-gray-500 hover:text-red-600"
                    title="Delete route"
                    disabled={operationStatus === 'loading'}
                  >
                    <FiTrash2 size={18} />
                  </button>
                  <button
                    onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title={expandedRoute === route.id ? 'Collapse' : 'Expand'}
                    disabled={operationStatus === 'loading'}
                  >
                    {expandedRoute === route.id ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                  </button>
                </div>
              </div>
              
              {expandedRoute === route.id && (
                <div className="mt-6 space-y-6">
                  {/* Route Map */}
                  <RouteMapViewer
                    fromLocation={route.from_location}
                    toLocation={route.to_location}
                    polyline={route.polyline}
                    checkpoints={checkpoints}
                    onRouteCalculated={handleRouteCalculated}
                  />
                  
                  {/* Checkpoints Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">Checkpoints</h4>
                      <button
                        onClick={() => {
                          setCurrentCheckpoint(null);
                          setActionType('create');
                          setShowCheckpointForm(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        disabled={operationStatus === 'loading'}
                      >
                        <FiPlus className="mr-1" /> Add Checkpoint
                      </button>
                    </div>
                    
                    {status.checkpoints === 'loading' ? (
                      <div className="flex justify-center items-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : checkpoints.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {checkpoints.map((checkpoint) => (
                              <tr key={checkpoint.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {checkpoint.address}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {checkpoint.lat && checkpoint.lng ? `${checkpoint.lat.toFixed(6)}, ${checkpoint.lng.toFixed(6)}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleCheckpointAction(checkpoint, 'edit')}
                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                    disabled={operationStatus === 'loading'}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleCheckpointAction(checkpoint, 'delete')}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={operationStatus === 'loading'}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No checkpoints added yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentStatus === 'succeeded' && routes.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new route.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setCurrentRoute(null);
                setActionType('create');
                setShowRouteForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              disabled={operationStatus === 'loading'}
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Route
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRouteForm && (
        <RouteFormModal
          mode={actionType}
          route={currentRoute}
          vehicleType={activeTab}
          onSubmit={handleSubmitRoute}
          onClose={() => {
            setShowRouteForm(false);
            dispatch(resetOperationStatus());
          }}
          loading={operationStatus === 'loading'}
        />
      )}

      {showCheckpointForm && (
        <CheckpointFormModal
          mode={actionType}
          checkpoint={currentCheckpoint}
          onSubmit={handleSubmitCheckpoint}
          onClose={() => {
            setShowCheckpointForm(false);
            dispatch(resetOperationStatus());
            // Refresh checkpoints after closing modal
            if (expandedRoute) {
              dispatch(fetchBusCheckpoints({ routeId: expandedRoute }));
            }
          }}
          loading={operationStatus === 'loading'}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmationModal
          title={currentRoute ? "Delete Route" : "Delete Checkpoint"}
          message={`Are you sure you want to delete this ${currentRoute ? 'route' : 'checkpoint'}? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteConfirm(false);
            dispatch(resetOperationStatus());
          }}
          loading={operationStatus === 'loading'}
        />
      )}
    </div>
  );
};

export default RouteManagement;
