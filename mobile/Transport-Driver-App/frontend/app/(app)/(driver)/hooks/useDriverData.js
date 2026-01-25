import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import API_CONFIG, { getApiUrl } from '../../../../constants/ApiConfig';

/**
 * Custom hook for fetching driver and vehicle data
 * Uses stored vehicle_type and vehicle_id from login (single API call approach)
 * @returns {Object} - { driverData, vehicleData, loading, error, refetch }
 */
export const useDriverData = () => {
    const [driverData, setDriverData] = useState(null);
    const [vehicleData, setVehicleData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const accessToken = await AsyncStorage.getItem('access_token');
            const driverId = await AsyncStorage.getItem('user_id');
            const vehicleType = await AsyncStorage.getItem('vehicle_type');
            const vehicleId = await AsyncStorage.getItem('vehicle_id');

            if (!accessToken || !driverId) {
                throw new Error('Authentication required. Please login again.');
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            };

            // Fetch driver details
            const driverResponse = await axios.get(
                getApiUrl(API_CONFIG.ENDPOINTS.DRIVER_DETAILS(driverId)),
                config
            );
            setDriverData(driverResponse.data);

            // Fetch vehicle data using stored vehicle_type (single API call!)
            if (vehicleType && vehicleId) {
                const vehicleEndpoint = getVehicleEndpoint(vehicleType, driverId);

                if (vehicleEndpoint) {
                    try {
                        const vehicleResponse = await axios.get(
                            getApiUrl(vehicleEndpoint),
                            config
                        );
                        setVehicleData(vehicleResponse.data);
                    } catch (err) {
                        console.log('Vehicle fetch error:', err);
                        // Vehicle might have been unassigned, clear stored data
                        if (err.response?.status === 404) {
                            await AsyncStorage.removeItem('vehicle_type');
                            await AsyncStorage.removeItem('vehicle_id');
                        }
                    }
                }
            } else {
                // No vehicle assigned to this driver
                console.log('No vehicle assigned to driver');
                setVehicleData(null);
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        driverData,
        vehicleData,
        loading,
        error,
        refetch: fetchData,
    };
};

/**
 * Get the vehicle endpoint based on vehicle type
 */
const getVehicleEndpoint = (vehicleType, driverId) => {
    switch (vehicleType?.toLowerCase()) {
        case 'bus':
            return API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.BUS(driverId);
        case 'car':
            return API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.CAR(driverId);
        case 'bike':
            return API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.BIKE(driverId);
        default:
            return null;
    }
};

/**
 * Helper function to extract error message from error object
 */
const getErrorMessage = (err) => {
    if (err.response) {
        return err.response.status === 401
            ? 'Session expired. Please login again.'
            : err.response.data?.error || err.response.statusText;
    }
    if (err.request) {
        return 'Network error. Please check your connection.';
    }
    return err.message || 'An unexpected error occurred';
};

export default useDriverData;
