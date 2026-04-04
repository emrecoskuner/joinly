import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectablePill } from '@/components/create/create-form-ui';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';
import { useProfileStore } from '@/store/profile-store';

export default function CompleteProfileScreen() {
  const { user, loading } = useAuth();
  const { profile, saveProfile, saving } = useProfileStore();
  const [fullName, setFullName] = useState(profile?.isComplete ? profile.fullName : '');
  const [username, setUsername] = useState(profile?.isComplete ? profile.username : '');
  const [bio, setBio] = useState(profile?.isComplete ? profile.bio : '');
  const [age, setAge] = useState(profile?.age ? `${profile.age}` : '');
  const [occupation, setOccupation] = useState(profile?.occupation ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);

  if (!loading && !user) {
    return <Redirect href="/sign-in" />;
  }

  if (!loading && profile?.isComplete) {
    return <Redirect href="/(tabs)/(home)" />;
  }

  const toggleInterest = (interest: string) => {
    setInterests((currentValue) =>
      currentValue.includes(interest)
        ? currentValue.filter((item) => item !== interest)
        : [...currentValue, interest]
    );
  };

  const handleContinue = async () => {
    if (!user?.id) {
      router.replace('/sign-in');
      return;
    }

    if (!fullName.trim() || !username.trim() || !bio.trim()) {
      Alert.alert('Complete required fields', 'Full name, username, and bio are required.');
      return;
    }

    const parsedAge = age.trim().length > 0 ? Number.parseInt(age, 10) : null;

    if (age.trim().length > 0 && Number.isNaN(parsedAge)) {
      Alert.alert('Invalid age', 'Age must be a whole number.');
      return;
    }

    const { error } = await saveProfile({
      fullName,
      username,
      bio,
      age: parsedAge,
      occupation,
      interests,
      avatarUrl,
    });

    if (error) {
      Alert.alert('Unable to complete profile', error.message);
      return;
    }

    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <ThemedText style={styles.title}>Complete Your Profile</ThemedText>
            <ThemedText style={styles.subtitle}>
              Add the basics people need before you can start using Joinly.
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
              value={bio}
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

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void handleContinue();
            }}
            style={({ pressed }) => [styles.primaryAction, pressed ? styles.buttonPressed : null, saving ? styles.actionDisabled : null]}>
            <ThemedText style={styles.primaryActionText}>
              {saving ? 'Saving...' : 'Save and Continue'}
            </ThemedText>
          </Pressable>
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
  primaryAction: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#171411',
  },
  primaryActionText: { color: '#FFFDFC', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  actionDisabled: { opacity: 0.7 },
  buttonPressed: { opacity: 0.92 },
});
