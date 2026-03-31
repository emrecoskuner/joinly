import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type HomeHeaderProps = {
  greeting: string;
  userName: string;
  location: string;
};

export function HomeHeader({ greeting, userName, location }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        <ThemedText style={styles.kicker}>{greeting}</ThemedText>
        <ThemedText style={styles.title}>{userName}</ThemedText>
      </View>
      <View style={styles.locationPill}>
        <MaterialIcons name="place" size={16} color="#4F4B45" />
        <ThemedText numberOfLines={1} style={styles.locationText}>
          {location}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  textBlock: {
    gap: 6,
  },
  kicker: {
    color: '#7C7468',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  title: {
    color: '#171411',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  locationPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F0E6D8',
  },
  locationText: {
    color: '#4F4B45',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
  },
});
