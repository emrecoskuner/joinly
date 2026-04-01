import { ScrollView, StyleSheet, View } from 'react-native';

import { MessageBubble } from '@/components/activity-chat/message-bubble';
import { ThemedText } from '@/components/themed-text';
import type { ActivityMessage } from '@/store/activity-store';

type MessageListProps = {
  currentUserId: string;
  messages: ActivityMessage[];
  scrollViewRef?: React.RefObject<ScrollView | null>;
};

export function MessageList({
  currentUserId,
  messages,
  scrollViewRef,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
        <ThemedText style={styles.emptyBody}>Start the conversation.</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.listContent}
      onContentSizeChange={() => scrollViewRef?.current?.scrollToEnd({ animated: true })}
      showsVerticalScrollIndicator={false}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          isMine={message.senderId === currentUserId}
          message={message}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  emptyCard: {
    gap: 8,
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  emptyTitle: {
    color: '#171411',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
  },
  emptyBody: {
    color: '#6B6359',
    fontSize: 14,
    lineHeight: 20,
  },
});
