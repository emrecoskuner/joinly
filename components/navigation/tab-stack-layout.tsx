import { Stack } from 'expo-router';

import { secondaryStackScreenOptions } from '@/components/navigation/secondary-stack-screen-options';

export function TabStackLayout() {
  return (
    <Stack screenOptions={secondaryStackScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
