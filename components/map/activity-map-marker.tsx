import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

import { getActivityCategoryByLabel } from '@/constants/activity-categories';

export function ActivityMapMarker({ category }: { category: string }) {
  const activityCategory = getActivityCategoryByLabel(category);

  return (
    <View style={[styles.markerOuter, { borderColor: `${activityCategory.color}66` }]}>
      <View style={[styles.markerInner, { backgroundColor: activityCategory.color }]}>
        <MaterialIcons
          color="#FFFDFC"
          name={activityCategory.icon as keyof typeof MaterialIcons.glyphMap}
          size={18}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 253, 249, 0.96)',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1714',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  markerInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
