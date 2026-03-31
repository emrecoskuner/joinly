import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/navigation/custom-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'none',
        },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen
        name="(explore)"
        options={{
          title: 'Activities',
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
