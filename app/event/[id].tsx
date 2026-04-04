import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { getActivityCategoryByLabel } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import { canJoinActivity, isHappeningNow, isPastActivity } from '@/lib/activity-time';
import {
  buildCreatedActivityDateTime,
  canAccessActivityChat,
  isActivityEnded,
  mapActivityToEventItem,
  resolveEventParticipationStatus,
  syncEventParticipationForCurrentUser,
  useActivityStore,
  type ParticipationStatus,
} from '@/store/activity-store';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    browseEvents,
    createdActivities,
    currentTime,
    currentUserId,
    currentUserParticipant,
    endedActivitiesById,
    endActivity,
    participationByEventId,
    joinEvent,
    requestToJoinEvent,
    leaveActivity,
  } = useActivityStore();
  const [confirmAction, setConfirmAction] = useState<'leave' | 'end' | null>(null);
  const rawEvent = id
    ? browseEvents.find((event) => event.id === id) ??
      (() => {
        const hostedActivity = createdActivities.find((activity) => activity.id === id);

        if (!hostedActivity) {
          return undefined;
        }

        return {
          ...mapActivityToEventItem(hostedActivity),
          dateTimeIso: buildCreatedActivityDateTime(hostedActivity),
        };
      })()
    : undefined;
  const endedEvent = id ? endedActivitiesById[id] : undefined;
  const event = endedEvent
    ? endedEvent
    : rawEvent
      ? syncEventParticipationForCurrentUser(
          rawEvent,
          participationByEventId,
          currentUserId,
          currentUserParticipant
        )
      : undefined;

  if (!event) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyStateCard}>
            <ThemedText style={styles.emptyStateTitle}>Activity not found</ThemedText>
            <ThemedText style={styles.emptyStateBody}>
              This activity could not be loaded from Joinly.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const category = getActivityCategoryByLabel(event.category);
  const accentColor = category.color;
  const isPrivateActivity = event.privacyType !== 'Public';
  const isEnded = isActivityEnded(event.id, endedActivitiesById);
  const participationStatus = isEnded
    ? 'none'
    : resolveEventParticipationStatus(event, participationByEventId, currentUserId);
  const statusCopy = getParticipationStateCopy(participationStatus);
  const hasChatAccess = !isEnded && canAccessActivityChat(participationStatus);
  const isPast = isPastActivity({ startsAt: event.dateTimeIso, status: event.status }, currentTime);
  const isLive = isHappeningNow({ startsAt: event.dateTimeIso, status: event.status }, currentTime);
  const isJoinable = canJoinActivity(
    { startsAt: event.dateTimeIso, status: event.status },
    currentTime
  );
  const hasEnded = isEnded || isPast;
  const canLeave = participationStatus === 'joined' && !hasEnded;
  const canEndActivity = !hasEnded && participationStatus === 'hosting';

  const handleLeave = () => {
    setConfirmAction('leave');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmAction(null)}
        transparent
        visible={confirmAction !== null}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setConfirmAction(null)} />
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>
              {confirmAction === 'end' ? 'End activity?' : 'Leave activity?'}
            </ThemedText>
            <ThemedText style={styles.modalBody}>
              {confirmAction === 'end'
                ? 'This will cancel the activity for everyone and remove all participants.'
                : 'You will be removed from this activity.'}
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmAction(null)}
                style={({ pressed }) => [
                  styles.modalSecondaryAction,
                  pressed ? styles.buttonPressed : null,
                ]}>
                <ThemedText style={styles.modalSecondaryActionText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const nextAction = confirmAction;
                  setConfirmAction(null);
                  if (nextAction === 'end') {
                    void endActivity(event).then(({ error }) => {
                      if (error) {
                        Alert.alert('Unable to end activity', error.message);
                      }
                    });
                    return;
                  }
                  void leaveActivity(event.id).then(({ error }) => {
                    if (error) {
                      Alert.alert('Unable to leave activity', error.message);
                    }
                  });
                }}
                style={({ pressed }) => [
                  styles.modalDangerAction,
                  pressed ? styles.buttonPressed : null,
                ]}>
                <ThemedText style={styles.modalDangerActionText}>
                  {confirmAction === 'end' ? 'End Activity' : 'Leave'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroHeaderBadges}>
                <View style={[styles.categoryPill, { backgroundColor: accentColor }]}>
                  {category ? (
                    <MaterialIcons
                      color="#FFFDFC"
                      name={category.icon as keyof typeof MaterialIcons.glyphMap}
                      size={14}
                    />
                  ) : null}
                  <ThemedText style={styles.categoryPillText}>{event.category}</ThemedText>
                </View>
                {isLive ? (
                  <View style={styles.happeningPill}>
                    <ThemedText style={styles.happeningPillText}>Happening now</ThemedText>
                  </View>
                ) : null}
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

            {isEnded ? (
              <View style={styles.statusCard}>
                <ThemedText style={styles.statusCardLabel}>Activity Ended</ThemedText>
                <ThemedText style={styles.statusCardText}>
                  This activity has been cancelled and is no longer active.
                </ThemedText>
              </View>
            ) : participationStatus === 'none' && isJoinable ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const action = isPrivateActivity ? requestToJoinEvent : joinEvent;

                  void action(event.id).then(({ error }) => {
                    if (error) {
                      Alert.alert('Unable to update activity', error.message);
                    }
                  });
                }}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed ? styles.buttonPressed : null,
                ]}>
                <ThemedText style={styles.primaryActionText}>
                  {isPrivateActivity ? 'Request to Join' : 'Join Activity'}
                </ThemedText>
              </Pressable>
            ) : participationStatus === 'none' ? (
              <View style={styles.statusCard}>
                <ThemedText style={styles.statusCardLabel}>
                  {isLive ? 'Happening now' : 'Past activity'}
                </ThemedText>
                <ThemedText style={styles.statusCardText}>
                  {isLive
                    ? 'This activity has already started, so new join requests are closed.'
                    : 'This activity is no longer joinable.'}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.statusStack}>
                {isLive ? (
                  <View style={styles.statusCard}>
                    <ThemedText style={styles.statusCardLabel}>Happening now</ThemedText>
                    <ThemedText style={styles.statusCardText}>
                      This activity is in progress and stays visible here during its live window.
                    </ThemedText>
                  </View>
                ) : null}
                <View style={styles.statusCard}>
                  <ThemedText style={styles.statusCardLabel}>{statusCopy.label}</ThemedText>
                  <ThemedText style={styles.statusCardText}>{statusCopy.body}</ThemedText>
                </View>
                {hasChatAccess ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/chat/[id]',
                        params: { id: event.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.chatButton,
                      pressed ? styles.buttonPressed : null,
                    ]}>
                    <MaterialIcons color="#5E584F" name="chat-bubble-outline" size={18} />
                    <View style={styles.chatButtonCopy}>
                      <ThemedText style={styles.chatButtonLabel}>Chat</ThemedText>
                      <ThemedText style={styles.chatButtonBody}>
                        {hasEnded ? 'View conversation' : 'Open activity chat'}
                      </ThemedText>
                    </View>
                    <MaterialIcons color="#8A8278" name="chevron-right" size={20} />
                  </Pressable>
                ) : null}
              </View>
            )}
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
              {event.hostPhotoUrl ? (
                <Image contentFit="cover" source={{ uri: event.hostPhotoUrl }} style={styles.hostPhoto} />
              ) : (
                <View style={styles.hostPhotoFallback}>
                  <ThemedText style={styles.hostPhotoFallbackText}>{event.hostInitials}</ThemedText>
                </View>
              )}
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
                  <View style={[styles.participantAvatar, { backgroundColor: `${accentColor}1C` }]}>
                    <ThemedText style={[styles.participantAvatarText, { color: accentColor }]}>
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

          {canLeave ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleLeave}
              style={({ pressed }) => [
                styles.leaveButton,
                pressed ? styles.buttonPressed : null,
              ]}>
              <MaterialIcons color="#B14F46" name="logout" size={18} />
              <ThemedText style={styles.leaveButtonText}>Leave</ThemedText>
            </Pressable>
          ) : null}

          {canEndActivity ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setConfirmAction('end')}
              style={({ pressed }) => [
                styles.leaveButton,
                pressed ? styles.buttonPressed : null,
              ]}>
              <MaterialIcons color="#B14F46" name="event-busy" size={18} />
              <ThemedText style={styles.leaveButtonText}>End Activity</ThemedText>
            </Pressable>
          ) : null}
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

