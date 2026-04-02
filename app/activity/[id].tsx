import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ParticipantRow } from '@/components/activity-management/participant-row';
import {
  FieldCard,
  FormSection,
  OptionCard,
  SelectablePill,
} from '@/components/create/create-form-ui';
import { ThemedText } from '@/components/themed-text';
import {
  buildCreatedActivityDateTime,
  isActivityPast,
  mapActivityToEventItem,
  useActivityStore,
} from '@/store/activity-store';
import type { ApprovalMode, Visibility } from '@/services/activities';

type DateTimePickerMode = 'date' | 'time';

const PARTICIPANT_LIMITS = [2, 3, 4, 5, 6, 8, 10];

export default function ActivityManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    createdActivities,
    updateActivity,
    approveParticipant,
    rejectParticipant,
    removeParticipant,
    endActivity,
  } = useActivityStore();
  const activity = createdActivities.find((item) => item.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [participantLimit, setParticipantLimit] = useState(4);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('manual');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<DateTimePickerMode | null>(null);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);

  if (!activity) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.missingState}>
            <ThemedText style={styles.missingTitle}>Activity not found</ThemedText>
            <ThemedText style={styles.missingBody}>
              This plan is no longer in local state. Create a new one and it will appear here.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(tabs)/(home)')}
              style={({ pressed }) => [styles.primaryAction, pressed ? styles.actionPressed : null]}>
              <ThemedText style={styles.primaryActionText}>Back to Home</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const approvedCount = activity.approvedParticipants.length;
  const pendingCount = activity.pendingParticipants.length;
  const spotsLeft = Math.max(activity.participantLimit - approvedCount, 0);
  const hasEnded = isActivityPast(buildCreatedActivityDateTime(activity));
  const formattedDate = formatDateLabel(new Date(activity.date));
  const formattedTime = formatTimeLabel(new Date(activity.time));
  const editDateLabel = selectedDate ? formatDateLabel(selectedDate) : formattedDate;
  const editTimeLabel = selectedTime ? formatTimeLabel(selectedTime) : formattedTime;
  const pickerValue = activePicker === 'time' ? selectedTime ?? new Date(activity.time) : selectedDate ?? new Date(activity.date);

  const beginEditing = () => {
    setTitle(activity.title);
    setDescription(activity.description);
    setLocation(activity.location);
    setParticipantLimit(activity.participantLimit);
    setApprovalMode(activity.approvalMode);
    setVisibility(activity.visibility);
    setSelectedDate(new Date(activity.date));
    setSelectedTime(new Date(activity.time));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setActivePicker(null);
    setIsEditing(false);
  };

  const saveEdits = () => {
    const nextDate = selectedDate ?? new Date(activity.date);
    const nextTime = selectedTime ?? new Date(activity.time);

    if (participantLimit < activity.approvedParticipants.length) {
      Alert.alert(
        'Participant limit too low',
        `You already have ${activity.approvedParticipants.length} approved participants. Increase the limit or remove someone first.`
      );
      return;
    }

    void updateActivity(activity.id, {
      title: title.trim() || `${activity.type} Meetup`,
      description: description.trim() || 'New activity created on Joinly.',
      location: location.trim() || 'Location TBD',
      participantLimit,
      approvalMode,
      visibility,
      date: nextDate.toISOString(),
      time: nextTime.toISOString(),
    }).then(({ error }) => {
      if (error) {
        Alert.alert('Unable to save activity', error.message);
        return;
      }

      setActivePicker(null);
      setIsEditing(false);
    });
  };

  const handlePickerChange = (event: DateTimePickerEvent, nextValue?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !nextValue || !activePicker) {
      return;
    }

    if (activePicker === 'date') {
      const normalizedDate = new Date(nextValue);
      normalizedDate.setHours(0, 0, 0, 0);
      setSelectedDate(normalizedDate);
      return;
    }

    setSelectedTime(new Date(nextValue));
  };

  const handleApprove = (participantId: string) => {
    void approveParticipant(activity.id, participantId).then((wasApproved) => {
      if (!wasApproved) {
        Alert.alert(
          'No spots left',
          'This activity is already full. Remove a participant or increase the limit before approving someone else.'
        );
      }
    });
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
        onRequestClose={() => setIsEndConfirmVisible(false)}
        transparent
        visible={isEndConfirmVisible}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsEndConfirmVisible(false)} />
          <View style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>End activity?</ThemedText>
            <ThemedText style={styles.modalBody}>
              This will cancel the activity for everyone and remove all participants.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsEndConfirmVisible(false)}
                style={({ pressed }) => [
                  styles.modalSecondaryAction,
                  pressed ? styles.actionPressed : null,
                ]}>
                <ThemedText style={styles.modalSecondaryActionText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setIsEndConfirmVisible(false);
                  void endActivity(mapActivityToEventItem(activity)).then(({ error }) => {
                    if (error) {
                      Alert.alert('Unable to end activity', error.message);
                      return;
                    }

                    router.replace('/(tabs)/(explore)');
                  });
                }}
                style={({ pressed }) => [
                  styles.modalDangerAction,
                  pressed ? styles.actionPressed : null,
                ]}>
                <ThemedText style={styles.modalDangerActionText}>End Activity</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroCopy}>
                  <View style={styles.typeBadge}>
                    <ThemedText style={styles.typeBadgeText}>{activity.type}</ThemedText>
                  </View>
                  <ThemedText style={styles.heroTitle}>{activity.title}</ThemedText>
                  <ThemedText style={styles.heroSubtitle}>
                    Host controls for approvals, edits, and participant management.
                  </ThemedText>
                </View>
                {isEditing ? (
                  <View style={styles.actionRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={cancelEditing}
                      style={({ pressed }) => [
                        styles.secondaryAction,
                        pressed ? styles.actionPressed : null,
                      ]}>
                      <ThemedText style={styles.secondaryActionText}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={saveEdits}
                      style={({ pressed }) => [
                        styles.primaryAction,
                        pressed ? styles.actionPressed : null,
                      ]}>
                      <ThemedText style={styles.primaryActionText}>Save</ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={beginEditing}
                    style={({ pressed }) => [
                      styles.secondaryAction,
                      pressed ? styles.actionPressed : null,
                    ]}>
                    <MaterialIcons color="#5E584F" name="edit" size={16} />
                    <ThemedText style={styles.secondaryActionText}>Edit Activity</ThemedText>
                  </Pressable>
                )}
              </View>

              <View style={styles.statsRow}>
                <StatCard label="Approved" value={`${approvedCount}`} />
                <StatCard label="Pending" value={`${pendingCount}`} />
                <StatCard label="Spots left" value={`${spotsLeft}`} />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/chat/[id]',
                    params: { id: activity.id },
                  })
                }
                style={({ pressed }) => [
                  styles.chatAction,
                  pressed ? styles.actionPressed : null,
                ]}>
                <MaterialIcons color="#5E584F" name="chat-bubble-outline" size={18} />
                <View style={styles.chatActionCopy}>
                  <ThemedText style={styles.chatActionTitle}>Chat</ThemedText>
                  <ThemedText style={styles.chatActionBody}>
                    {hasEnded ? 'View read-only conversation' : 'Open activity chat'}
                  </ThemedText>
                </View>
                <MaterialIcons color="#8A8278" name="chevron-right" size={20} />
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.sectionStack}>
                <FormSection title="Title">
                  <TextInput
                    onChangeText={setTitle}
                    placeholder="Morning coffee in Nişantaşı"
                    placeholderTextColor="#8A8379"
                    style={styles.textInput}
                    value={title}
                  />
                </FormSection>

                <FormSection title="Date & Time">
                  <View style={styles.dualFieldRow}>
                    <FieldCard
                      icon="calendar-today"
                      label="Date"
                      onPress={() => setActivePicker('date')}
                      value={editDateLabel}
                    />
                    <FieldCard
                      icon="schedule"
                      label="Time"
                      onPress={() => setActivePicker('time')}
                      value={editTimeLabel}
                    />
                  </View>
                  {activePicker ? (
                    <View style={styles.pickerCard}>
                      <View style={styles.pickerHeader}>
                        <ThemedText style={styles.pickerTitle}>
                          {activePicker === 'date' ? 'Pick a new date' : 'Pick a new time'}
                        </ThemedText>
                        {Platform.OS === 'ios' ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setActivePicker(null)}
                            style={({ pressed }) => [
                              styles.inlineAction,
                              pressed ? styles.actionPressed : null,
                            ]}>
                            <ThemedText style={styles.inlineActionText}>Done</ThemedText>
                          </Pressable>
                        ) : null}
                      </View>
                      <DateTimePicker
                        accentColor={Platform.OS === 'ios' ? '#B8B4AE' : undefined}
                        display={Platform.OS === 'ios' ? (activePicker === 'date' ? 'inline' : 'spinner') : 'default'}
                        minimumDate={activePicker === 'date' ? new Date() : undefined}
                        mode={activePicker}
                        onChange={handlePickerChange}
                        textColor={Platform.OS === 'ios' && activePicker === 'time' ? '#171411' : undefined}
                        themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                        value={pickerValue}
                      />
                    </View>
                  ) : null}
                </FormSection>

                <FormSection title="Location">
                  <TextInput
                    onChangeText={setLocation}
                    placeholder="Cafe, park, or full address"
                    placeholderTextColor="#8A8379"
                    style={styles.textInput}
                    value={location}
                  />
                </FormSection>

                <FormSection title="Participant Limit">
                  <View style={styles.chipRow}>
                    {PARTICIPANT_LIMITS.map((value) => (
                      <SelectablePill
                        key={value}
                        isSelected={participantLimit === value}
                        label={`${value}`}
                        onPress={() => setParticipantLimit(value)}
                      />
                    ))}
                  </View>
                </FormSection>

                <FormSection title="Approval">
                  <View style={styles.optionColumn}>
                    <OptionCard
                    description="Anyone who fits the vibe can join instantly."
                    icon="bolt"
                    isSelected={approvalMode === 'auto'}
                    onPress={() => setApprovalMode('auto')}
                    title="Auto Accept"
                    />
                    <OptionCard
                      description="Review requests before someone joins your activity."
                      icon="verified-user"
                      isSelected={approvalMode === 'manual'}
                      onPress={() => setApprovalMode('manual')}
                      title="Host Approval"
                    />
                  </View>
                </FormSection>

                <FormSection title="Visibility">
                  <View style={styles.optionColumn}>
                    <OptionCard
                      description="Visible in Joinly so nearby people can discover it."
                      icon="public"
                      isSelected={visibility === 'public'}
                      onPress={() => setVisibility('public')}
                      title="Public"
                    />
                    <OptionCard
                      description="Share only with people you invite directly."
                      icon="lock"
                      isSelected={visibility === 'private'}
                      onPress={() => setVisibility('private')}
                      title="Private / Invite Only"
                    />
                  </View>
                </FormSection>

                <FormSection title="Description">
                  <TextInput
                    multiline
                    onChangeText={setDescription}
                    placeholder="Add a few details so people know the vibe."
                    placeholderTextColor="#8A8379"
                    style={[styles.textInput, styles.textArea]}
                    textAlignVertical="top"
                    value={description}
                  />
                </FormSection>
              </View>
            ) : (
              <View style={styles.sectionStack}>
                <View style={styles.summaryCard}>
                  <SummaryRow icon="calendar-today" label="Date" value={formattedDate} />
                  <SummaryRow icon="schedule" label="Time" value={formattedTime} />
                  <SummaryRow icon="place" label="Location" value={activity.location} />
                  <SummaryRow
                    icon="group"
                    label="Participant limit"
                    value={`${activity.participantLimit} people`}
                  />
                  <SummaryRow
                    icon="verified-user"
                    label="Approval mode"
                    value={activity.approvalMode === 'manual' ? 'Host Approval' : 'Auto Accept'}
                  />
                  <SummaryRow
                    icon={activity.visibility === 'public' ? 'public' : 'lock'}
                    label="Visibility"
                    value={activity.visibility === 'public' ? 'Public' : 'Private / Invite Only'}
                  />
                </View>

                <View style={styles.descriptionCard}>
                  <ThemedText style={styles.sectionTitle}>Description</ThemedText>
                  <ThemedText style={styles.descriptionText}>{activity.description}</ThemedText>
                </View>
              </View>
            )}

            <View style={styles.sectionStack}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Host</ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={!activity.hostId}
                onPress={() => {
                  if (!activity.hostId) {
                    return;
                  }

                  router.push({
                    pathname: '/user/[id]',
                    params: { id: activity.hostId },
                  });
                }}
                style={({ pressed }) => [
                  styles.hostCard,
                  pressed && activity.hostId ? styles.actionPressed : null,
                ]}>
                {activity.hostPhotoUrl ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: activity.hostPhotoUrl }}
                    style={styles.hostPhoto}
                  />
                ) : (
                  <View style={styles.hostAvatarFallback}>
                    <ThemedText style={styles.hostAvatarFallbackText}>
                      {activity.hostInitials}
                    </ThemedText>
                  </View>
                )}
                <View style={styles.hostCopy}>
                  <View style={styles.hostHeader}>
                    <ThemedText style={styles.hostName}>{activity.hostName}</ThemedText>
                    <View style={styles.hostRatingPill}>
                      <MaterialIcons color="#8B6A3D" name="star" size={14} />
                      <ThemedText style={styles.hostRatingText}>
                        {(activity.hostRating ?? 5).toFixed(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.hostBio}>
                    {activity.hostBio?.trim() || 'No bio yet'}
                  </ThemedText>
                </View>
              </Pressable>
            </View>

            <View style={styles.sectionStack}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Participants</ThemedText>
                <ThemedText style={styles.sectionHint}>{approvedCount} confirmed</ThemedText>
              </View>
              {activity.approvedParticipants.length > 0 ? (
                <View style={styles.listColumn}>
                  {activity.approvedParticipants.map((participant) => (
                    <ParticipantRow
                      key={participant.id}
                      onPress={() => {
                        if (!participant.userId) {
                          return;
                        }

                        router.push({
                          pathname: '/user/[id]',
                          params: { id: participant.userId },
                        });
                      }}
                      participant={participant}
                      primaryActionLabel="Remove"
                      onPrimaryAction={() => {
                        void removeParticipant(activity.id, participant.id).then(({ error }) => {
                          if (error) {
                            Alert.alert('Unable to remove participant', error.message);
                          }
                        });
                      }}
                    />
                  ))}
                </View>
              ) : (
                <HelperCard body="No participants yet. Approve pending requests to fill this activity." />
              )}
            </View>

            <View style={styles.sectionStack}>
              <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>Pending Requests</ThemedText>
                <ThemedText style={styles.sectionHint}>{pendingCount} waiting</ThemedText>
              </View>
              {spotsLeft === 0 ? (
                <HelperCard body="This activity is currently full. Remove someone or increase the participant limit before approving another request." />
              ) : null}
              {activity.pendingParticipants.length > 0 ? (
                <View style={styles.listColumn}>
                  {activity.pendingParticipants.map((participant) => (
                    <ParticipantRow
                      key={participant.id}
                      onPress={() => {
                        if (!participant.userId) {
                          return;
                        }

                        router.push({
                          pathname: '/user/[id]',
                          params: { id: participant.userId },
                        });
                      }}
                      participant={participant}
                      primaryActionLabel="Approve"
                      secondaryActionLabel="Reject"
                      onPrimaryAction={() => handleApprove(participant.id)}
                      onSecondaryAction={() => {
                        void rejectParticipant(activity.id, participant.id).then(({ error }) => {
                          if (error) {
                            Alert.alert('Unable to reject request', error.message);
                          }
                        });
                      }}
                    />
                  ))}
                </View>
              ) : (
                <HelperCard body="No pending requests right now. New join requests will appear here." />
              )}
            </View>

            {!hasEnded ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsEndConfirmVisible(true)}
                style={({ pressed }) => [
                  styles.endActivityButton,
                  pressed ? styles.actionPressed : null,
                ]}>
                <MaterialIcons color="#B14F46" name="event-busy" size={18} />
                <ThemedText style={styles.endActivityButtonText}>End Activity</ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIconWrap}>
        <MaterialIcons color="#655E54" name={icon} size={18} />
      </View>
      <View style={styles.summaryCopy}>
        <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
        <ThemedText style={styles.summaryValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

function HelperCard({ body }: { body: string }) {
  return (
    <View style={styles.helperCard}>
      <ThemedText style={styles.helperText}>{body}</ThemedText>
    </View>
  );
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
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
    top: -110,
    right: -10,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F1DFC3',
    opacity: 0.84,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -70,
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
    paddingBottom: 120,
    gap: 24,
  },
  heroCard: {
    gap: 18,
    padding: 22,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 249, 0.9)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroHeader: {
    gap: 18,
  },
  heroCopy: {
    gap: 10,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F2E5D1',
  },
  typeBadgeText: {
    color: '#5C4630',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroTitle: {
    color: '#171411',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  heroSubtitle: {
    color: '#645C52',
    fontSize: 15,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  primaryActionText: {
    color: '#FFFDFC',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5EEE4',
  },
  secondaryActionText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  actionPressed: {
    opacity: 0.92,
  },
  chatAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EADFD0',
  },
  chatActionCopy: {
    flex: 1,
    gap: 2,
  },
  chatActionTitle: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  chatActionBody: {
    color: '#6A6258',
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    gap: 6,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDFC',
  },
  statValue: {
    color: '#171411',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statLabel: {
    color: '#7C7468',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  sectionStack: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#171411',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionHint: {
    color: '#7C7468',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  summaryCard: {
    gap: 14,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE7',
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: '#7B746A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  summaryValue: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  descriptionCard: {
    gap: 10,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  descriptionText: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  hostPhoto: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F2E7D8',
  },
  hostAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EADCC7',
  },
  hostAvatarFallbackText: {
    color: '#5F4A33',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  hostCopy: {
    flex: 1,
    gap: 8,
  },
  hostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hostName: {
    flex: 1,
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  hostRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F6ECDD',
  },
  hostRatingText: {
    color: '#7A5F38',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  hostBio: {
    color: '#665D53',
    fontSize: 14,
    lineHeight: 20,
  },
  helperCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#F8F2E8',
    borderWidth: 1,
    borderColor: '#EEE1D0',
  },
  helperText: {
    color: '#665D53',
    fontSize: 14,
    lineHeight: 20,
  },
  listColumn: {
    gap: 12,
  },
  endActivityButton: {
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
  endActivityButtonText: {
    color: '#B14F46',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  textInput: {
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#171411',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 126,
  },
  dualFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionColumn: {
    gap: 12,
  },
  pickerCard: {
    gap: 12,
    borderRadius: 24,
    backgroundColor: '#FFFCF8',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    padding: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerTitle: {
    color: '#4E453B',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  inlineAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3E8D7',
  },
  inlineActionText: {
    color: '#5C4630',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  missingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  missingTitle: {
    color: '#171411',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  missingBody: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
