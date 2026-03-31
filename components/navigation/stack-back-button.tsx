import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

export function StackBackButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityHint="Returns to the previous screen"
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => router.back()}
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}>
      <MaterialIcons color="#171411" name="chevron-left" size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#EFE7DC',
    shadowColor: '#1A1714',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