function getParticipationStateCopy(participationStatus: ParticipationStatus) {
  switch (participationStatus) {
    case 'hosting':
      return {
        label: 'Hosting',
        body: 'You are hosting this activity.',
      };
    case 'joined':
      return {
        label: 'Joined',
        body: 'You are confirmed for this activity.',
      };
    case 'pending':
      return {
        label: 'Request Sent',
        body: 'Your request is pending the host approval.',
      };
    case 'none':
    default:
      return {
        label: '',
        body: '',
      };
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(21, 17, 13, 0.22)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    gap: 14,
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  modalTitle: {
    color: '#171411',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  modalBody: {
    color: '#665D53',
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  modalSecondaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEE4',
  },
  modalSecondaryActionText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  modalDangerAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B14F46',
  },
  modalDangerActionText: {
    color: '#FFFDFC',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
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
  heroHeaderBadges: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  happeningPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E7F4EE',
  },
  happeningPillText: {
    color: '#2A6B59',
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
  statusCard: {
    gap: 6,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#F5EEE4',
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  statusCardLabel: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  statusCardText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  statusStack: {
    gap: 12,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EADFD0',
  },
  chatButtonCopy: {
    flex: 1,
    gap: 2,
  },
  chatButtonLabel: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  chatButtonBody: {
    color: '#6A6258',
    fontSize: 13,
    lineHeight: 18,
  },
  leaveButton: {
    alignSelf: 'stretch',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#FBEDEA',
    borderWidth: 1,
    borderColor: '#F1CDC8',
  },
  leaveButtonText: {
    color: '#B14F46',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  cardPressed: {
    opacity: 0.96,
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
  hostPhotoFallback: {
    width: 78,
    height: 92,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBDCC6',
  },
  hostPhotoFallbackText: {
    color: '#6A5237',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
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
