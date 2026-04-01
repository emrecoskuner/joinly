import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getActivityCategoryByLabel } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import { EventItem } from '@/components/home/types';
import type { ParticipationStatus } from '@/store/activity-store';

type EventCardProps = {
  event: EventItem;
  participationStatus?: ParticipationStatus;
  onStatusActionPress?: () => void;
  onPress?: () => void;
};

export function EventCard({
  event,
  participationStatus = 'none',
  onStatusActionPress,
  onPress,
}: EventCardProps) {
  const category = getActivityCategoryByLabel(event.category);
  const accentColor = category.color;
  const statusLabel = getStatusLabel(participationStatus);
  const actionLabel = getActionLabel(event, participationStatus);

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.cardPressed : null]}>
      <View style={styles.topRow}>
        <View style={[styles.activityBadge, { backgroundColor: accentColor }]}>
          {category ? <MaterialIcons color="#FFFFFF" name={category.icon as ComponentProps<typeof MaterialIcons>['name']} size={14} /> : null}
          <ThemedText style={styles.activityBadgeText}>{event.activityType}</ThemedText>
        </View>
        <View style={styles.ratingPill}>
          <MaterialIcons name="star" size={16} color="#E0A93B" />
          <ThemedText style={styles.ratingText}>{event.rating.toFixed(1)}</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.title}>{event.title}</ThemedText>

      <View style={styles.metaList}>
        <MetaItem icon="schedule" value={event.time} />
        <MetaItem icon="place" value={event.location} />
      </View>

      <View style={styles.footer}>
        <View style={styles.hostRow}>
          <View style={[styles.avatar, { backgroundColor: `${accentColor}22` }]}>
            <ThemedText style={[styles.avatarText, { color: accentColor }]}>
              {event.hostInitials}
            </ThemedText>
          </View>
          <View style={styles.hostTextBlock}>
            <ThemedText style={styles.hostLabel}>Hosted by</ThemedText>
            <ThemedText style={styles.hostName}>{event.hostName}</ThemedText>
          </View>
        </View>

        <View style={styles.detailsColumn}>
          {statusLabel ? <StatusPill value={statusLabel} /> : null}
          {!statusLabel && actionLabel && onStatusActionPress ? (
            <Pressable
              accessibilityRole="button"
              onPress={(pressEvent) => {
                pressEvent.stopPropagation();
                onStatusActionPress();
              }}
              style={({ pressed }) => [
                styles.actionPill,
                pressed ? styles.actionPillPressed : null,
              ]}>
              <ThemedText style={styles.actionText}>{actionLabel}</ThemedText>
            </Pressable>
          ) : null}
          <DetailPill icon="group" value={`${event.participantCount} going`} />
          <DetailPill icon="shield" value={event.privacyType} />
        </View>
      </View>
    </Pressable>
  );
}

function MetaItem({ icon, value }: { icon: ComponentProps<typeof MaterialIcons>['name']; value: string }) {
  return (
    <View style={styles.metaItem}>
      <MaterialIcons name={icon} size={18} color="#7B756C" />
      <ThemedText style={styles.metaText}>{value}</ThemedText>
    </View>
  );
}

function DetailPill({
  icon,
  value,
}: {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  value: string;
}) {
  return (
    <View style={styles.detailPill}>
      <MaterialIcons name={icon} size={15} color="#4E4A43" />
      <ThemedText style={styles.detailText}>{value}</ThemedText>
    </View>
  );
}

function StatusPill({ value }: { value: string }) {
  return (
    <View style={styles.statusPill}>
      <ThemedText style={styles.statusText}>{value}</ThemedText>
    </View>
  );
}

function getStatusLabel(participationStatus: ParticipationStatus) {
  switch (participationStatus) {
    case 'hosting':
      return 'Hosting';
    case 'joined':
      return 'Joined';
    case 'pending':
      return 'Request Sent';
    case 'none':
    default:
      return null;
  }
}

function getActionLabel(
  event: Pick<EventItem, 'privacyType'>,
  participationStatus: ParticipationStatus
) {
  if (participationStatus !== 'none') {
    return null;
  }

  return event.privacyType === 'Public' ? 'Join' : 'Request';
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
    padding: 20,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A1714',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  activityBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FBF3E5',
  },
  ratingText: {
    color: '#4A4032',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  title: {
    color: '#171411',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  metaList: {
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  hostRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  hostTextBlock: {
    gap: 2,
  },
  hostLabel: {
    color: '#8A837A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  hostName: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  detailsColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#EEE6DA',
  },
  statusText: {
    color: '#5A5045',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#171411',
  },
  actionPillPressed: {
    opacity: 0.92,
  },
  actionText: {
    color: '#FFFDFC',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F7F2EA',
  },
  detailText: {
    color: '#4E4A43',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
