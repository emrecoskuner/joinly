import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { TrustFeedbackList } from '@/components/profile/trust-feedback-list';
import { ThemedText } from '@/components/themed-text';
import { formatProfileHandle, formatProfileShortInfo, getProfileById, type ProfileRecord } from '@/services/profiles';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    void getProfileById(id).then(({ data, error }) => {
      if (error) {
        console.log('UserProfileScreen error', error);
      }

      setProfile(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>Loading profile</ThemedText>
            <ThemedText style={styles.emptyStateBody}>Fetching the latest profile data.</ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>Profile not found</ThemedText>
            <ThemedText style={styles.emptyStateBody}>
              This person does not have a visible profile right now.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const interestTags = ACTIVITY_CATEGORIES.filter((category) =>
    profile.interests.includes(category.label)
  );

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
            <View style={styles.photoColumn}>
              {profile.avatarUrl ? (
                <Image contentFit="cover" source={{ uri: profile.avatarUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoFallback}>
                  <ThemedText style={styles.photoFallbackText}>{profile.initials}</ThemedText>
                </View>
              )}
              <View style={styles.ratingPill}>
                <MaterialIcons color="#D89E35" name="star" size={15} />
                <ThemedText style={styles.ratingText}>{profile.ratingAvg.toFixed(1)}</ThemedText>
              </View>
            </View>

            <View style={styles.identityBlock}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.name}>{profile.fullName}</ThemedText>
                <ThemedText style={styles.shortInfo}>{formatProfileShortInfo(profile)}</ThemedText>
                <ThemedText style={styles.handle}>{formatProfileHandle(profile.username)}</ThemedText>
              </View>

              <View style={styles.statsRow}>
                <MiniStat label="Hosted" value={`${profile.hostedCount}`} />
                <MiniStat label="Joined" value={`${profile.joinedCount}`} />
                <MiniStat label="Reviews" value={`${profile.ratingCount}`} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>About</ThemedText>
            <View style={styles.aboutCard}>
              <ThemedText style={styles.aboutText}>{profile.bio}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
            {interestTags.length > 0 ? (
              <View style={styles.tagsWrap}>
                {interestTags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[
                      styles.tagChip,
                      { backgroundColor: `${tag.color}14`, borderColor: `${tag.color}38` },
                    ]}>
                    <MaterialIcons
                      color={tag.color}
                      name={tag.icon as keyof typeof MaterialIcons.glyphMap}
                      size={16}
                    />
                    <ThemedText style={[styles.tagText, { color: tag.color }]}>{tag.label}</ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.aboutCard}>
                <ThemedText style={styles.aboutText}>No interests shared yet.</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Trust Feedback</ThemedText>
            <TrustFeedbackList
              emptyMessage="No written trust feedback yet."
              items={profile.trustFeedback}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <ThemedText style={styles.miniStatValue}>{value}</ThemedText>
      <ThemedText style={styles.miniStatLabel}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F0' },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -30,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F1DFC3',
    opacity: 0.82,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 140,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F4E7D8',
    opacity: 0.9,
  },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 22 },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
    padding: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  photoColumn: { width: 98, gap: 8 },
  photo: { width: 98, height: 100, borderRadius: 24, backgroundColor: '#EBDCC6' },
  photoFallback: {
    width: 98,
    height: 100,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBDCC6',
  },
  photoFallbackText: { color: '#6A5237', fontSize: 28, lineHeight: 32, fontWeight: '800' },
  ratingPill: {
    width: 98,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FBF3E5',
  },
  ratingText: { color: '#4A4032', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  identityBlock: { flex: 1, gap: 10, justifyContent: 'center' },
  nameRow: { gap: 6 },
  name: { color: '#171411', fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6 },
  shortInfo: { color: '#6E665B', fontSize: 14, lineHeight: 19, fontWeight: '600' },
  handle: { color: '#8A8378', fontSize: 13, lineHeight: 17, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  miniStat: {
    minWidth: 74,
    gap: 2,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE6DA',
  },
  miniStatValue: { color: '#171411', fontSize: 16, lineHeight: 20, fontWeight: '700' },
  miniStatLabel: { color: '#7C7468', fontSize: 11, lineHeight: 14, fontWeight: '700' },
  section: { gap: 14 },
  sectionTitle: { color: '#171411', fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  aboutCard: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  aboutText: { color: '#5E584F', fontSize: 15, lineHeight: 23 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagText: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
  commentsCard: { gap: 12 },
  commentItem: {
    gap: 10,
    padding: 18,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  commentText: { color: '#5E584F', fontSize: 14, lineHeight: 21 },
  emptyStateCard: {
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  emptyStateTitle: { color: '#171411', fontSize: 18, lineHeight: 22, fontWeight: '700' },
  emptyStateBody: { color: '#6A6258', fontSize: 15, lineHeight: 21 },
});
