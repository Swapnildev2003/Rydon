import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import API_CONFIG, { getApiUrl, getWsUrl } from '../../../constants/ApiConfig';

const DriverHome = ({ navigation }) => {
  // State variables
  const [activeTab, setActiveTab] = useState('home');
  const [driverData, setDriverData] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isBatteryCharging, setIsBatteryCharging] = useState(false);
  const [socket, setSocket] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTracking, setIsTracking] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingLocations, setBookingLocations] = useState([]);
  const [mapRegion, setMapRegion] = useState(null);

  // Tab configuration
  const tabs = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'rides', name: 'Rides', icon: 'car' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' },
    { id: 'more', name: 'More', icon: 'menu' },
  ];

  // Fetch driver bookings
  const fetchDriverBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const driverId = await AsyncStorage.getItem('user_id');
      const response = await axios.get(
        getApiUrl(API_CONFIG.ENDPOINTS.DRIVER_BOOKINGS(driverId))
      );
      
      setBookings(response.data);
      
      // Process booking locations
      const locations = await processBookingLocations(response.data);
      setBookingLocations(locations);
      
      // Update map region to show all points
      updateMapRegion(locations);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoadingBookings(false);
      setRefreshing(false);
    }
  };

  // Process booking locations from booking data
  const processBookingLocations = async (bookingsData) => {
    const processedLocations = [];
    
    for (const booking of bookingsData) {
      try {
        // Process from location
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
        
        // Process to location
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
        console.error(`Error processing locations for booking ${booking.id}:`, error);
      }
    }
    
    return processedLocations;
  };

  // Update map region to show all points
  const updateMapRegion = (locations) => {
    if (locations.length === 0) return;
    
    // Include driver's current location if available
    const allPoints = [...locations];
    if (liveLocations.length > 0) {
      allPoints.push({
        latitude: liveLocations[0].latitude,
        longitude: liveLocations[0].longitude,
      });
    }
    
    // Calculate min/max coordinates
    const lats = allPoints.map(p => p.latitude);
    const longs = allPoints.map(p => p.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLong = Math.min(...longs);
    const maxLong = Math.max(...longs);
    
    const padding = 0.1; // Add some padding
    
    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLong + maxLong) / 2,
      latitudeDelta: (maxLat - minLat) + padding,
      longitudeDelta: (maxLong - minLong) + padding,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDriverBookings();
  };

  // Fetch driver and vehicle data
  const fetchData = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const driverId = await AsyncStorage.getItem('user_id');
      
      if (!accessToken || !driverId) {
        throw new Error('Authentication required. Please login again.');
      }

      const config = {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      // Fetch driver details
      const driverResponse = await axios.get(
        getApiUrl(API_CONFIG.ENDPOINTS.DRIVER_DETAILS(driverId)),
        config
      );
      setDriverData(driverResponse.data);
  
      // Fetch vehicle data
      const vehicleEndpoints = [
        getApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.BUS(driverId)),
        getApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.CAR(driverId)),
        getApiUrl(API_CONFIG.ENDPOINTS.VEHICLE_BY_DRIVER.BIKE(driverId))
      ];

      let vehicleResponse = null;
      for (const endpoint of vehicleEndpoints) {
        try {
          const response = await axios.get(endpoint, config);
          if (response.data) {
            vehicleResponse = response;
            break;
          }
        } catch (err) {
          if (err.response?.status !== 404) throw err;
        }
      }

      if (!vehicleResponse) {
        throw new Error('No assigned vehicle found for this driver.');
      }

      setVehicleData(vehicleResponse.data);
      
    } catch (err) {
      let errorMessage = 'Failed to load data';
      if (err.response) {
        errorMessage = err.response.status === 401 
          ? 'Session expired. Please login again.' 
          : err.response.data?.error || err.response.statusText;
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred';
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Setup battery monitoring
  const setupBatteryListeners = async () => {
    try {
      const isAvailable = await Battery.isAvailableAsync();
      if (!isAvailable) return () => {};

      const batteryLevel = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(batteryLevel * 100));

      const batteryState = await Battery.getBatteryStateAsync();
      setIsBatteryCharging(batteryState === Battery.BatteryState.CHARGING);

      const batteryLevelSubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
        setBatteryLevel(Math.round(batteryLevel * 100));
      });

      const batteryStateSubscription = Battery.addBatteryStateListener(({ batteryState }) => {
        setIsBatteryCharging(batteryState === Battery.BatteryState.CHARGING);
      });

      return () => {
        batteryLevelSubscription?.remove();
        batteryStateSubscription?.remove();
      };
    } catch (error) {
      console.error('Battery monitoring error:', error);
      return () => {};
    }
  };

  // Get address from coordinates
  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocode.length > 0) {
        const firstResult = reverseGeocode[0];
        const addressParts = [
          firstResult.street,
          firstResult.city,
          firstResult.region,
          firstResult.postalCode,
          firstResult.country
        ].filter(Boolean);
        return addressParts.join(', ');
      }
      return "Unknown location";
    } catch (error) {
      console.error("Reverse geocode error:", error);
      return "Could not get address";
    }
  };

  // WebSocket and location tracking
  useEffect(() => {
    let ws;
    let locationInterval;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;

    const connectWebSocket = async () => {
      try {
        const driverId = await AsyncStorage.getItem('user_id');
        if (!driverId || !vehicleData?.vehicle_type) return;

        const wsUrl = getWsUrl(API_CONFIG.ENDPOINTS.WEBSOCKET.BIKE);
        ws = new WebSocket(wsUrl);
        setConnectionStatus('connecting');

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          setSocket(ws);
          setIsTracking(true);
          setConnectionStatus('connected');
          reconnectAttempts = 0;

          ws.send(JSON.stringify({
            action: 'subscribe',
            driver_id: driverId,
            vehicle_type: vehicleData.vehicle_type
          }));

          startLocationUpdates(ws, driverId);
        };

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            console.log('📩 Received:', data);

            switch(data.type) {
              case 'connection_established':
                console.log('🔌 Connection confirmed:', data.message);
                break;
              case 'location_update':
                console.log('📍 Location update:', data.data);
                setLiveLocations(prev => [...prev, data.data].slice(-50));
                // Update map region when we get new driver location
                if (bookingLocations.length > 0) {
                  updateMapRegion(bookingLocations);
                }
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
        };

        ws.onerror = (e) => {
          console.error('❌ WebSocket error:', e.message);
          setConnectionStatus('error');
        };

        ws.onclose = (e) => {
          console.log(`🚪 WebSocket closed (${e.code}): ${e.reason}`);
          setConnectionStatus('disconnected');
          handleReconnect();
        };

      } catch (error) {
        console.error('❌ WebSocket setup error:', error);
      }
    };

    const startLocationUpdates = async (wsConnection, driverId) => {
      if (locationInterval) clearInterval(locationInterval);

      locationInterval = setInterval(async () => {
        if (wsConnection.readyState === WebSocket.OPEN) {
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
              address: address,
            };

            console.log('📤 Sending location:', message);
            wsConnection.send(JSON.stringify(message));
          } catch (error) {
            console.log('❌ Location error:', error);
          }
        }
      }, 5000);
    };

    const handleReconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`🔁 Reconnecting (attempt ${reconnectAttempts})...`);
        setTimeout(connectWebSocket, reconnectDelay);
      } else {
        console.log('⏹️ Max reconnection attempts reached');
        setIsTracking(false);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
        setSocket(null);
      }
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [vehicleData, batteryLevel, isBatteryCharging, bookingLocations]);

  // Initial setup
  useEffect(() => {
    let batteryCleanup;

    const initialize = async () => {
      await Location.requestForegroundPermissionsAsync();
      await fetchData();
      batteryCleanup = await setupBatteryListeners();
    };

    initialize();

    return () => {
      if (batteryCleanup) batteryCleanup();
    };
  }, []);

  // Fetch bookings when rides tab is active
  useEffect(() => {
    if (activeTab === 'rides') {
      fetchDriverBookings();
    }
  }, [activeTab]);

  // UI Components
  const ConnectionStatus = ({ status, locations }) => {
    const statusConfig = {
      connecting: { color: '#FFA500', text: 'Connecting...', icon: 'sync' },
      connected: { color: '#4CAF50', text: 'Live Tracking', icon: 'wifi' },
      disconnected: { color: '#F44336', text: 'Disconnected', icon: 'wifi-off' },
      error: { color: '#F44336', text: 'Connection Error', icon: 'alert-circle' }
    };

    const currentStatus = statusConfig[status] || statusConfig.disconnected;

    return (
      <View style={[styles.connectionStatus, { backgroundColor: `${currentStatus.color}20` }]}>
        <View style={styles.statusRow}>
          <Ionicons name={currentStatus.icon} size={20} color={currentStatus.color} />
          <Text style={[styles.statusText, { color: currentStatus.color }]}>
            {currentStatus.text}
          </Text>
        </View>

        {status === 'connected' && locations.length > 0 && (
          <View style={styles.locationData}>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={14} />{' '}
              {locations[0].address || 'Getting address...'}
            </Text>
            <Text style={styles.coordinatesText}>
              {locations[0].latitude.toFixed(6)}, {locations[0].longitude.toFixed(6)}
            </Text>
            <Text style={styles.coordinatesText}>
              Updated: {new Date(locations[0].timestamp).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingId}>Booking #{item.id}</Text>
        <Text style={[
          styles.bookingStatus,
          item.status === 'completed' ? styles.completedStatus : 
          item.status === 'cancelled' ? styles.cancelledStatus : styles.pendingStatus
        ]}>
          {item.status}
        </Text>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.bookingDetailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.bookingDetailText}>From: {item.from_address}</Text>
        </View>
        
        <View style={styles.bookingDetailRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.bookingDetailText}>To: {item.to_address}</Text>
        </View>
        
        <View style={styles.bookingDetailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.bookingDetailText}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHomeContent = () => (
    <ScrollView style={styles.contentContainer}>
      <ConnectionStatus status={connectionStatus} locations={liveLocations} />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.onlineStatus}>
          <View style={[styles.statusIndicator, styles.online]} />
          <Text style={styles.statusText}>Online</Text>
        </View>
        <View style={styles.batteryStatus}>
          <Text style={styles.batteryText}>
            {batteryLevel !== null ? `${batteryLevel}%` : 'N/A'}
          </Text>
          <Ionicons 
            name={isBatteryCharging ? "battery-charging" : "battery-full"} 
            size={20} 
            color={batteryLevel < 20 ? "#F44336" : "#666"} 
          />
        </View>
      </View>
      
      {/* Driver Info */}
      <View style={styles.driverInfo}>
        <View>
          <Text style={styles.driverName}>
            {driverData?.driver.name || 'Driver Name'}
          </Text>
          <Text style={styles.driverLevel}>
            {driverData?.level || 'Basic Level'}
          </Text>
        </View>
        <View style={styles.profileIcon}>
          <Text style={styles.profileInitial}>
            {driverData?.driver.name?.charAt(0) || 'D'}
          </Text>
        </View>
      </View>
      
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Balance</Text>
          <MaterialIcons name="visibility" size={20} color="white" />
        </View>
        <Text style={styles.balanceAmount}>$564.78</Text>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>20%</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#FFC107" />
          <Text style={styles.statValue}>4.0</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#F44336" />
          <Text style={styles.statValue}>3%</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>
      
      {/* Vehicle Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
      </View>
      
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleHeader}>
          <View>
            <Text style={styles.vehicleTitle}>{vehicleData?.vehicle_type || 'Vehicle'}</Text>
            <Text style={styles.vehicleSubtitle}>
              {vehicleData?.bus_type || vehicleData?.car_type || vehicleData?.bike_type || 'Type'}
            </Text>
          </View>
          <Text style={[styles.vehicleStatus, styles.activeStatus]}>
            {vehicleData?.status || 'Active'}
          </Text>
        </View>
        
        <View style={styles.vehicleDetails}>
          <View style={styles.vehicleDetailRow}>
            <Ionicons name="car" size={20} color="#666" />
            <Text style={styles.vehicleDetailText}>{vehicleData?.license_plate || 'N/A'}</Text>
          </View>
          
          <View style={styles.vehicleDetailRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.vehicleDetailText}>{vehicleData?.seating_capacity || '0'} seats</Text>
          </View>
          
          {vehicleData?.has_ac !== undefined && (
            <View style={styles.vehicleDetailRow}>
              <Ionicons name="snow" size={20} color="#666" />
              <Text style={styles.vehicleDetailText}>AC: {vehicleData.has_ac ? "Yes" : "No"}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderRidesContent = () => {
    if (isLoadingBookings && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3A86FF" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {/* Full-screen Map */}
        <View style={styles.fullMapContainer}>
          <MapView
            style={styles.fullMap}
            region={mapRegion || {
              latitude: liveLocations[0]?.latitude || 37.78825,
              longitude: liveLocations[0]?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onRegionChangeComplete={setMapRegion}
          >
            {/* Driver's current location */}
            {liveLocations.length > 0 && (
              <Marker
                coordinate={{
                  latitude: liveLocations[0].latitude,
                  longitude: liveLocations[0].longitude,
                }}
                title="Your Location"
                description={liveLocations[0].address}
                pinColor="#3A86FF"
              />
            )}
            
            {/* Booking locations */}
            {bookingLocations.map((location) => (
              <Marker
                key={location.id}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                title={location.type === 'from' ? `Pickup (Booking #${location.bookingId})` : `Dropoff (Booking #${location.bookingId})`}
                description={location.address}
                pinColor={location.type === 'from' ? '#4CAF50' : '#F44336'}
              />
            ))}
            
            {/* Draw lines between from and to locations for each booking */}
            {bookings.map(booking => {
              const fromLocation = bookingLocations.find(loc => 
                loc.bookingId === booking.id && loc.type === 'from'
              );
              const toLocation = bookingLocations.find(loc => 
                loc.bookingId === booking.id && loc.type === 'to'
              );
              
              if (fromLocation && toLocation) {
                return (
                  <Polyline
                    key={`route_${booking.id}`}
                    coordinates={[
                      { latitude: fromLocation.latitude, longitude: fromLocation.longitude },
                      { latitude: toLocation.latitude, longitude: toLocation.longitude },
                    ]}
                    strokeColor="#FF9800"
                    strokeWidth={2}
                    lineDashPattern={[5, 5]}
                  />
                );
              }
              return null;
            })}
            
            {/* Draw lines from driver to each pickup location */}
            {liveLocations.length > 0 && bookingLocations
              .filter(loc => loc.type === 'from')
              .map(location => (
                <Polyline
                  key={`driver_to_${location.id}`}
                  coordinates={[
                    { latitude: liveLocations[0].latitude, longitude: liveLocations[0].longitude },
                    { latitude: location.latitude, longitude: location.longitude },
                  ]}
                  strokeColor="#3A86FF"
                  strokeWidth={1}
                  lineDashPattern={[2, 2]}
                />
              ))}
          </MapView>
        </View>

        {/* Bookings List with Refresh Control */}
        <View style={styles.bookingsListContainer}>
          <View style={styles.bookingsHeader}>
            <Text style={styles.sectionTitle}>Your Bookings</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#3A86FF" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.bookingsList}
            ListEmptyComponent={
              <Text style={styles.noBookingsText}>No bookings found</Text>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3A86FF']}
                tintColor="#3A86FF"
              />
            }
          />
        </View>
      </View>
    );
  };

  // Loading and error states
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3A86FF" />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Ionicons name="warning" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchData();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <View style={styles.container}>
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'rides' && renderRidesContent()}
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map(tab => (
          <TouchableOpacity 
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon} 
              size={24} 
              color={activeTab === tab.id ? '#3A86FF' : '#666'} 
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTab]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  connectionStatus: {
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  locationData: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#00000020',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  batteryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  driverName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  driverLevel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A86FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: '#3A86FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  vehicleStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeStatus: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
  },
  vehicleDetails: {
    marginBottom: 16,
  },
  vehicleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleDetailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  activeTab: {
    color: '#3A86FF',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#3A86FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // New styles for rides tab
  fullMapContainer: {
    height: Dimensions.get('window').height * 0.5,
    width: '100%',
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  bookingsListContainer: {
    flex: 1,
    padding: 16,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingsList: {
    paddingBottom: 80,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatus: {
    backgroundColor: '#FFF3E0',
    color: '#FF9800',
  },
  completedStatus: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  cancelledStatus: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  bookingDetails: {
    marginTop: 8,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  noBookingsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DriverHome;