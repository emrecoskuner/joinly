import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Participant } from '@/store/activity-store';

type ParticipantRowProps = {
  participant: Participant;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

export function ParticipantRow({
  participant,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
}: ParticipantRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.identityBlock}>
        <View style={styles.avatar}>
          <ThemedText style={styles.avatarText}>{participant.initials}</ThemedText>
        </View>
        <View style={styles.copyBlock}>
          <ThemedText style={styles.name}>{participant.name}</ThemedText>
          <View style={styles.metaRow}>
            <MaterialIcons color="#D89E35" name="star" size={14} />
            <ThemedText style={styles.metaText}>{participant.rating.toFixed(1)} host rating</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {secondaryActionLabel && onSecondaryAction ? (
          <ActionButton
            label={secondaryActionLabel}
            onPress={onSecondaryAction}
            variant="secondary"
          />
        ) : null}
        {primaryActionLabel && onPrimaryAction ? (
          <ActionButton label={primaryActionLabel} onPress={onPrimaryAction} variant="primary" />
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant,
}: {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
        pressed ? styles.actionButtonPressed : null,
      ]}>
      <ThemedText
        style={[
          styles.actionButtonText,
          variant === 'primary' ? styles.primaryButtonText : styles.secondaryButtonText,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE6DA',
  },
  identityBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8D8',
  },
  avatarText: {
    color: '#6A5237',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#171411',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#766E64',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: '#171411',
  },
  secondaryButton: {
    backgroundColor: '#F5EEE4',
  },
  actionButtonPressed: {
    opacity: 0.92,
  },
  actionButtonText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#FFFDFC',
  },
  secondaryButtonText: {
    color: '#5E584F',
  },
});
