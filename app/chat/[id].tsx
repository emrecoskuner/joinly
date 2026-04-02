import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatInput } from '@/components/activity-chat/chat-input';
import { MessageList } from '@/components/activity-chat/message-list';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import {
  getActivityMessages,
  getChatMessageById,
  sendActivityMessage,
  type ChatMessage,
} from '@/services/messages';
import {
  canAccessActivityChat,
  isActivityEnded,
  isActivityPast,
  mapActivityToEventItem,
  resolveEventParticipationStatus,
  syncEventParticipationForCurrentUser,
  useActivityStore,
} from '@/store/activity-store';

export default function ActivityChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    browseEvents,
    createdActivities,
    currentUserId,
    currentUserParticipant,
    endedActivitiesById,
    participationByEventId,
  } = useActivityStore();
  const [draftMessage, setDraftMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const activity = useMemo(() => {
    if (!id) {
      return undefined;
    }

    const endedActivity = endedActivitiesById[id];

    if (endedActivity) {
      return endedActivity;
    }

    const createdActivity = createdActivities.find((item) => item.id === id);

    if (createdActivity) {
      return mapActivityToEventItem(createdActivity);
    }

    return browseEvents.find((event) => event.id === id);
  }, [browseEvents, createdActivities, endedActivitiesById, id]);

  const syncedActivity = activity
    ? syncEventParticipationForCurrentUser(
        activity,
        participationByEventId,
        currentUserId,
        currentUserParticipant
      )
    : undefined;
  const isEnded = syncedActivity ? isActivityEnded(syncedActivity.id, endedActivitiesById) : false;
  const participationStatus = syncedActivity
    ? resolveEventParticipationStatus(syncedActivity, participationByEventId, currentUserId)
    : 'none';
  const hasAccess = canAccessActivityChat(participationStatus);
  const isPast = syncedActivity ? isActivityPast(syncedActivity.dateTimeIso) : false;
  const isChatClosed = isPast || isEnded;

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: false });
  }, [messages.length]);

  useEffect(() => {
    if (!id || !syncedActivity || !hasAccess) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let isActive = true;
    setIsLoadingMessages(true);

    void getActivityMessages(id).then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        console.log('ActivityChatScreen.getActivityMessages error', error);
        Alert.alert('Unable to load chat', error.message);
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }

      setMessages(data ?? []);
      setIsLoadingMessages(false);
    });

    const channel = supabase
      .channel(`activity-messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_messages',
          filter: `activity_id=eq.${id}`,
        },
        (payload) => {
          const messageId = typeof payload.new.id === 'string' ? payload.new.id : '';

          if (!messageId) {
            return;
          }

          void getChatMessageById(messageId).then(({ data, error }) => {
            if (!isActive) {
              return;
            }

            if (error) {
              console.log('ActivityChatScreen.realtime error', error);
              return;
            }

            if (!data) {
              return;
            }

            setMessages((currentValue) => {
              if (currentValue.some((message) => message.id === data.id)) {
                return currentValue;
              }

              return [...currentValue, data].sort(
                (left, right) =>
                  new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
              );
            });
          });
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, [hasAccess, id, syncedActivity]);

  const handleSend = async () => {
    if (!id || !syncedActivity || !hasAccess || isChatClosed || !currentUserId) {
      return;
    }

    setIsSending(true);
    const { error } = await sendActivityMessage(id, currentUserId, draftMessage);
    setIsSending(false);

    if (error) {
      console.log('ActivityChatScreen.sendActivityMessage error', error);
      Alert.alert('Unable to send message', error.message);
      return;
    }

    setDraftMessage('');
  };

  if (!syncedActivity) {
    return (
      <View style={styles.screen}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
          <View style={styles.emptyCard}>
            <ThemedText style={styles.emptyTitle}>Chat not found</ThemedText>
            <ThemedText style={styles.emptyBody}>
              This activity could not be loaded from Joinly.
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed ? styles.buttonPressed : null,
                ]}>
                <MaterialIcons color="#171411" name="arrow-back" size={20} />
              </Pressable>
              <View style={styles.headerCopy}>
                <ThemedText numberOfLines={1} style={styles.headerTitle}>
                  {syncedActivity.title}
                </ThemedText>
                <ThemedText style={styles.headerSubtitle}>Activity Chat</ThemedText>
              </View>
            </View>

            {!hasAccess ? (
              <View style={styles.blockedCard}>
                <ThemedText style={styles.blockedTitle}>Chat is only for confirmed members</ThemedText>
                <ThemedText style={styles.blockedBody}>
                  Only the host and joined participants can read or send messages in this activity.
                </ThemedText>
              </View>
            ) : (
              <>
                <View style={styles.metaCard}>
                  <ThemedText style={styles.metaTitle}>
                    {isChatClosed ? 'This activity has ended' : 'Coordinate before you meet'}
                  </ThemedText>
                  <ThemedText style={styles.metaBody}>
                    {isChatClosed
                      ? 'Chat is now read-only. You can still review the conversation.'
                      : `${syncedActivity.dateLabel} • ${syncedActivity.timeLabel} • ${syncedActivity.location}`}
                  </ThemedText>
                </View>

                <View style={styles.messagesWrap}>
                  {isLoadingMessages ? (
                    <View style={styles.loadingCard}>
                      <ThemedText style={styles.loadingTitle}>Loading chat</ThemedText>
                      <ThemedText style={styles.loadingBody}>
                        Pulling the latest messages for this activity.
                      </ThemedText>
                    </View>
                  ) : (
                    <MessageList
                      currentUserId={currentUserId}
                      messages={messages}
                      scrollViewRef={scrollViewRef}
                    />
                  )}
                </View>

                {isChatClosed ? (
                  <View style={styles.closedCard}>
                    <ThemedText style={styles.closedText}>
                      This activity has ended. Chat is closed.
                    </ThemedText>
                  </View>
                ) : (
                  <ChatInput
                    disabled={isSending}
                    onChangeText={setDraftMessage}
                    onSend={() => {
                      void handleSend();
                    }}
                    placeholder={isSending ? 'Sending...' : 'Write a message'}
                    value={draftMessage}
                  />
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
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
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -110,
    right: -20,
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    color: '#171411',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#7C7468',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  metaCard: {
    gap: 6,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  metaTitle: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  metaBody: {
    color: '#645C52',
    fontSize: 14,
    lineHeight: 20,
  },
  messagesWrap: {
    flex: 1,
    minHeight: 220,
  },
  loadingCard: {
    gap: 8,
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  loadingTitle: {
    color: '#171411',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
  },
  loadingBody: {
    color: '#6B6359',
    fontSize: 14,
    lineHeight: 20,
  },
  blockedCard: {
    gap: 8,
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  blockedTitle: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  blockedBody: {
    color: '#6B6359',
    fontSize: 14,
    lineHeight: 20,
  },
  closedCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#F5EEE4',
    borderWidth: 1,
    borderColor: '#E9DCCB',
  },
  closedText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCard: {
    margin: 20,
    gap: 8,
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  emptyTitle: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#6B6359',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.92,
  },
});
