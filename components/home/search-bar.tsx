import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

type SearchBarProps = {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onClear?: () => void;
};

export function SearchBar({ placeholder, value, onChangeText, onClear }: SearchBarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.inputSurface}>
        <MaterialIcons name="search" size={20} color="#7B756C" />
        <TextInput
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7B756C"
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
      </View>
      <Pressable
        accessibilityLabel={hasValue ? 'Clear search' : 'Search ready'}
        accessibilityRole="button"
        disabled={!hasValue}
        onPress={hasValue ? onClear : undefined}
        style={({ pressed }) => [
          styles.actionButton,
          !hasValue ? styles.actionButtonIdle : null,
          pressed && hasValue ? styles.actionButtonPressed : null,
        ]}>
        <MaterialIcons name={hasValue ? 'close' : 'tune'} size={18} color="#171411" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: '#171411',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAD8BE',
  },
  actionButtonIdle: {
    opacity: 0.75,
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
});
