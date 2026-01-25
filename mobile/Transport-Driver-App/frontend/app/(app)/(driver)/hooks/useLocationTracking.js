import { useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import API_CONFIG, { getWsUrl } from '../../../../constants/ApiConfig';

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 3000;
const LOCATION_UPDATE_INTERVAL_MS = 5000;
const MAX_STORED_LOCATIONS = 50;

/**
 * Custom hook for WebSocket-based location tracking
 * @param {Object} vehicleData - Vehicle data object
 * @param {number} batteryLevel - Current battery level
 * @param {boolean} isCharging - Whether device is charging
 * @returns {Object} - { liveLocations, connectionStatus, isTracking }
 */
export const useLocationTracking = (vehicleData, batteryLevel, isCharging) => {
    const [liveLocations, setLiveLocations] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isTracking, setIsTracking] = useState(false);

    const wsRef = useRef(null);
    const locationIntervalRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    /**
     * Get address from coordinates using reverse geocoding
     */
    const getAddressFromCoords = useCallback(async (latitude, longitude) => {
        try {
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (reverseGeocode.length > 0) {
                const result = reverseGeocode[0];
                const parts = [
                    result.street,
                    result.city,
                    result.region,
                    result.postalCode,
                    result.country,
                ].filter(Boolean);
                return parts.join(', ');
            }
            return 'Unknown location';
        } catch (error) {
            console.error('Reverse geocode error:', error);
            return 'Could not get address';
        }
    }, []);

    /**
     * Start sending location updates
     */
    const startLocationUpdates = useCallback(
        async (ws, driverId) => {
            // Clear any existing interval
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }

            locationIntervalRef.current = setInterval(async () => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        const location = await Location.getCurrentPositionAsync({});
                        const address = await getAddressFromCoords(
                            location.coords.latitude,
                            location.coords.longitude
                        );

                        const message = {
                            id: driverId,
                            vehicle_type: vehicleData.vehicle_type,
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                            address,
                        };

                        console.log('📤 Sending location:', message);
                        ws.send(JSON.stringify(message));
                    } catch (error) {
                        console.log('❌ Location error:', error);
                    }
                }
            }, LOCATION_UPDATE_INTERVAL_MS);
        },
        [vehicleData, getAddressFromCoords]
    );

    /**
     * Handle WebSocket messages
     */
    const handleMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('📩 Received:', data);

            switch (data.type) {
                case 'connection_established':
                    console.log('🔌 Connection confirmed:', data.message);
                    break;

                case 'location_update':
                    console.log('📍 Location update:', data.data);
                    setLiveLocations((prev) =>
                        [...prev, data.data].slice(-MAX_STORED_LOCATIONS)
                    );
                    break;

                case 'error':
                    console.error('❌ Server error:', data.message);
                    break;

                default:
                    console.warn('⚠️ Unhandled message type:', data.type);
            }
        } catch (err) {
            console.error('❌ Message parse error:', err);
        }
    }, []);

    /**
     * Connect to WebSocket
     */
    const connectWebSocket = useCallback(async () => {
        try {
            const driverId = await AsyncStorage.getItem('user_id');
            if (!driverId || !vehicleData?.vehicle_type) return;

            const wsUrl = getWsUrl(API_CONFIG.ENDPOINTS.WEBSOCKET.BIKE);
            const ws = new WebSocket(wsUrl);

            setConnectionStatus('connecting');

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                wsRef.current = ws;
                setIsTracking(true);
                setConnectionStatus('connected');
                reconnectAttemptsRef.current = 0;

                // Subscribe to updates
                ws.send(
                    JSON.stringify({
                        action: 'subscribe',
                        driver_id: driverId,
                        vehicle_type: vehicleData.vehicle_type,
                    })
                );

                startLocationUpdates(ws, driverId);
            };

            ws.onmessage = handleMessage;

            ws.onerror = (e) => {
                console.error('❌ WebSocket error:', e.message);
                setConnectionStatus('error');
            };

            ws.onclose = (e) => {
                console.log(`🚪 WebSocket closed (${e.code}): ${e.reason}`);
                setConnectionStatus('disconnected');

                // Attempt reconnection
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    console.log(
                        `🔁 Reconnecting (attempt ${reconnectAttemptsRef.current})...`
                    );
                    setTimeout(connectWebSocket, RECONNECT_DELAY_MS);
                } else {
                    console.log('⏹️ Max reconnection attempts reached');
                    setIsTracking(false);
                }
            };
        } catch (error) {
            console.error('❌ WebSocket setup error:', error);
        }
    }, [vehicleData, handleMessage, startLocationUpdates]);

    // Initialize WebSocket connection
    useEffect(() => {
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, [connectWebSocket]);

    return {
        liveLocations,
        connectionStatus,
        isTracking,
    };
};

export default useLocationTracking;
