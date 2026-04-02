import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/AuthContext';

export default function SignInScreen() {
  const { signIn, loading, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.heroCard}>
              <ThemedText style={styles.eyebrow}>Joinly</ThemedText>
              <ThemedText style={styles.title}>Sign In</ThemedText>
              <ThemedText style={styles.subtitle}>
                Continue to your activities, requests, and chats.
              </ThemedText>
            </View>

            <View style={styles.formCard}>
              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Email</ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#8A8379"
                  style={styles.input}
                  value={email}
                />
              </View>

              <View style={styles.fieldGroup}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor="#8A8379"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting || loading || Boolean(session)}
                onPress={() => {
                  void handleSignIn();
                }}
                style={({ pressed }) => [
                  styles.primaryAction,
                  pressed ? styles.buttonPressed : null,
                  isSubmitting || loading || session ? styles.buttonDisabled : null,
                ]}>
                <ThemedText style={styles.primaryActionText}>
                  {isSubmitting ? 'Signing In...' : loading && !session ? 'Loading...' : 'Sign In'}
                </ThemedText>
              </Pressable>

              <View style={styles.footerRow}>
                <ThemedText style={styles.footerText}>No account yet?</ThemedText>
                <Link href="/sign-up" style={styles.footerLink}>
                  Create one
                </Link>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#F1DFC3',
    opacity: 0.8,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#F4E7D8',
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 18,
  },
  heroCard: {
    gap: 10,
    padding: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
  },
  eyebrow: {
    color: '#8A7F70',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#171411',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#5E584F',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    gap: 16,
    padding: 24,
    borderRadius: 30,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE4D6',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D8C8',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 16,
    color: '#171411',
    fontSize: 15,
  },
  primaryAction: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B4630',
  },
  primaryActionText: {
    color: '#FFFDFC',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#6D665D',
    fontSize: 14,
    lineHeight: 20,
  },
  footerLink: {
    color: '#5B4630',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
