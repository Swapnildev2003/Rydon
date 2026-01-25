import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import API_CONFIG, { getApiUrl } from '../../../../constants/ApiConfig';

/**
 * Custom hook for managing driver bookings
 * @param {Array} liveLocations - Current live location data
 * @returns {Object} - Booking state and handlers
 */
export const useBookings = (liveLocations = []) => {
    const [bookings, setBookings] = useState([]);
    const [bookingLocations, setBookingLocations] = useState([]);
    const [mapRegion, setMapRegion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Fetch driver bookings from API
     */
    const fetchBookings = useCallback(async () => {
        try {
            setIsLoading(true);
            const driverId = await AsyncStorage.getItem('user_id');

            const response = await axios.get(
                getApiUrl(API_CONFIG.ENDPOINTS.DRIVER_BOOKINGS(driverId))
            );

            setBookings(response.data);

            // Process booking locations for map markers
            const locations = await processBookingLocations(response.data);
            setBookingLocations(locations);

            // Update map region to show all points
            updateMapRegion(locations, liveLocations);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Error', 'Failed to load bookings');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [liveLocations]);

    /**
     * Handle pull-to-refresh
     */
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchBookings();
    }, [fetchBookings]);

    /**
     * Update booking status (accept/reject)
     */
    const updateBookingStatus = useCallback(
        async (bookingId, status) => {
            try {
                const vehicleType = await AsyncStorage.getItem('vehicle_type');

                const response = await axios.post(
                    getApiUrl(`/api/bookings/${bookingId}/update-status/`),
                    {
                        status,
                        vehicle_type: vehicleType,
                    }
                );

                Alert.alert('Success', response.data.message);
                fetchBookings(); // Refresh bookings after update
            } catch (error) {
                console.error('Error updating booking status:', error);
                Alert.alert('Error', 'Failed to update booking status');
            }
        },
        [fetchBookings]
    );

    /**
     * Update map region to fit all markers
     */
    const updateMapRegion = (locations, currentLiveLocations) => {
        if (locations.length === 0) return;

        const allPoints = [...locations];

        // Include driver's current location if available
        if (currentLiveLocations.length > 0) {
            allPoints.push({
                latitude: currentLiveLocations[0].latitude,
                longitude: currentLiveLocations[0].longitude,
            });
        }

        // Calculate bounds
        const lats = allPoints.map((p) => p.latitude);
        const longs = allPoints.map((p) => p.longitude);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLong = Math.min(...longs);
        const maxLong = Math.max(...longs);

        const padding = 0.1;

        setMapRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLong + maxLong) / 2,
            latitudeDelta: maxLat - minLat + padding,
            longitudeDelta: maxLong - minLong + padding,
        });
    };

    return {
        bookings,
        bookingLocations,
        mapRegion,
        setMapRegion,
        isLoading,
        refreshing,
        fetchBookings,
        handleRefresh,
        updateBookingStatus,
    };
};

/**
 * Process booking addresses into geocoded locations
 */
const processBookingLocations = async (bookingsData) => {
    const processedLocations = [];

    for (const booking of bookingsData) {
        try {
            // Process "from" location
            const fromCoords = await Location.geocodeAsync(booking.from_address);
            if (fromCoords.length > 0) {
                processedLocations.push({
                    id: `from_${booking.id}`,
                    bookingId: booking.id,
                    type: 'from',
                    latitude: fromCoords[0].latitude,
                    longitude: fromCoords[0].longitude,
                    address: booking.from_address,
                    status: booking.status,
                });
            }

            // Process "to" location
            const toCoords = await Location.geocodeAsync(booking.to_address);
            if (toCoords.length > 0) {
                processedLocations.push({
                    id: `to_${booking.id}`,
                    bookingId: booking.id,
                    type: 'to',
                    latitude: toCoords[0].latitude,
                    longitude: toCoords[0].longitude,
                    address: booking.to_address,
                    status: booking.status,
                });
            }
        } catch (error) {
            console.error(
                `Error processing locations for booking ${booking.id}:`,
                error
            );
        }
    }

    return processedLocations;
};

export default useBookings;
