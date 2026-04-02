import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { StackBackButton } from '@/components/navigation/stack-back-button';

export const secondaryStackScreenOptions: NativeStackNavigationOptions = {
  headerBackVisible: false,
  headerLeft: () => <StackBackButton />,
  headerShadowVisible: false,
  headerTitle: '',
  headerStyle: {
    backgroundColor: '#FFF8F0',
  },
  headerTintColor: '#171411',
};
