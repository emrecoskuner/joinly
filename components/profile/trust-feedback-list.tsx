import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { TrustFeedbackItem } from '@/services/ratings';

type TrustFeedbackListProps = {
  items: TrustFeedbackItem[];
  emptyMessage: string;
};

export function TrustFeedbackList({ items, emptyMessage }: TrustFeedbackListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.reviewerRow}>
              {item.reviewerAvatarUrl ? (
                <Image contentFit="cover" source={{ uri: item.reviewerAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <ThemedText style={styles.avatarFallbackText}>{item.reviewerInitials}</ThemedText>
                </View>
              )}
              <View style={styles.reviewerCopy}>
                <ThemedText style={styles.reviewerName}>{item.reviewerName}</ThemedText>
                {item.activityTitle || item.activityStartsAt ? (
                  <ThemedText style={styles.metaText}>
                    {buildActivityLabel(item.activityTitle, item.activityStartsAt)}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            <View style={styles.scorePill}>
              <MaterialIcons color="#D89E35" name="star" size={14} />
              <ThemedText style={styles.scoreText}>{item.score.toFixed(1)}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.commentText}>{item.comment}</ThemedText>
        </View>
      ))}
    </View>
  );
}

function buildActivityLabel(activityTitle?: string, activityStartsAt?: string) {
  if (!activityTitle && !activityStartsAt) {
    return '';
  }

  if (!activityStartsAt) {
    return activityTitle ?? '';
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(activityStartsAt));

  return activityTitle ? `${activityTitle} • ${formattedDate}` : formattedDate;
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    gap: 12,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  emptyCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  emptyText: {
    color: '#6B6359',
    fontSize: 14,
    lineHeight: 21,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBDCC6',
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBDCC6',
  },
  avatarFallbackText: {
    color: '#6A5237',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  reviewerCopy: {
    flex: 1,
    gap: 3,
  },
  reviewerName: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  metaText: {
    color: '#847B70',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FBF3E5',
  },
  scoreText: {
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
