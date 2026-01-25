import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(driver)/home"
        options={{
          title: 'Driver Dashboard',
          headerBackVisible: false
        }}
      />
      <Stack.Screen
        name="(conductor)/home"
        options={{
          title: 'Conductor Dashboard',
          headerBackVisible: false
        }}
      />
    </Stack>
  );
}