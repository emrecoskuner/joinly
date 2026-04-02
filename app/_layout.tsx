import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { secondaryStackScreenOptions } from '@/components/navigation/secondary-stack-screen-options';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityStoreProvider } from '@/store/activity-store';
import { ProfileStoreProvider } from '@/store/profile-store';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ActivityStoreProvider>
        <ProfileStoreProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ProtectedNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </ProfileStoreProvider>
      </ActivityStoreProvider>
    </AuthProvider>
  );
}

function ProtectedNavigator() {
  const { loading, session } = useAuth();
  const segments = useSegments();
  const firstSegment = segments[0];
  const isAuthRoute = firstSegment === 'sign-in' || firstSegment === 'sign-up';

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#5B4630" size="large" />
        <ThemedText style={styles.loadingText}>Loading Joinly...</ThemedText>
      </View>
    );
  }

  if (!session) {
    if (!isAuthRoute) {
      return <Redirect href="/sign-in" />;
    }

    return (
      <Stack screenOptions={secondaryStackScreenOptions}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      </Stack>
    );
  }

  if (isAuthRoute) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  return (
    <Stack screenOptions={secondaryStackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create" options={{ presentation: 'card' }} />
      <Stack.Screen name="activity/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="event/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="chat/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="user/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/edit-about" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/edit-interests" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/activities/[kind]" options={{ presentation: 'card' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
