import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityHubCard } from '@/components/activities/activity-hub-card';
import { getActivityHubItems, type ActivityHubItem } from '@/components/activities/mock-activity-hub';
import { ThemedText } from '@/components/themed-text';
import { useActivityStore } from '@/store/activity-store';

type SegmentKey = 'upcoming' | 'pending' | 'past';

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'past', label: 'Past' },
];

export default function ActivitiesScreen() {
  const { createdActivities, participationByEventId } = useActivityStore();
  const [activeSegment, setActiveSegment] = useState<SegmentKey>('upcoming');
  const items = useMemo(
    () => getActivityHubItems(createdActivities ?? [], participationByEventId ?? {}),
    [createdActivities, participationByEventId]
  );
  const filteredItems = getFilteredItems(items, activeSegment);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>Activities</ThemedText>
            <ThemedText style={styles.subtitle}>
              Your personal hub for hosted plans, joined events, and pending requests.
            </ThemedText>
          </View>

          <View style={styles.segmentedControl}>
            {SEGMENTS.map((segment) => (
              <Pressable
                key={segment.key}
                accessibilityRole="button"
                onPress={() => setActiveSegment(segment.key)}
                style={({ pressed }) => [
                  styles.segmentButton,
                  activeSegment === segment.key ? styles.segmentButtonActive : null,
                  pressed ? styles.segmentButtonPressed : null,
                ]}>
                <ThemedText
                  style={[
                    styles.segmentLabel,
                    activeSegment === segment.key ? styles.segmentLabelActive : null,
                  ]}>
                  {segment.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {filteredItems.length > 0 ? (
            <View style={styles.listColumn}>
              {filteredItems.map((activity) => (
                <ActivityHubCard
                  key={`${activity.detailRoute}-${activity.id}-${activeSegment}`}
                  activity={activity}
                  onPress={() =>
                    router.push({
                      pathname: activity.detailRoute,
                      params: { id: activity.id },
                    })
                  }
                  view={activeSegment}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <ThemedText style={styles.emptyStateTitle}>{getEmptyTitle(activeSegment)}</ThemedText>
              <ThemedText style={styles.emptyStateBody}>{getEmptyBody(activeSegment)}</ThemedText>
              {activeSegment === 'upcoming' ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(tabs)/(home)')}
                  style={({ pressed }) => [
                    styles.emptyStateAction,
                    pressed ? styles.segmentButtonPressed : null,
                  ]}>
                  <ThemedText style={styles.emptyStateActionText}>Join or create one</ThemedText>
                </Pressable>
              ) : null}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getFilteredItems(items: ActivityHubItem[], segment: SegmentKey) {
  switch (segment) {
    case 'pending':
      return items
        .filter((activity) => activity.participationStatus === 'pending')
        .sort((a, b) => new Date(a.dateTimeIso).getTime() - new Date(b.dateTimeIso).getTime());
    case 'past':
      return items
        .filter(
          (activity) =>
            activity.isPast &&
            (activity.participationStatus === 'hosting' ||
              activity.participationStatus === 'joined')
        )
        .sort((a, b) => new Date(b.dateTimeIso).getTime() - new Date(a.dateTimeIso).getTime());
    case 'upcoming':
    default:
      return items
        .filter(
          (activity) =>
            !activity.isPast &&
            (activity.participationStatus === 'hosting' ||
              activity.participationStatus === 'joined')
        )
        .sort((a, b) => new Date(a.dateTimeIso).getTime() - new Date(b.dateTimeIso).getTime());
  }
}

function getEmptyTitle(segment: SegmentKey) {
  switch (segment) {
    case 'pending':
      return 'No pending requests';
    case 'past':
      return 'No past activities yet';
    case 'upcoming':
    default:
      return 'No upcoming activities';
  }
}

function getEmptyBody(segment: SegmentKey) {
  switch (segment) {
    case 'pending':
      return 'Requested activities will stay here until hosts review them.';
    case 'past':
      return 'Activities you hosted or joined will show up here once they are behind you.';
    case 'upcoming':
    default:
      return 'Join something new or create an activity to start filling your calendar.';
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F1DFC3',
    opacity: 0.8,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F4E7D8',
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 20,
  },
  heroCard: {
    gap: 10,
    padding: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 249, 0.9)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  title: {
    color: '#171411',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    borderRadius: 22,
    backgroundColor: '#F5EEE4',
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFDFC',
  },
  segmentButtonPressed: {
    opacity: 0.92,
  },
  segmentLabel: {
    color: '#7C7468',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  segmentLabelActive: {
    color: '#171411',
  },
  listColumn: {
    gap: 12,
  },
  emptyStateCard: {
    gap: 12,
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  emptyStateTitle: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  emptyStateBody: {
    color: '#6A6258',
    fontSize: 15,
    lineHeight: 21,
  },
  emptyStateAction: {
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  emptyStateActionText: {
    color: '#FFFDFC',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
});
