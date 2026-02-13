import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Autocomplete } from '@react-google-maps/api';
import { FiX, FiMapPin, FiCalendar, FiClock, FiNavigation } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fetchVehicles } from '../../redux/slices/vehicleSlice';
import { format, isValid } from 'date-fns';

const RouteFormModal = ({
    mode = 'create',
    route = null,
    vehicleType,
    onSubmit,
    onClose
}) => {
    const dispatch = useDispatch();
    const vehicles = useSelector((state) => state.vehicle[vehicleType] || []);
    const vehicleStatus = useSelector((state) => state.vehicle.status);
    const vehicleError = useSelector((state) => state.vehicle.error);

    const [formData, setFormData] = useState({
        name: '',
        from_location: '',
        to_location: '',
        start_date: null,
        end_date: null,
        polyline: '',
        distance: '',
        duration: '',
        vehicle: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const fromAutocompleteRef = useRef(null);
    const toAutocompleteRef = useRef(null);

    useEffect(() => {
        if (vehicleType) {
            dispatch(fetchVehicles(vehicleType));
        }
        // Trigger slide-in animation
        setIsVisible(true);
    }, [dispatch, vehicleType]);

    useEffect(() => {
        if (mode === 'edit' && route) {
            setFormData({
                name: route.name || '',
                from_location: route.from_location || '',
                to_location: route.to_location || '',
                start_date: isValid(new Date(route.start_date)) ? new Date(route.start_date) : null,
                end_date: isValid(new Date(route.end_date)) ? new Date(route.end_date) : null,
                polyline: route.polyline || '',
                distance: route.distance || '',
                duration: route.duration || '',
                vehicle: route.vehicle?.id || ''
            });
        }
    }, [mode, route]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const getVehicleOptions = () => {
        if (vehicleStatus === 'loading') {
            return [<option key="loading" value="" disabled>Loading vehicles...</option>];
        }

        if (vehicleStatus === 'failed') {
            return [<option key="error" value="" disabled>Error loading vehicles: {vehicleError}</option>];
        }

        if (vehicles.length === 0) {
            return [<option key="empty" value="" disabled>No vehicles available</option>];
        }

        return vehicles.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration_number || vehicle.model || `Vehicle ${vehicle.id}`}
                {vehicle.driver_name && ` (Driver: ${vehicle.driver_name})`}
                {vehicleType === 'bus' && vehicle.conductor_name && ` (Conductor: ${vehicle.conductor_name})`}
            </option>
        ));
    };

    const handleFromPlaceChanged = () => {
        if (fromAutocompleteRef.current) {
            const place = fromAutocompleteRef.current.getPlace();
            if (place?.formatted_address) {
                setFormData(prev => ({
                    ...prev,
                    from_location: place.formatted_address
                }));
            }
        }
    };

    const handleToPlaceChanged = () => {
        if (toAutocompleteRef.current) {
            const place = toAutocompleteRef.current.getPlace();
            if (place?.formatted_address) {
                setFormData(prev => ({
                    ...prev,
                    to_location: place.formatted_address
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const newErrors = {};
        if (!formData.name) newErrors.name = 'Route name is required';
        if (!formData.from_location) newErrors.from_location = 'Origin is required';
        if (!formData.to_location) newErrors.to_location = 'Destination is required';
        if (!formData.vehicle) newErrors.vehicle = 'Vehicle selection is required';
        if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
            newErrors.end_date = 'End date cannot be before start date';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const formatDate = (date) => {
                if (!date || !isValid(date)) return null;
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const directionsService = new window.google.maps.DirectionsService();
            const result = await new Promise((resolve, reject) => {
                directionsService.route(
                    {
                        origin: formData.from_location,
                        destination: formData.to_location,
                        travelMode: 'DRIVING'
                    },
                    (result, status) => {
                        if (status === 'OK') {
                            resolve(result);
                        } else {
                            reject(new Error('Directions request failed: ' + status));
                        }
                    }
                );
            });

            const dataToSubmit = {
                ...formData,
                vehicle: parseInt(formData.vehicle),
                start_date: formatDate(formData.start_date),
                end_date: formatDate(formData.end_date),
                polyline: result.routes[0].overview_polyline,
                distance: result.routes[0].legs[0].distance.text,
                duration: result.routes[0].legs[0].duration.text
            };

            await onSubmit(dataToSubmit);
            handleClose();
        } catch (error) {
            console.error('Error submitting route:', error);
            setErrors({ submit: error.message || 'Failed to submit route' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Background overlay */}
            <div 
                className={`absolute inset-0  bg-opacity-50 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleClose}
            />
            
            {/* Modal container */}
            <div 
                className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                {mode === 'create' ? `Add New ${vehicleType} Route` : `Edit ${vehicleType} Route`}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label="Close modal"
                            >
                                <FiX size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Form content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Route Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g., Downtown Express"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Vehicle Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                                <select
                                    value={formData.vehicle}
                                    onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                                    className={`w-full p-2 border rounded-md ${errors.vehicle ? 'border-red-500' : 'border-gray-300'}`}
                                    required
                                    disabled={vehicleStatus === 'loading'}
                                >
                                    <option value="">Select a vehicle</option>
                                    {getVehicleOptions()}
                                </select>
                                {errors.vehicle && <p className="text-red-500 text-xs mt-1">{errors.vehicle}</p>}
                            </div>

                            {/* From/To Locations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From Location *</label>
                                    <Autocomplete
                                        onLoad={(autocomplete) => fromAutocompleteRef.current = autocomplete}
                                        onPlaceChanged={handleFromPlaceChanged}
                                        fields={['formatted_address']}
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMapPin className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.from_location}
                                                onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                                                className={`w-full pl-10 p-2 border rounded-md ${errors.from_location ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Enter origin"
                                                required
                                            />
                                        </div>
                                    </Autocomplete>
                                    {errors.from_location && <p className="text-red-500 text-xs mt-1">{errors.from_location}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Location *</label>
                                    <Autocomplete
                                        onLoad={(autocomplete) => toAutocompleteRef.current = autocomplete}
                                        onPlaceChanged={handleToPlaceChanged}
                                        fields={['formatted_address']}
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMapPin className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.to_location}
                                                onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                                                className={`w-full pl-10 p-2 border rounded-md ${errors.to_location ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Enter destination"
                                                required
                                            />
                                        </div>
                                    </Autocomplete>
                                    {errors.to_location && <p className="text-red-500 text-xs mt-1">{errors.to_location}</p>}
                                </div>
                            </div>

                            {/* Date Pickers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <div className="relative">
                                        <DatePicker
                                            selected={formData.start_date}
                                            onChange={(date) => setFormData({ ...formData, start_date: date })}
                                            className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                                            placeholderText="Select start date"
                                            dateFormat="MMMM d, yyyy"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <div className="relative">
                                        <DatePicker
                                            selected={formData.end_date}
                                            onChange={(date) => setFormData({ ...formData, end_date: date })}
                                            className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                                            placeholderText="Select end date"
                                            minDate={formData.start_date}
                                            dateFormat="MMMM d, yyyy"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiCalendar className="text-gray-400" />
                                        </div>
                                    </div>
                                    {errors.end_date && <p className="text-red-500 text-xs mt-1">{errors.end_date}</p>}
                                </div>
                            </div>

                            {/* Distance/Duration */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.distance}
                                            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                                            className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                                            placeholder="e.g., 15.5"
                                            step="0.1"
                                            min="0"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiNavigation className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full pl-10 p-2 border border-gray-300 rounded-md"
                                            placeholder="e.g., 45"
                                            min="0"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiClock className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                                    disabled={loading || vehicleStatus === 'loading'}
                                >
                                    {loading ? 'Processing...' : mode === 'create' ? 'Create Route' : 'Update Route'}
                                </button>
                            </div>
                            {errors.submit && <p className="text-red-500 text-sm mt-2">{errors.submit}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouteFormModal;
