import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useProfileStore } from '@/store/profile-store';

export default function EditAboutScreen() {
  const { aboutMe, saveAboutMe } = useProfileStore();
  const [draftAboutMe, setDraftAboutMe] = useState(aboutMe);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>Edit About Me</ThemedText>
            <ThemedText style={styles.subtitle}>
              Update the short bio other people see on your trust page.
            </ThemedText>
          </View>

          <TextInput
            multiline
            onChangeText={setDraftAboutMe}
            placeholder="Tell people a little about how you show up."
            placeholderTextColor="#8A8379"
            style={styles.textArea}
            textAlignVertical="top"
            value={draftAboutMe}
          />

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
                saveAboutMe(draftAboutMe.trim() || aboutMe);
                router.back();
              }}
              style={({ pressed }) => [styles.primaryAction, pressed ? styles.buttonPressed : null]}>
              <ThemedText style={styles.primaryActionText}>Save About Me</ThemedText>
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
  textArea: {
    minHeight: 180,
    borderRadius: 28,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    paddingHorizontal: 18,
    paddingVertical: 18,
    color: '#171411',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
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
