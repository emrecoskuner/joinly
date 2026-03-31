import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { secondaryStackScreenOptions } from '@/components/navigation/secondary-stack-screen-options';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityStoreProvider } from '@/store/activity-store';
import { ProfileStoreProvider } from '@/store/profile-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ActivityStoreProvider>
      <ProfileStoreProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={secondaryStackScreenOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="create"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="activity/[id]"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="profile/edit-about"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="profile/edit-interests"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="profile/activities/[kind]"
              options={{
                presentation: 'card',
              }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ProfileStoreProvider>
    </ActivityStoreProvider>
  );
}
