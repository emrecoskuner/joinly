import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { getProfileActivityCollections, type ProfileActivityItem } from '@/services/profiles';
import { useProfileStore } from '@/store/profile-store';

type ActivityKind = 'upcoming' | 'hosted' | 'joined';

export default function ProfileActivityListScreen() {
  const { kind } = useLocalSearchParams<{ kind: ActivityKind }>();
  const { profile } = useProfileStore();
  const [collections, setCollections] = useState<{
    upcoming: ProfileActivityItem[];
    hostedHistory: ProfileActivityItem[];
    pastJoined: ProfileActivityItem[];
  }>({
    upcoming: [],
    hostedHistory: [],
    pastJoined: [],
  });

  useEffect(() => {
    if (!profile?.id) {
      setCollections({ upcoming: [], hostedHistory: [], pastJoined: [] });
      return;
    }

    void getProfileActivityCollections(profile.id).then(({ data, error }) => {
      if (error) {
        console.log('ProfileActivityListScreen error', error);
        return;
      }

      setCollections(
        data ?? {
          upcoming: [],
          hostedHistory: [],
          pastJoined: [],
        }
      );
    });
  }, [profile?.id]);

  const screenConfig = getScreenConfig(kind, collections);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>{screenConfig.title}</ThemedText>
            <ThemedText style={styles.subtitle}>{screenConfig.subtitle}</ThemedText>
          </View>

          {screenConfig.items.length > 0 ? (
            <View style={styles.listColumn}>
              {screenConfig.items.map((activity) => (
                <View key={activity.id} style={styles.activityCard}>
                  <View style={styles.activityHeader}>
                    <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                    <View style={styles.activityPill}>
                      <ThemedText style={styles.activityPillText}>
                        {activity.hostedByMe ? 'Hosted' : 'Joined'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialIcons color="#7B756C" name="schedule" size={16} />
                    <ThemedText style={styles.metaText}>{activity.schedule}</ThemedText>
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialIcons color="#7B756C" name="place" size={16} />
                    <ThemedText style={styles.metaText}>{activity.location}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <ThemedText style={styles.emptyStateTitle}>Nothing here yet</ThemedText>
              <ThemedText style={styles.emptyStateBody}>{screenConfig.emptyMessage}</ThemedText>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function getScreenConfig(
  kind: ActivityKind | undefined,
  collections: {
    upcoming: ProfileActivityItem[];
    hostedHistory: ProfileActivityItem[];
    pastJoined: ProfileActivityItem[];
  }
) {
  switch (kind) {
    case 'hosted':
      return {
        title: 'Hosted Activities',
        subtitle: 'A look back at the real activities you have hosted before.',
        emptyMessage: 'Your hosted history will appear here once you have completed a few plans.',
        items: collections.hostedHistory,
      };
    case 'joined':
      return {
        title: 'Past Joined Activities',
        subtitle: 'A record of the real activities you joined through Joinly.',
        emptyMessage: 'Past joined activities will appear here once you start attending plans.',
        items: collections.pastJoined,
      };
    case 'upcoming':
    default:
      return {
        title: 'Upcoming Activities',
        subtitle: 'Everything on your horizon, whether you are hosting or joining.',
        emptyMessage: 'Upcoming activities will show up here once plans are on the calendar.',
        items: collections.upcoming,
      };
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F0' },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 20 },
  heroCard: {
    gap: 10,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  title: { color: '#171411', fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#5E584F', fontSize: 15, lineHeight: 22 },
  listColumn: { gap: 12 },
  activityCard: {
    gap: 12,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityTitle: { flex: 1, color: '#171411', fontSize: 18, lineHeight: 23, fontWeight: '700' },
  activityPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F5EEE4',
  },
  activityPillText: { color: '#5E584F', fontSize: 12, lineHeight: 15, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { color: '#5E584F', fontSize: 14, lineHeight: 19 },
  emptyStateCard: {
    gap: 10,
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  emptyStateTitle: { color: '#171411', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  emptyStateBody: { color: '#6A6258', fontSize: 15, lineHeight: 21 },
});
