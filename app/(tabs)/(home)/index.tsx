import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useDeferredValue, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityFilterChip } from '@/components/home/activity-filter-chip';
import { EventCard } from '@/components/home/event-card';
import { HomeHeader } from '@/components/home/home-header';
import { AddActivityCard, MyActivityCard } from '@/components/home/my-activity-card';
import { SearchBar } from '@/components/home/search-bar';
import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { resolveEventParticipationStatus, useActivityStore } from '@/store/activity-store';
import { useProfileStore } from '@/store/profile-store';
import { formatProfileHandle } from '@/services/profiles';

export default function HomeScreen() {
  const {
    browseEvents,
    createdActivities,
    currentUserId,
    isLoadingActivities,
    participationByEventId,
    joinEvent,
    requestToJoinEvent,
  } = useActivityStore();
  const { profile } = useProfileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const hasActiveSearch = normalizedQuery.length > 0;
  const filteredCreatedActivities = createdActivities.filter((activity) =>
    matchesSearchQuery(normalizedQuery, [
      activity.title,
      activity.type,
      activity.location,
      activity.description,
    ])
  );
  const filteredFeaturedEvents = browseEvents.filter((event) =>
    matchesCategory(event.category, selectedCategory) &&
    matchesSearchQuery(normalizedQuery, [
      event.title,
      event.activityType,
      event.category,
      event.location,
      event.description,
    ])
  );
  const hasResults = filteredCreatedActivities.length > 0 || filteredFeaturedEvents.length > 0;

  const handleStatusAction = async (eventId: string, isPrivateActivity: boolean) => {
    const { error } = isPrivateActivity ? await requestToJoinEvent(eventId) : await joinEvent(eventId);

    if (error) {
      Alert.alert('Action unavailable', error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <HomeHeader
            greeting="Good morning,"
            userName={profile?.fullName.split(' ')[0] || 'New user'}
            location={profile?.occupation || formatProfileHandle(profile?.username ?? 'newuser')}
          />

          <SearchBar
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Find coffee chats, runs, and hangouts"
            value={searchQuery}
          />

          {filteredCreatedActivities.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>My Activities</ThemedText>
                <ThemedText style={styles.sectionAction}>
                  {filteredCreatedActivities.length} active
                </ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.myActivitiesRow}>
                {filteredCreatedActivities.map((activity) => (
                  <MyActivityCard
                    key={activity.id}
                    activity={activity}
                    onPress={() =>
                      router.push({
                        pathname: '/activity/[id]',
                        params: { id: activity.id },
                      })
                    }
                  />
                ))}
                <AddActivityCard onPress={() => router.push('/create')} />
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Browse activities</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}>
              {ACTIVITY_CATEGORIES.map((filter) => (
                <ActivityFilterChip
                  key={filter.id}
                  color={filter.color}
                  label={filter.label}
                  icon={filter.icon}
                  isActive={selectedCategory === filter.label}
                  onPress={() =>
                    setSelectedCategory((currentValue) =>
                      currentValue === filter.label ? null : filter.label
                    )
                  }
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {hasActiveSearch || selectedCategory ? 'Filtered Activities' : 'Happening nearby'}
              </ThemedText>
              <ThemedText style={styles.sectionAction}>
                {hasActiveSearch || selectedCategory ? `${filteredFeaturedEvents.length} matches` : 'See all'}
              </ThemedText>
            </View>
            {hasResults ? (
              <View style={styles.cardsColumn}>
                {filteredFeaturedEvents.length > 0 ? (
                  filteredFeaturedEvents.map((event) => {
                    const participationStatus = resolveEventParticipationStatus(
                      event,
                      participationByEventId,
                      currentUserId
                    );

                    return (
                      <EventCard
                        key={event.id}
                        event={event}
                        participationStatus={participationStatus}
                        onStatusActionPress={() => {
                          void handleStatusAction(event.id, event.privacyType !== 'Public');
                        }}
                        onPress={() =>
                          router.push({
                            pathname: '/event/[id]',
                            params: { id: event.id },
                          })
                        }
                      />
                    );
                  })
                ) : hasActiveSearch || selectedCategory ? (
                  <View style={styles.emptyStateCard}>
                    <ThemedText style={styles.emptyStateTitle}>
                      {isLoadingActivities
                        ? 'Loading activities'
                        : getEmptyStateTitle(selectedCategory, hasActiveSearch)}
                    </ThemedText>
                    <ThemedText style={styles.emptyStateBody}>
                      {isLoadingActivities
                        ? 'Pulling the latest active plans from Joinly.'
                        : getEmptyStateBody(selectedCategory, hasActiveSearch)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.cardsColumn}>
                <View style={styles.emptyStateCard}>
                  <ThemedText style={styles.emptyStateTitle}>
                    {isLoadingActivities
                      ? 'Loading activities'
                      : getEmptyStateTitle(selectedCategory, hasActiveSearch)}
                  </ThemedText>
                  <ThemedText style={styles.emptyStateBody}>
                    {isLoadingActivities
                      ? 'Pulling the latest active plans from Joinly.'
                      : getEmptyStateBody(selectedCategory, hasActiveSearch)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF8F0',
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
    gap: 28,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#171411',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionAction: {
    color: '#7C7468',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  chipsRow: {
    gap: 10,
    paddingRight: 20,
  },
  myActivitiesRow: {
    gap: 12,
    paddingRight: 20,
  },
  cardsColumn: {
    gap: 16,
  },
  emptyStateCard: {
    gap: 10,
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
});

function matchesSearchQuery(query: string, fields: (string | undefined)[]) {
  if (!query) {
    return true;
  }

  return fields.some((field) => field?.toLowerCase().includes(query));
}

function matchesCategory(category: string, selectedCategory: string | null) {
  if (!selectedCategory) {
    return true;
  }

  return category === selectedCategory;
}

function getEmptyStateTitle(selectedCategory: string | null, hasActiveSearch: boolean) {
  if (selectedCategory && hasActiveSearch) {
    return 'No activities match this search';
  }

  if (selectedCategory) {
    return 'No activities found for this category';
  }

  if (hasActiveSearch) {
    return 'No activities found';
  }

  return 'No activities found';
}

function getEmptyStateBody(selectedCategory: string | null, hasActiveSearch: boolean) {
  if (selectedCategory && hasActiveSearch) {
    return `Try a different keyword or switch from ${selectedCategory} to another category.`;
  }

  if (selectedCategory) {
    return `There are no ${selectedCategory} activities available right now.`;
  }

  if (hasActiveSearch) {
    return 'Try a different keyword.';
  }

  return 'Try a different keyword.';
}
