import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { StackBackButton } from '@/components/navigation/stack-back-button';

export const secondaryStackScreenOptions: NativeStackNavigationOptions = {
  headerBackVisible: false,
  headerLeft: () => <StackBackButton />,
  headerLeftContainerStyle: {
    paddingLeft: 20,
  },
  headerShadowVisible: false,
  headerTitle: '',
  headerStyle: {
    backgroundColor: '#FFF8F0',
  },
  headerTintColor: '#171411',
};
