import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Battery from 'expo-battery';
import LogoutButton from '../../_components/logoutButton';
import MoreSection from '../../_components/moreSection';
import { router } from 'expo-router';
export default function ConductorHome({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');
  const [conductorData, setConductorData] = useState(null);
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [isBatteryCharging, setIsBatteryCharging] = useState(false);

  const tabs = [
    { id: 'home', name: 'Home', icon: 'home' },
    { id: 'tickets', name: 'Tickets', icon: 'ticket' },
    { id: 'history', name: 'History', icon: 'history' },
    { id: 'more', name: 'More', icon: 'menu' },
  ];

  const fetchData = async () => {
    try {
       await AsyncStorage.clear();
              
              // Navigate to login page using Expo Router
              router.replace('/(auth)/login');
      const accessToken = await AsyncStorage.getItem('access_token');
      const conductorId = await AsyncStorage.getItem('user_id');
      
      if (!accessToken || !conductorId) {
        throw new Error('Authentication required. Please login again.');
      }
      console.log(conductorId)

      const config = {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      // Fetch conductor details
      const conductorResponse = await axios.get(`http://10.42.239.244:8000/api/conductor-details/${conductorId}/`);
      setConductorData(conductorResponse.data);

      // Fetch assigned bus data
      const busResponse = await axios.get(`http://10.42.239.244:8000/api/bus/driver/${conductorId}/`);
      if (!busResponse.data) {
        throw new Error('No assigned bus found for this conductor.');
      }
      setBusData(busResponse.data);
      
    } catch (err) {
      let errorMessage = 'Failed to load data';

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else {
          errorMessage = err.response.data?.error || err.response.statusText;
        }
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

  const setupBatteryListeners = async () => {
    try {
      // Check if battery API is available
      const isAvailable = await Battery.isAvailableAsync();
      if (!isAvailable) {
        console.log('Battery API not available on this device');
        return () => {};
      }

      // Get initial battery state
      const batteryLevel = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(batteryLevel * 100));

      const batteryState = await Battery.getBatteryStateAsync();
      setIsBatteryCharging(batteryState === Battery.BatteryState.CHARGING);

      // Set up listeners
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

  useEffect(() => {
    let batteryCleanup;
    
    const initialize = async () => {
      await fetchData();
      batteryCleanup = await setupBatteryListeners();
    };

    initialize();

    return () => {
      if (batteryCleanup) batteryCleanup();
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  const handleLogout = () => {
    navigation.navigate('Login');
  };

  const renderHomeContent = () => (
    <ScrollView style={styles.contentContainer}>
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
            name={
              isBatteryCharging ? "battery-charging" : 
              batteryLevel === null ? "battery-dead" : "battery-full"
            } 
            size={20} 
            color={
              batteryLevel === null ? "#999" :
              batteryLevel < 20 ? "#F44336" : "#666"
            } 
          />
        </View>
      </View>
      
      {/* Conductor Info */}
      <View style={styles.conductorInfo}>
        <View>
          <Text style={styles.conductorName}>
            {conductorData?.conductor.name || 'Conductor Name'}
          </Text>
          <Text style={styles.conductorId}>
            ID: {conductorData?.id || 'N/A'}
          </Text>
        </View>
        <View style={styles.profileIcon}>
          <Text style={styles.profileInitial}>
            {conductorData?.conductor.name?.charAt(0) || 'C'}
          </Text>
        </View>
      </View>
      
      {/* Today's Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Today's Stats</Text>
          <MaterialIcons name="today" size={20} color="white" />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>42</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$128</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Routes</Text>
          </View>
        </View>
      </View>
      
      {/* Assigned Bus Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assigned Bus</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View Details</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.busCard}>
        <View style={styles.busHeader}>
          <View>
            <Text style={styles.busTitle}>{busData?.bus_type || 'Bus'}</Text>
            <Text style={styles.busSubtitle}>
              {busData?.license_plate || 'License Plate N/A'}
            </Text>
          </View>
          <Text style={[styles.busStatus, styles.activeStatus]}>
            {busData?.status || 'Active'}
          </Text>
        </View>
        
        <View style={styles.busDetails}>
          <View style={styles.busDetailRow}>
            <Ionicons name="people" size={20} color="#666" />
            <Text style={styles.busDetailText}>{busData?.seating_capacity || '0'} seats</Text>
          </View>
          
          <View style={styles.busDetailRow}>
            <Ionicons name="speedometer" size={20} color="#666" />
            <Text style={styles.busDetailText}>{busData?.current_route || 'Route N/A'}</Text>
          </View>
          
          <View style={styles.busDetailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.busDetailText}>Next trip: {busData?.next_trip_time || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.busFooter}>
          <View style={styles.busFeature}>
            <Ionicons name="snow" size={16} color="#666" />
            <Text style={styles.busFeatureText}>AC: {busData?.has_ac ? "Yes" : "No"}</Text>
          </View>
          
          <View style={styles.busFeature}>
            <Ionicons name="wifi" size={16} color="#666" />
            <Text style={styles.busFeatureText}>WiFi: {busData?.has_wifi ? "Yes" : "No"}</Text>
          </View>
          
          <View style={styles.busFeature}>
            <Ionicons name="tv" size={16} color="#666" />
            <Text style={styles.busFeatureText}>TV: {busData?.has_tv ? "Yes" : "No"}</Text>
          </View>
        </View>
      </View>
      
      {/* Recent Tickets Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.ticketCard}>
        <View style={styles.ticketItem}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketId}>#TK-78945</Text>
            <Text style={styles.ticketRoute}>Downtown Express</Text>
          </View>
          <Text style={styles.ticketPrice}>$2.50</Text>
        </View>
        
        <View style={styles.ticketItem}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketId}>#TK-78944</Text>
            <Text style={styles.ticketRoute}>University Line</Text>
          </View>
          <Text style={styles.ticketPrice}>$1.75</Text>
        </View>
        
        <View style={styles.ticketItem}>
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketId}>#TK-78943</Text>
            <Text style={styles.ticketRoute}>Airport Shuttle</Text>
          </View>
          <Text style={styles.ticketPrice}>$4.00</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderTicketsContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Tickets Management</Text>
      <Text>Tickets content goes here</Text>
    </View>
  );

  const renderHistoryContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>History</Text>
      <Text>History content goes here</Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHomeContent();
      case 'tickets':
        return renderTicketsContent();
      case 'history':
        return renderHistoryContent();
      case 'more':
        return <MoreSection navigation={navigation} onLogout={handleLogout}/>;
      default:
        return renderHomeContent();
    }
  };

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
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!conductorData || !busData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No data available</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetry}
        >
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
      
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingBottom: 60,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  online: {
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
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
  conductorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  conductorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  conductorId: {
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
  statsCard: {
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '30%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
    color: '#3A86FF',
    fontWeight: '500',
  },
  busCard: {
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
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  busTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  busSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  busStatus: {
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
  busDetails: {
    marginBottom: 16,
  },
  busDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  busDetailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  busFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  busFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busFeatureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  ticketCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketId: {
    fontSize: 14,
    color: '#666',
  },
  ticketRoute: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  ticketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A86FF',
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
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});