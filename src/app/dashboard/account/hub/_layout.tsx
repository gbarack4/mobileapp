import { Stack } from 'expo-router';

export default function HubAccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="personal-info"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="security"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="privacy-data"
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
