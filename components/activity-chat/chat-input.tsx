import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ChatInputProps = {
  disabled?: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  value: string;
};

export function ChatInput({
  disabled = false,
  onChangeText,
  onSend,
  placeholder = 'Write a message',
  value,
}: ChatInputProps) {
  return (
    <View style={[styles.container, disabled ? styles.containerDisabled : null]}>
      <TextInput
        editable={!disabled}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#958D82"
        style={styles.input}
        value={value}
      />
      <Pressable
        accessibilityRole="button"
        disabled={disabled || value.trim().length === 0}
        onPress={onSend}
        style={({ pressed }) => [
          styles.sendButton,
          disabled || value.trim().length === 0 ? styles.sendButtonDisabled : null,
          pressed && !disabled && value.trim().length > 0 ? styles.sendButtonPressed : null,
        ]}>
        <MaterialIcons color="#FFFDFC" name="north-east" size={18} />
        <ThemedText style={styles.sendText}>Send</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 14,
    borderRadius: 26,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  containerDisabled: {
    opacity: 0.7,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    color: '#171411',
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  sendButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#171411',
  },
  sendButtonDisabled: {
    backgroundColor: '#A59B8F',
  },
  sendButtonPressed: {
    opacity: 0.92,
  },
  sendText: {
    color: '#FFFDFC',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
});
