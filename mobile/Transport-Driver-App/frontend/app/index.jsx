// app/index.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexScreen() {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try fetching token and role

        const token = await AsyncStorage.getItem('access_token');
        const role = await AsyncStorage.getItem('user_role');

        if (token && role) {
          // ✅ User is authenticated → go to role-specific home
          router.replace(`/(app)/(${role})/home`);
        } else {
          // ❌ Missing token or role → go to role selection
          router.replace('/(auth)/role');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        // In case of any error, fall back to role selection
        router.replace('/(auth)/role');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1e09deff" />
    </View>
  );
}
