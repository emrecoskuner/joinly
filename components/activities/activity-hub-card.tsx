import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ActivityHubItem } from '@/components/activities/mock-activity-hub';

type ActivityHubCardProps = {
  activity: ActivityHubItem;
  view: 'upcoming' | 'pending' | 'past';
  onPress: () => void;
};

export function ActivityHubCard({ activity, view, onPress }: ActivityHubCardProps) {
  const roleLabel =
    activity.participationStatus === 'pending'
      ? 'Request Pending'
      : activity.participationStatus === 'hosting'
        ? view === 'past'
          ? 'Hosted'
          : 'Hosting'
        : 'Joined';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        view === 'past' ? styles.cardPast : null,
        pressed ? styles.cardPressed : null,
      ]}>
      <View style={styles.headerRow}>
        <View style={styles.headerBadges}>
          <View
            style={[
              styles.rolePill,
              activity.participationStatus === 'pending' ? styles.pendingPill : null,
            ]}>
            <ThemedText
              style={[
                styles.roleText,
                activity.participationStatus === 'pending' ? styles.pendingText : null,
              ]}>
              {roleLabel}
            </ThemedText>
          </View>
          {activity.isHappeningNow ? (
            <View style={styles.livePill}>
              <ThemedText style={styles.liveText}>Happening now</ThemedText>
            </View>
          ) : null}
        </View>
        <MaterialIcons color="#9A9388" name="chevron-right" size={18} />
      </View>

      <ThemedText numberOfLines={2} style={styles.title}>
        {activity.title}
      </ThemedText>

      <View style={styles.metaList}>
        <MetaRow icon="schedule" value={activity.timeLabel} />
        <MetaRow icon="place" value={activity.shortLocation} />
      </View>

      <View style={styles.footerRow}>
        {typeof activity.participantCount === 'number' ? (
          <View style={styles.infoPill}>
            <MaterialIcons color="#4E4A43" name="group" size={14} />
            <ThemedText style={styles.infoPillText}>{activity.participantCount}</ThemedText>
          </View>
        ) : (
          <View />
        )}

        {activity.participationStatus !== 'hosting' && activity.hostInitials ? (
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <ThemedText style={styles.hostAvatarText}>{activity.hostInitials}</ThemedText>
            </View>
            <ThemedText style={styles.hostName}>{activity.hostName}</ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function MetaRow({
  icon,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons color="#7B756C" name={icon} size={16} />
      <ThemedText numberOfLines={1} style={styles.metaText}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    shadowColor: '#1A1714',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardPast: {
    backgroundColor: '#FCF8F3',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerBadges: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5EEE4',
  },
  pendingPill: {
    backgroundColor: '#F2E5D1',
  },
  roleText: {
    color: '#5E584F',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  pendingText: {
    color: '#5C4630',
  },
  livePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E7F4EE',
  },
  liveText: {
    color: '#2A6B59',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
  },
  title: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.3,
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
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#F7F2EA',
  },
  infoPillText: {
    color: '#4E4A43',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0E6D8',
  },
  hostAvatarText: {
    color: '#6A5237',
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '800',
  },
  hostName: {
    color: '#6B6359',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
