import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type FormSectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function FormSection({ title, hint, children }: FormSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {hint ? <ThemedText style={styles.sectionHint}>{hint}</ThemedText> : null}
      </View>
      {children}
    </View>
  );
}

type SelectablePillProps = {
  label: string;
  icon?: MaterialIconName;
  color?: string;
  isSelected?: boolean;
  onPress?: () => void;
};

export function SelectablePill({
  label,
  icon,
  color = '#5B554D',
  isSelected = false,
  onPress,
}: SelectablePillProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        isSelected
          ? [styles.pillSelected, { backgroundColor: `${color}14`, borderColor: `${color}52` }]
          : styles.pillDefault,
        pressed ? styles.pillPressed : null,
      ]}>
      {icon ? (
        <MaterialIcons
          color={isSelected ? color : '#746C62'}
          name={icon}
          size={17}
          style={styles.pillIcon}
        />
      ) : null}
      <ThemedText
        style={[
          styles.pillLabel,
          isSelected ? styles.pillLabelSelected : null,
          isSelected ? { color } : null,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

type OptionCardProps = {
  title: string;
  description: string;
  isSelected?: boolean;
  badge?: string;
  icon?: MaterialIconName;
  onPress?: () => void;
};

export function OptionCard({
  title,
  description,
  isSelected = false,
  badge,
  icon,
  onPress,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        isSelected ? styles.optionCardSelected : null,
        pressed ? styles.optionCardPressed : null,
      ]}>
      <View style={styles.optionCardHeader}>
        <View style={styles.optionCardTitleRow}>
          {icon ? (
            <View style={[styles.optionIconWrap, isSelected ? styles.optionIconWrapSelected : null]}>
              <MaterialIcons color={isSelected ? '#1C1711' : '#746C62'} name={icon} size={18} />
            </View>
          ) : null}
          <ThemedText style={styles.optionCardTitle}>{title}</ThemedText>
        </View>
        {badge ? (
          <View style={[styles.badge, isSelected ? styles.badgeSelected : null]}>
            <ThemedText style={[styles.badgeText, isSelected ? styles.badgeTextSelected : null]}>
              {badge}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText style={styles.optionCardDescription}>{description}</ThemedText>
    </Pressable>
  );
}

type FieldCardProps = {
  icon: MaterialIconName;
  label: string;
  value: string;
  isPlaceholder?: boolean;
  align?: 'left' | 'center';
  onPress?: () => void;
  disabled?: boolean;
};

export function FieldCard({
  icon,
  label,
  value,
  isPlaceholder = false,
  align = 'left',
  onPress,
  disabled = false,
}: FieldCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fieldCard,
        align === 'center' ? styles.fieldCardCentered : null,
        onPress ? styles.fieldCardInteractive : null,
        pressed && onPress ? styles.fieldCardPressed : null,
      ]}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconWrap}>
          <MaterialIcons color="#655E54" name={icon} size={18} />
        </View>
        <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      </View>
      <ThemedText style={[styles.fieldValue, isPlaceholder ? styles.fieldValuePlaceholder : null]}>
        {value}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#171411',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionHint: {
    color: '#8C847A',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillDefault: {
    backgroundColor: '#FFFDFC',
    borderColor: '#F0E8DE',
  },
  pillSelected: {
  },
  pillPressed: {
    opacity: 0.92,
  },
  pillIcon: {
    marginLeft: -1,
  },
  pillLabel: {
    color: '#5B554D',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  pillLabelSelected: {
    color: '#5B554D',
  },
  optionCard: {
    gap: 12,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    padding: 18,
    shadowColor: '#1A1714',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#D9C4A6',
    backgroundColor: '#FBF4EA',
  },
  optionCardPressed: {
    opacity: 0.94,
  },
  optionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE8',
  },
  optionIconWrapSelected: {
    backgroundColor: '#E8D9C4',
  },
  optionCardTitle: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  optionCardDescription: {
    color: '#6D665C',
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F4EFE7',
  },
  badgeSelected: {
    backgroundColor: '#E7D7BF',
  },
  badgeText: {
    color: '#776F64',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  badgeTextSelected: {
    color: '#5B4630',
  },
  fieldCard: {
    flex: 1,
    gap: 14,
    minHeight: 108,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    padding: 18,
    shadowColor: '#1A1714',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  fieldCardInteractive: {
    overflow: 'hidden',
  },
  fieldCardPressed: {
    opacity: 0.94,
  },
  fieldCardCentered: {
    justifyContent: 'space-between',
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE7',
  },
  fieldLabel: {
    color: '#746D64',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  fieldValue: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  fieldValuePlaceholder: {
    color: '#8C847A',
  },
});
