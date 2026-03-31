import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActivityCategoryByLabel } from '@/constants/activity-categories';
import { getFeaturedEventById } from '@/components/home/mock-data';
import { ThemedText } from '@/components/themed-text';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = id ? getFeaturedEventById(id) : undefined;
  const [actionState, setActionState] = useState<'idle' | 'joined' | 'requested'>('idle');

  if (!event) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>Activity not found</ThemedText>
            <ThemedText style={styles.emptyStateBody}>
              This activity could not be loaded from local mock data.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const category = getActivityCategoryByLabel(event.category);
  const isPrivateActivity = event.privacyType !== 'Public';
  const actionLabel =
    actionState === 'joined'
      ? 'Joined'
      : actionState === 'requested'
        ? 'Request Sent'
        : isPrivateActivity
          ? 'Request to Join'
          : 'Join Activity';

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={[styles.categoryPill, { backgroundColor: event.accentColor }]}>
                {category ? (
                  <MaterialIcons color="#FFFDFC" name={category.icon} size={14} />
                ) : null}
                <ThemedText style={styles.categoryPillText}>{event.category}</ThemedText>
              </View>
              <View style={styles.privacyPill}>
                <MaterialIcons color="#4E4A43" name="shield" size={14} />
                <ThemedText style={styles.privacyPillText}>{event.privacyType}</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.title}>{event.title}</ThemedText>

            <View style={styles.metaList}>
              <MetaRow icon="calendar-today" label="Date" value={event.dateLabel} />
              <MetaRow icon="schedule" label="Time" value={event.timeLabel} />
              <MetaRow icon="place" label="Location" value={event.location} />
              <MetaRow icon="category" label="Activity" value={event.category} />
            </View>

            {event.description ? (
              <View style={styles.notesCard}>
                <ThemedText style={styles.notesTitle}>About this activity</ThemedText>
                <ThemedText style={styles.notesBody}>{event.description}</ThemedText>
                {event.notes ? <ThemedText style={styles.notesDetail}>{event.notes}</ThemedText> : null}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={actionState !== 'idle'}
              onPress={() => setActionState(isPrivateActivity ? 'requested' : 'joined')}
              style={({ pressed }) => [
                styles.primaryAction,
                actionState !== 'idle' ? styles.primaryActionDisabled : null,
                pressed && actionState === 'idle' ? styles.buttonPressed : null,
              ]}>
              <ThemedText style={styles.primaryActionText}>{actionLabel}</ThemedText>
            </Pressable>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Host</ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/user/[id]',
                  params: { id: event.hostId },
                })
              }
              style={({ pressed }) => [styles.hostCard, pressed ? styles.cardPressed : null]}>
              <Image contentFit="cover" source={{ uri: event.hostPhotoUrl }} style={styles.hostPhoto} />
              <View style={styles.hostCopy}>
                <View style={styles.hostNameRow}>
                  <ThemedText style={styles.hostName}>{event.hostName}</ThemedText>
                  <View style={styles.ratingPill}>
                    <MaterialIcons color="#D89E35" name="star" size={14} />
                    <ThemedText style={styles.ratingText}>{event.rating.toFixed(1)}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.hostBio}>{event.hostBio}</ThemedText>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Participants</ThemedText>
              <ThemedText style={styles.sectionHint}>
                {event.participantCount}/{event.participantLimit}
              </ThemedText>
            </View>
            <View style={styles.participantList}>
              {event.participants.map((participant) => (
                <Pressable
                  key={participant.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/user/[id]',
                      params: { id: participant.userId },
                    })
                  }
                  style={({ pressed }) => [styles.participantRow, pressed ? styles.cardPressed : null]}>
                  <View style={[styles.participantAvatar, { backgroundColor: `${event.accentColor}1C` }]}>
                    <ThemedText style={[styles.participantAvatarText, { color: event.accentColor }]}>
                      {participant.initials}
                    </ThemedText>
                  </View>
                  <View style={styles.participantCopy}>
                    <ThemedText style={styles.participantName}>{participant.name}</ThemedText>
                    <View style={styles.participantMeta}>
                      <MaterialIcons color="#D89E35" name="star" size={13} />
                      <ThemedText style={styles.participantMetaText}>
                        {participant.rating.toFixed(1)} trusted
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIconWrap}>
        <MaterialIcons color="#655E54" name={icon} size={17} />
      </View>
      <View style={styles.metaCopy}>
        <ThemedText style={styles.metaLabel}>{label}</ThemedText>
        <ThemedText style={styles.metaValue}>{value}</ThemedText>
      </View>
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
    right: -24,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F1DFC3',
    opacity: 0.82,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 140,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F4E7D8',
    opacity: 0.92,
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
    gap: 18,
    padding: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryPillText: {
    color: '#FFFDFC',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F7F2EA',
  },
  privacyPillText: {
    color: '#4E4A43',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  title: {
    color: '#171411',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  metaList: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE7',
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    color: '#7C7468',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  metaValue: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  notesCard: {
    gap: 8,
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  notesTitle: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  notesBody: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 21,
  },
  notesDetail: {
    color: '#7C7468',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryAction: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  primaryActionDisabled: {
    backgroundColor: '#786F63',
  },
  primaryActionText: {
    color: '#FFFDFC',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.92,
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
  },
  sectionHint: {
    color: '#7C7468',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  hostCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  hostPhoto: {
    width: 78,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#EBDCC6',
  },
  hostCopy: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  hostNameRow: {
    gap: 8,
  },
  hostName: {
    color: '#171411',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '700',
  },
  ratingPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
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
  hostBio: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 21,
  },
  participantList: {
    gap: 12,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  participantCopy: {
    flex: 1,
    gap: 4,
  },
  participantName: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  participantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantMetaText: {
    color: '#766E64',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
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
