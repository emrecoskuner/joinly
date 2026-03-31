import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { getMockUserProfileById } from '@/components/profile/mock-user-profiles';
import { ThemedText } from '@/components/themed-text';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = id ? getMockUserProfileById(id) : undefined;

  if (!profile) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>Profile not found</ThemedText>
            <ThemedText style={styles.emptyStateBody}>
              This person is not available in the current mock data.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const interestTags = ACTIVITY_CATEGORIES.filter((category) =>
    profile.interestLabels.includes(category.label)
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
              <Image contentFit="cover" source={{ uri: profile.photoUrl }} style={styles.photo} />
              <View style={styles.ratingPill}>
                <MaterialIcons color="#D89E35" name="star" size={15} />
                <ThemedText style={styles.ratingText}>{profile.rating.toFixed(1)}</ThemedText>
              </View>
            </View>

            <View style={styles.identityBlock}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.name}>{profile.name}</ThemedText>
                <ThemedText style={styles.shortInfo}>{profile.shortInfo}</ThemedText>
              </View>

              <View style={styles.statsRow}>
                <MiniStat label="Hosted" value={`${profile.hostedCount}`} />
                <MiniStat label="Joined" value={`${profile.joinedCount}`} />
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
            <View style={styles.tagsWrap}>
              {interestTags.map((tag) => (
                <View key={tag.id} style={styles.tagChip}>
                  <MaterialIcons color="#5E584F" name={tag.icon} size={16} />
                  <ThemedText style={styles.tagText}>{tag.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Comments</ThemedText>
            <View style={styles.commentsCard}>
              {profile.comments.length > 0 ? (
                profile.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <ThemedText style={styles.commentName}>{comment.reviewerName}</ThemedText>
                      <View style={styles.commentRating}>
                        <MaterialIcons color="#D89E35" name="star" size={14} />
                        <ThemedText style={styles.commentRatingText}>
                          {comment.rating.toFixed(1)}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
                  </View>
                ))
              ) : (
                <View style={styles.commentItem}>
                  <ThemedText style={styles.commentText}>
                    No comments yet. Early trust signals will appear here as people attend activities together.
                  </ThemedText>
                </View>
              )}
            </View>
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
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 80,
    gap: 22,
  },
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
  photoColumn: {
    width: 98,
    gap: 8,
  },
  photo: {
    width: 98,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#EBDCC6',
  },
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
  ratingText: {
    color: '#4A4032',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  identityBlock: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  nameRow: {
    gap: 6,
  },
  name: {
    color: '#171411',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  shortInfo: {
    color: '#6E665B',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  miniStatValue: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  miniStatLabel: {
    color: '#7C7468',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    color: '#171411',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  aboutCard: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  aboutText: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 23,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F0E6DA',
  },
  tagText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  commentsCard: {
    gap: 12,
  },
  commentItem: {
    gap: 10,
    padding: 18,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  commentName: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  commentRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FBF3E5',
  },
  commentRatingText: {
    color: '#4A4032',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  commentText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 21,
  },
  emptyStateCard: {
    gap: 10,
    padding: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    margin: 20,
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
