import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ActivityMessage } from '@/store/activity-store';

type MessageBubbleProps = {
  message: ActivityMessage;
  isMine: boolean;
};

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowMine : null]}>
      {!isMine ? (
        <Image contentFit="cover" source={{ uri: message.senderAvatar }} style={styles.avatar} />
      ) : null}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        {!isMine ? <ThemedText style={styles.senderName}>{message.senderName}</ThemedText> : null}
        <ThemedText style={[styles.messageText, isMine ? styles.messageTextMine : null]}>
          {message.text}
        </ThemedText>
        <ThemedText style={[styles.timestamp, isMine ? styles.timestampMine : null]}>
          {formatTime(message.createdAt)}
        </ThemedText>
      </View>
    </View>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8DCC9',
  },
  bubble: {
    maxWidth: '78%',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleMine: {
    backgroundColor: '#171411',
    borderBottomRightRadius: 8,
  },
  bubbleOther: {
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
    borderBottomLeftRadius: 8,
  },
  senderName: {
    color: '#7A7268',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  messageText: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  messageTextMine: {
    color: '#FFFDFC',
  },
  timestamp: {
    color: '#8A8278',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  timestampMine: {
    color: '#D7CFC4',
  },
});
