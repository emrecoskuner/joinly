import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getActivityTimeState } from '@/lib/activity-time';
import type { Activity } from '@/store/activity-store';
import {
  buildCreatedActivityDateTime,
  formatActivitySchedule,
  getActivityAccentColor,
} from '@/store/activity-store';

type MyActivityCardProps = {
  activity: Activity;
  onPress?: () => void;
};

type AddActivityCardProps = {
  onPress: () => void;
};

export function MyActivityCard({ activity, onPress }: MyActivityCardProps) {
  const accentColor = getActivityAccentColor(activity.type);
  const timeState = getActivityTimeState({
    startsAt: buildCreatedActivityDateTime(activity),
    status: activity.status,
  });

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: `${accentColor}18` }]}>
            <ThemedText style={[styles.typeBadgeText, { color: accentColor }]}>
              {activity.type}
            </ThemedText>
          </View>
          {timeState === 'happening-now' ? (
            <View style={styles.happeningBadge}>
              <ThemedText style={styles.happeningBadgeText}>Happening now</ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={styles.limitText}>Up to {activity.participantLimit}</ThemedText>
      </View>

      <ThemedText numberOfLines={2} style={styles.title}>
        {activity.title}
      </ThemedText>

      <View style={styles.metaList}>
        <MetaRow icon="schedule" value={formatActivitySchedule(activity)} />
        <MetaRow icon="place" value={activity.location} />
      </View>
    </Pressable>
  );
}

export function AddActivityCard({ onPress }: AddActivityCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addCard, pressed ? styles.addCardPressed : null]}>
      <View style={styles.addIconWrap}>
        <MaterialIcons name="add" size={24} color="#5B4630" />
      </View>
      <ThemedText style={styles.addTitle}>Create</ThemedText>
      <ThemedText style={styles.addBody}>Add a new plan</ThemedText>
    </Pressable>
  );
}

function MetaRow({ icon, value }: { icon: keyof typeof MaterialIcons.glyphMap; value: string }) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons color="#7B756C" name={icon} size={15} />
      <ThemedText numberOfLines={1} style={styles.metaText}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 224,
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 253, 249, 0.96)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    shadowColor: '#1A1714',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  happeningBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E7F4EE',
  },
  happeningBadgeText: {
    color: '#2A6B59',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  limitText: {
    color: '#8B8378',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  title: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
    minHeight: 46,
  },
  metaList: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    color: '#5E584F',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  addCard: {
    width: 140,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#F5EEE4',
    borderWidth: 1,
    borderColor: '#E6D8C4',
    borderStyle: 'dashed',
  },
  addCardPressed: {
    opacity: 0.92,
  },
  addIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EADCC7',
  },
  addTitle: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  addBody: {
    color: '#746D63',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
