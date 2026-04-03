import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import type { JoinlyMapProps } from '@/components/map/joinly-map.types';
import { ThemedText } from '@/components/themed-text';

export function JoinlyMap({ markers }: JoinlyMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialIcons color="#3F7C74" name="map" size={24} />
      </View>
      <ThemedText style={styles.title}>Map preview is available on mobile</ThemedText>
      <ThemedText style={styles.body}>
        Open Joinly on iOS or Android to view the live map. {markers.length} activities with
        saved coordinates are ready to display there.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EC',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#E4F0EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    color: '#665E54',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
