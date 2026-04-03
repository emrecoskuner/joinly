import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { PlaceSelection, PlaceSuggestion } from '@/services/places';

type LocationAutocompleteProps = {
  hasApiKey: boolean;
  isLoading: boolean;
  query: string;
  suggestions: PlaceSuggestion[];
  selectedPlace: PlaceSelection | null;
  neutralTitle?: string;
  neutralBody?: string;
  errorMessage?: string | null;
  onChangeQuery: (value: string) => void;
  onSelectSuggestion: (suggestion: PlaceSuggestion) => void;
  onClearSelection: () => void;
};

export function LocationAutocomplete(props: LocationAutocompleteProps) {
  const {
    hasApiKey,
    isLoading,
    query,
    suggestions,
    selectedPlace,
    neutralTitle = 'Location TBD',
    neutralBody = 'You can decide the exact place later.',
    errorMessage,
    onChangeQuery,
    onSelectSuggestion,
    onClearSelection,
  } = props;

  return (
    <View style={styles.container}>
      <View style={styles.locationCard}>
        <View style={styles.locationIconWrap}>
          <MaterialIcons color="#5F594F" name="place" size={20} />
        </View>
        <View style={styles.locationTextBlock}>
          <ThemedText style={styles.locationLabel}>Meeting point</ThemedText>
          <TextInput
            autoCorrect={false}
            onChangeText={onChangeQuery}
            placeholder={
              hasApiKey ? 'Search for a cafe, park, or venue' : 'Location search unavailable'
            }
            placeholderTextColor="#9B9287"
            style={styles.locationInput}
            value={query}
          />

          {selectedPlace ? (
            <View style={styles.selectedPlaceCard}>
              <View style={styles.selectedPlaceCopy}>
                <ThemedText style={styles.selectedPlaceName}>
                  {selectedPlace.locationName}
                </ThemedText>
                {selectedPlace.locationAddress ? (
                  <ThemedText style={styles.selectedPlaceAddress}>
                    {selectedPlace.locationAddress}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onClearSelection}
                style={styles.clearButton}>
                <MaterialIcons color="#6A6258" name="close" size={16} />
              </Pressable>
            </View>
          ) : null}

          {!selectedPlace ? (
            <View style={styles.neutralCard}>
              <ThemedText style={styles.neutralTitle}>{neutralTitle}</ThemedText>
              <ThemedText style={styles.neutralBody}>{neutralBody}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      {errorMessage ? <ThemedText style={styles.feedbackText}>{errorMessage}</ThemedText> : null}

      {isLoading ? (
        <View style={styles.feedbackCard}>
          <ThemedText style={styles.feedbackTitle}>Searching places...</ThemedText>
        </View>
      ) : null}

      {!isLoading && suggestions.length > 0 ? (
        <View style={styles.suggestionList}>
          {suggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.placeId}
              onPress={() => onSelectSuggestion(suggestion)}
              style={styles.suggestionRow}>
              <View style={styles.suggestionIconWrap}>
                <MaterialIcons color="#6A5B49" name="near-me" size={16} />
              </View>
              <View style={styles.suggestionCopy}>
                <ThemedText style={styles.suggestionName}>{suggestion.name}</ThemedText>
                {suggestion.secondaryText ? (
                  <ThemedText style={styles.suggestionAddress}>
                    {suggestion.secondaryText}
                  </ThemedText>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
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
  locationIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE7',
  },
  locationTextBlock: {
    flex: 1,
    gap: 8,
    paddingTop: 2,
  },
  locationLabel: {
    color: '#746D63',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  locationInput: {
    minHeight: 24,
    paddingVertical: 0,
    color: '#171411',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  selectedPlaceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F7F1E8',
    borderWidth: 1,
    borderColor: '#ECE0CF',
  },
  selectedPlaceCopy: {
    flex: 1,
    gap: 3,
  },
  selectedPlaceName: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  selectedPlaceAddress: {
    color: '#6F665B',
    fontSize: 13,
    lineHeight: 18,
  },
  neutralCard: {
    gap: 3,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FBF7F1',
    borderWidth: 1,
    borderColor: '#ECE2D7',
  },
  neutralTitle: {
    color: '#4F483F',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  neutralBody: {
    color: '#7A7268',
    fontSize: 13,
    lineHeight: 18,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE4D7',
  },
  feedbackText: {
    color: '#9C5449',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  feedbackCard: {
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  feedbackTitle: {
    color: '#5E584F',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  suggestionList: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FFFDFC',
    borderWidth: 1,
    borderColor: '#F2E9DE',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  suggestionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EFE7',
  },
  suggestionCopy: {
    flex: 1,
    gap: 3,
  },
  suggestionName: {
    color: '#171411',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  suggestionAddress: {
    color: '#6F665B',
    fontSize: 13,
    lineHeight: 18,
  },
});
