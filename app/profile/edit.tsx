import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectablePill } from '@/components/create/create-form-ui';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import { useProfileStore } from '@/store/profile-store';

export default function EditProfileScreen() {
  const { profile, saveProfile, saving } = useProfileStore();
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [age, setAge] = useState(profile?.age ? `${profile.age}` : '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);

  const normalizedBio = useMemo(
    () => (bio === 'No bio yet' && !profile?.isComplete ? '' : bio),
    [bio, profile?.isComplete]
  );

  const toggleInterest = (interest: string) => {
    setInterests((currentValue) =>
      currentValue.includes(interest)
        ? currentValue.filter((item) => item !== interest)
        : [...currentValue, interest]
    );
  };

  const handleSave = async () => {
    const parsedAge = age.trim().length > 0 ? Number.parseInt(age, 10) : null;

    if (age.trim().length > 0 && Number.isNaN(parsedAge)) {
      Alert.alert('Invalid age', 'Age must be a whole number.');
      return;
    }

    const { error } = await saveProfile({
      fullName,
      username,
      bio: normalizedBio,
      age: parsedAge,
      occupation,
      interests,
      avatarUrl,
    });

    if (error) {
      Alert.alert('Unable to save profile', error.message);
      return;
    }

    router.back();
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>Edit Profile</ThemedText>
            <ThemedText style={styles.subtitle}>
              Update the real information people see on your Joinly profile.
            </ThemedText>
          </View>

          <FormBlock label="Full Name">
            <TextInput
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#8A8379"
              style={styles.input}
              value={fullName}
            />
          </FormBlock>

          <FormBlock label="Username">
            <TextInput
              autoCapitalize="none"
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor="#8A8379"
              style={styles.input}
              value={username}
            />
          </FormBlock>

          <FormBlock label="Bio">
            <TextInput
              multiline
              onChangeText={setBio}
              placeholder="Tell people a little about yourself."
              placeholderTextColor="#8A8379"
              style={[styles.input, styles.textArea]}
              textAlignVertical="top"
              value={normalizedBio}
            />
          </FormBlock>

          <FormBlock label="Age">
            <TextInput
              keyboardType="number-pad"
              onChangeText={setAge}
              placeholder="Optional"
              placeholderTextColor="#8A8379"
              style={styles.input}
              value={age}
            />
          </FormBlock>

          <FormBlock label="Occupation">
            <TextInput
              onChangeText={setOccupation}
              placeholder="Optional"
              placeholderTextColor="#8A8379"
              style={styles.input}
              value={occupation}
            />
          </FormBlock>

          <FormBlock label="Avatar URL">
            <TextInput
              autoCapitalize="none"
              onChangeText={setAvatarUrl}
              placeholder="Optional image URL"
              placeholderTextColor="#8A8379"
              style={styles.input}
              value={avatarUrl}
            />
          </FormBlock>

          <FormBlock label="Interests">
            <View style={styles.chipRow}>
              {ACTIVITY_CATEGORIES.map((category) => (
                <SelectablePill
                  color={category.color}
                  key={category.id}
                  icon={category.icon as keyof typeof MaterialIcons.glyphMap}
                  isSelected={interests.includes(category.label)}
                  label={category.label}
                  onPress={() => toggleInterest(category.label)}
                />
              ))}
            </View>
          </FormBlock>

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
                void handleSave();
              }}
              style={({ pressed }) => [styles.primaryAction, pressed ? styles.buttonPressed : null, saving ? styles.actionDisabled : null]}>
              <ThemedText style={styles.primaryActionText}>
                {saving ? 'Saving...' : 'Save Profile'}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FormBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <ThemedText style={styles.blockLabel}>{label}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8F0' },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80, gap: 22 },
  heroCard: {
    gap: 10,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  title: { color: '#171411', fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 },
  subtitle: { color: '#5E584F', fontSize: 15, lineHeight: 22 },
  block: { gap: 10 },
  blockLabel: { color: '#171411', fontSize: 15, lineHeight: 18, fontWeight: '700' },
  input: {
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    paddingHorizontal: 18,
    paddingVertical: 16,
    color: '#171411',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  textArea: { minHeight: 140 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footerRow: { flexDirection: 'row', gap: 12 },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  primaryActionText: { color: '#FFFDFC', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  secondaryAction: {
    minWidth: 104,
    minHeight: 52,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5EEE4',
  },
  secondaryActionText: { color: '#5E584F', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  actionDisabled: { opacity: 0.7 },
  buttonPressed: { opacity: 0.92 },
});
