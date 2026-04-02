import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectablePill } from '@/components/create/create-form-ui';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import { useProfileStore } from '@/store/profile-store';

export default function EditInterestsScreen() {
  const { selectedInterestIds, saveInterestIds } = useProfileStore();
  const [draftInterestIds, setDraftInterestIds] = useState(selectedInterestIds);

  const toggleInterest = (interestId: string) => {
    setDraftInterestIds((currentValue) =>
      currentValue.includes(interestId)
        ? currentValue.filter((item) => item !== interestId)
        : [...currentValue, interestId]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>Edit Interests</ThemedText>
            <ThemedText style={styles.subtitle}>
              Choose the activities that should represent you on your trust page.
            </ThemedText>
          </View>

          <View style={styles.chipRow}>
            {ACTIVITY_CATEGORIES.map((category) => (
              <SelectablePill
                color={category.color}
                key={category.id}
                icon={category.icon as keyof typeof MaterialIcons.glyphMap}
                isSelected={draftInterestIds.includes(category.label)}
                label={category.label}
                onPress={() => toggleInterest(category.label)}
              />
            ))}
          </View>

          <View style={styles.footerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.secondaryAction, pressed ? styles.buttonPressed : null]}>
              <ThemedText style={styles.secondaryActionText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                saveInterestIds(draftInterestIds);
                router.back();
              }}
              style={({ pressed }) => [styles.primaryAction, pressed ? styles.buttonPressed : null]}>
              <ThemedText style={styles.primaryActionText}>Save Interests</ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
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
    gap: 10,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  title: {
    color: '#171411',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
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
    minWidth: 104,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEE4',
  },
  secondaryActionText: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.92,
  },
});
