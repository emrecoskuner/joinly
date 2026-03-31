import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type ActivityFilterChipProps = {
  label: string;
  icon: string;
  isActive?: boolean;
};

export function ActivityFilterChip({
  label,
  icon,
  isActive = false,
}: ActivityFilterChipProps) {
  return (
    <Pressable style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}>
      <MaterialIcons
        name={icon as ComponentProps<typeof MaterialIcons>['name']}
        size={18}
        color={isActive ? '#FFFFFF' : '#5E584F'}
      />
      <ThemedText style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
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
  },
  chipActive: {
    backgroundColor: '#171411',
  },
  chipInactive: {
    backgroundColor: '#F5EEE4',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#5E584F',
  },
});
