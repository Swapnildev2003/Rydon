import { Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f08710ff', // Your brand color
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerTitleAlign: 'center',
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="role"
        options={{
          title: 'Select Role',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="signup"
        options={{

          headerTitle: () => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Sign Up</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="login"
        options={{

          headerBackVisible: true,

          headerTitle: () => (
            <View >

              <Text style={{ color: '#fff', fontSize: 18, marginBottom: 8 }}>Login in </Text>
            </View>
          ),
        }}
      />

    </Stack>
  );
}