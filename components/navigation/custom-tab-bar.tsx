import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconName = ComponentProps<typeof MaterialIcons>['name'];

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        pointerEvents="box-none"
        style={[
          styles.createDock,
          {
            bottom: insets.bottom + 38,
          },
        ]}>
        <View style={styles.createDockHalo}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create activity"
            onPress={() => router.push('/create')}
            style={styles.createButton}>
            <MaterialIcons name="add" size={24} color="#FFFDFC" />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.tabBar,
          {
            left: 16,
            right: 16,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10),
          },
        ]}>
        <View pointerEvents="none" style={styles.centerCutout} />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const iconName = getTabIcon(route.name, isFocused);

          return (
            <View
              key={route.key}
              style={[
                styles.tabSlot,
                index === 1 ? styles.leftCenterSlot : null,
                index === 2 ? styles.rightCenterSlot : null,
              ]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onLongPress={onLongPress}
                onPress={onPress}
                style={styles.tabButton}>
                <View style={[styles.iconWrap, isFocused ? styles.iconWrapActive : null]}>
                  <MaterialIcons
                    color={isFocused ? '#171411' : '#9B948B'}
                    name={iconName}
                    size={22}
                  />
                </View>
                <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
                  {label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function getTabIcon(routeName: string, isFocused: boolean): TabIconName {
  switch (routeName) {
    case '(home)':
      return isFocused ? 'home-filled' : 'home';
    case '(map)':
      return 'map';
    case '(explore)':
      return isFocused ? 'event-note' : 'event';
    case '(profile)':
      return isFocused ? 'person' : 'person-outline';
    default:
      return 'circle';
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 18,
    paddingHorizontal: 14,
    paddingTop: 18,
    borderTopWidth: 0,
    backgroundColor: '#FFFDFC',
    borderRadius: 28,
    shadowColor: '#1A1714',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    overflow: 'visible',
  },
  centerCutout: {
    position: 'absolute',
    alignSelf: 'center',
    top: -22,
    width: 112,
    height: 68,
    borderTopLeftRadius: 56,
    borderTopRightRadius: 56,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    backgroundColor: '#FFF8F0',
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
  },
  leftCenterSlot: {
    marginRight: 26,
  },
  rightCenterSlot: {
    marginLeft: 26,
  },
  tabButton: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#F3F2EF',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelActive: {
    color: '#171411',
  },
  labelInactive: {
    color: '#9B948B',
  },
  createDock: {
    position: 'absolute',
    zIndex: 2,
  },
  createDockHalo: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F1EF',
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#201C18',
    shadowColor: '#1A1714',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
