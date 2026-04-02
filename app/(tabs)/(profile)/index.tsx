import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { getProfileActivityCollections, profileData } from '@/components/profile/mock-profile';
import { ThemedText } from '@/components/themed-text';
import { useActivityStore } from '@/store/activity-store';
import { useProfileStore } from '@/store/profile-store';

export default function ProfileScreen() {
  const { createdActivities } = useActivityStore();
  const { aboutMe, selectedInterestIds } = useProfileStore();
  const { upcoming, hostedHistory, pastJoined } = getProfileActivityCollections(createdActivities);
  const hostedCount = profileData.hostedBaseCount + createdActivities.length;
  const interestTags = ACTIVITY_CATEGORIES.filter((category) =>
    selectedInterestIds.includes(category.label)
  );

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
          <View style={styles.heroCard}>
            <View style={styles.photoColumn}>
              <Image contentFit="cover" source={{ uri: profileData.photoUrl }} style={styles.photo} />
              <View style={styles.ratingPill}>
                <MaterialIcons color="#D89E35" name="star" size={15} />
                <ThemedText style={styles.ratingText}>{profileData.rating.toFixed(1)}</ThemedText>
              </View>
            </View>

            <View style={styles.identityBlock}>
              <View style={styles.nameRow}>
                <ThemedText style={styles.name}>{profileData.name}</ThemedText>
                <ThemedText style={styles.shortInfo}>{profileData.shortInfo}</ThemedText>
              </View>

              <View style={styles.statsRow}>
                <MiniStat label="Hosted" value={`${hostedCount}`} />
                <MiniStat label="Joined" value={`${profileData.joinedCount}`} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>About Me</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile/edit-about')}
                style={({ pressed }) => [styles.editButton, pressed ? styles.buttonPressed : null]}>
                <MaterialIcons color="#5B4630" name="edit" size={16} />
              </Pressable>
            </View>
            <View style={styles.aboutCard}>
              <ThemedText style={styles.aboutText}>{aboutMe}</ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Interests</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile/edit-interests')}
                style={({ pressed }) => [styles.editButton, pressed ? styles.buttonPressed : null]}>
                <MaterialIcons color="#5B4630" name="edit" size={16} />
              </Pressable>
            </View>
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
          </View>

          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/profile/activities/upcoming')}
              style={({ pressed }) => [
                styles.wideActivityCard,
                pressed ? styles.cardPressed : null,
              ]}>
              <ActivityCardHeader title="Upcoming" count={upcoming.length} />
              <PreviewList
                emptyLabel="No upcoming plans yet"
                items={upcoming.map((activity) => activity.title)}
              />
            </Pressable>

            <View style={styles.activityRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile/activities/hosted')}
                style={({ pressed }) => [
                  styles.smallActivityCard,
                  pressed ? styles.cardPressed : null,
                ]}>
                <ActivityCardHeader title="Hosted" count={hostedHistory.length} />
                <PreviewList
                  emptyLabel="No hosted history yet"
                  items={hostedHistory.map((activity) => activity.title)}
                />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/profile/activities/joined')}
                style={({ pressed }) => [
                  styles.smallActivityCard,
                  pressed ? styles.cardPressed : null,
                ]}>
                <ActivityCardHeader title="Past Joined" count={pastJoined.length} />
                <PreviewList
                  emptyLabel="No joined history yet"
                  items={pastJoined.map((activity) => activity.title)}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Comments</ThemedText>
            <View style={styles.commentsCard}>
              {profileData.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentIdentity}>
                      <View style={styles.commentAvatar}>
                        <ThemedText style={styles.commentAvatarText}>
                          {comment.reviewerName
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.commentName}>{comment.reviewerName}</ThemedText>
                    </View>
                    <View style={styles.commentRating}>
                      <MaterialIcons color="#D89E35" name="star" size={14} />
                      <ThemedText style={styles.commentRatingText}>
                        {comment.rating.toFixed(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
                </View>
              ))}
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

function ActivityCardHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.activityCardHeader}>
      <View style={styles.activityTitleRow}>
        <ThemedText style={styles.activityCardTitle}>{title}</ThemedText>
        <View style={styles.activityCountPill}>
          <ThemedText style={styles.activityCountText}>{count}</ThemedText>
        </View>
      </View>
      <MaterialIcons color="#8A8378" name="chevron-right" size={20} />
    </View>
  );
}

function PreviewList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <ThemedText style={styles.emptyPreviewText}>{emptyLabel}</ThemedText>;
  }

  return (
    <View style={styles.previewList}>
      {items.slice(0, 3).map((item) => (
        <View key={item} style={styles.previewRow}>
          <View style={styles.previewDot} />
          <ThemedText numberOfLines={1} style={styles.previewText}>
            {item}
          </ThemedText>
        </View>
      ))}
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
    paddingBottom: 120,
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
    shadowColor: '#1A1714',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEE4',
  },
  buttonPressed: {
    opacity: 0.9,
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
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  wideActivityCard: {
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallActivityCard: {
    flex: 1,
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    minHeight: 160,
  },
  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCardTitle: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  activityCountPill: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F5EEE4',
    alignItems: 'center',
  },
  activityCountText: {
    color: '#5E584F',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '800',
  },
  previewList: {
    gap: 10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D6C3AB',
  },
  previewText: {
    flex: 1,
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyPreviewText: {
    color: '#8A8378',
    fontSize: 14,
    lineHeight: 20,
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
  commentIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8D8',
  },
  commentAvatarText: {
    color: '#6A5237',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
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
});
