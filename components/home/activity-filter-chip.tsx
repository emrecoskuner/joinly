import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ActivityFilterChipProps = {
  label: string;
  icon: string;
  color: string;
  isActive?: boolean;
  onPress?: () => void;
};

export function ActivityFilterChip({
  label,
  icon,
  color,
  isActive = false,
  onPress,
}: ActivityFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isActive
          ? [styles.chipActive, { backgroundColor: `${color}14`, borderColor: `${color}52` }]
          : styles.chipInactive,
        pressed ? styles.chipPressed : null,
      ]}>
      <MaterialIcons
        name={icon as ComponentProps<typeof MaterialIcons>['name']}
        size={18}
        color={isActive ? color : '#746C62'}
      />
      <ThemedText
        style={[
          styles.label,
          isActive ? styles.labelActive : styles.labelInactive,
          isActive ? { color } : null,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {},
  chipInactive: {
    backgroundColor: '#FFFDFC',
    borderColor: '#F0E8DE',
  },
  chipPressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  labelActive: {
    color: '#5E584F',
  },
  labelInactive: {
    color: '#5E584F',
  },
});
