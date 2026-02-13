import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Custom hooks
import {
  useBattery,
  useDriverData,
  useBookings,
  useLocationTracking,
} from './hooks';

// Reusable components
import {
  BalanceCard,
  BookingsList,
  BottomNavigation,
  ConnectionStatus,
  DriverInfo,
  ErrorScreen,
  LoadingScreen,
  RidesMap,
  StatsRow,
  StatusBar,
  VehicleCard,
} from './components';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== Main Component ====================

const DriverHome = ({ navigation }) => {
  // State
  const [activeTab, setActiveTab] = useState('home');

  // Custom hooks for data and functionality
  const { batteryLevel, isCharging } = useBattery();
  const { driverData, vehicleData, loading, error, refetch } = useDriverData();
  const { liveLocations, connectionStatus, isTracking } = useLocationTracking(
    vehicleData,
    batteryLevel,
    isCharging
  );
  const {
    bookings,
    bookingLocations,
    mapRegion,
    setMapRegion,
    isLoading: isLoadingBookings,
    refreshing,
    fetchBookings,
    handleRefresh,
    updateBookingStatus,
  } = useBookings(liveLocations);

  // Request location permission on mount
  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
  }, []);

  // Fetch bookings when rides tab is active
  useEffect(() => {
    if (activeTab === 'rides') {
      fetchBookings();
    }
  }, [activeTab, fetchBookings]);

  // ==================== Render ====================

  if (loading) {
    return <LoadingScreen message="Loading your data..." />;
  }

  if (error) {
    return (
      <ErrorScreen
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  // Show "No Vehicle Assigned" screen if driver has no vehicle
  if (!vehicleData) {
    return <NoVehicleScreen onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      {/* Tab Content */}
      {activeTab === 'home' && (
        <HomeContent
          driverData={driverData}
          vehicleData={vehicleData}
          batteryLevel={batteryLevel}
          isCharging={isCharging}
          connectionStatus={connectionStatus}
          liveLocations={liveLocations}
        />
      )}

      {activeTab === 'rides' && (
        <RidesContent
          isLoadingBookings={isLoadingBookings}
          refreshing={refreshing}
          bookings={bookings}
          bookingLocations={bookingLocations}
          liveLocations={liveLocations}
          mapRegion={mapRegion}
          onMapRegionChange={setMapRegion}
          onRefresh={handleRefresh}
          onUpdateStatus={updateBookingStatus}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
};

// ==================== Sub-Components ====================

/**
 * Home tab content
 */
const HomeContent = ({
  driverData,
  vehicleData,
  batteryLevel,
  isCharging,
  connectionStatus,
  liveLocations,
}) => (
  <ScrollView style={styles.contentContainer}>
    <ConnectionStatus status={connectionStatus} locations={liveLocations} />
    <StatusBar batteryLevel={batteryLevel} isBatteryCharging={isCharging} />
    <DriverInfo driverData={driverData} />
    <BalanceCard />
    <StatsRow />
    <VehicleCard vehicleData={vehicleData} />

  </ScrollView>
);

/**
 * Rides tab content
 */
const RidesContent = ({
  isLoadingBookings,
  refreshing,
  bookings,
  bookingLocations,
  liveLocations,
  mapRegion,
  onMapRegionChange,
  onRefresh,
  onUpdateStatus,
}) => {
  // Show loading indicator
  if (isLoadingBookings && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3A86FF" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.ridesContainer}>
      {/* Map Section */}
      <RidesMap
        liveLocations={liveLocations}
        bookingLocations={bookingLocations}
        bookings={bookings}
        mapRegion={mapRegion}
        onRegionChange={onMapRegionChange}
      />

      {/* Bookings List */}
      <BookingsList
        bookings={bookings}
        onAccept={onUpdateStatus}
        onReject={onUpdateStatus}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};

/**
 * No Vehicle Assigned screen
 */
const NoVehicleScreen = ({ onRetry }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = async () => {
    setIsRefreshing(true);
    await onRetry();
    setIsRefreshing(false);
  };

  return (
    <View style={styles.noVehicleContainer}>
      <View style={styles.noVehicleContent}>
        <View style={styles.noVehicleIconContainer}>
          <Ionicons name="car-outline" size={80} color="#ccc" />
          <View style={styles.noVehicleBadge}>
            <Ionicons name="close-circle" size={32} color="#FF6B6B" />
          </View>
        </View>

        <Text style={styles.noVehicleTitle}>No Vehicle Assigned</Text>
        <Text style={styles.noVehicleMessage}>
          You don't have a vehicle assigned yet. Please contact your administrator to get a vehicle assigned to your account.
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  ridesContainer: {
    flex: 1,
  },
  // No Vehicle Screen styles
  noVehicleContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noVehicleContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  noVehicleIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  noVehicleBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  noVehicleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  noVehicleMessage: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A86FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    minWidth: 160,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverHome;