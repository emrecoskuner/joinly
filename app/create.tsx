import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FieldCard,
  FormSection,
  OptionCard,
  SelectablePill,
} from '@/components/create/create-form-ui';
import { LocationAutocomplete } from '@/components/create/location-autocomplete';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { ThemedText } from '@/components/themed-text';
import {
  createPlacesSessionToken,
  getPlaceSelection,
  hasPlacesApiKey,
  searchPlaceSuggestions,
  type PlaceSelection,
  type PlaceSuggestion,
} from '@/services/places';
import type { Activity } from '@/store/activity-store';
import { buildMockParticipants, useActivityStore } from '@/store/activity-store';

type DateTimePickerMode = 'date' | 'time';

export default function CreateActivityScreen() {
  const { addActivity } = useActivityStore();
  const [selectedType, setSelectedType] = useState(ACTIVITY_CATEGORIES[0].label);
  const [participantLimit, setParticipantLimit] = useState(4);
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual'>('manual');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSelection | null>(null);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placesSessionToken, setPlacesSessionToken] = useState(createPlacesSessionToken());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<DateTimePickerMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedDate = selectedDate ? formatDateLabel(selectedDate) : 'Select date';
  const formattedTime = selectedTime ? formatTimeLabel(selectedTime) : 'Select time';
  const canOpenMaps = Boolean(
    selectedPlace?.locationAddress || selectedPlace?.locationName || locationQuery.trim()
  );
  const pickerValue = getPickerValue(activePicker, selectedDate, selectedTime);

  useEffect(() => {
    const trimmedQuery = locationQuery.trim();

    if (!hasPlacesApiKey()) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    if (selectedPlace && trimmedQuery === selectedPlace.locationName) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    if (trimmedQuery.length < 2) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    let isActive = true;
    setIsSearchingPlaces(true);

    const timeoutId = setTimeout(() => {
      void searchPlaceSuggestions(trimmedQuery, placesSessionToken).then(({ data, error }) => {
        if (!isActive) {
          return;
        }

        if (error) {
          console.log('CreateActivity.searchPlaceSuggestions error', error);
          setLocationSearchError(error.message);
          setPlaceSuggestions([]);
          setIsSearchingPlaces(false);
          return;
        }

        setLocationSearchError(null);
        setPlaceSuggestions(data ?? []);
        setIsSearchingPlaces(false);
      });
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [locationQuery, placesSessionToken, selectedPlace]);

  const openPicker = (mode: DateTimePickerMode) => {
    setActivePicker((currentValue: DateTimePickerMode | null) =>
      currentValue === mode ? null : mode
    );
  };

  const handlePickerChange = (event: DateTimePickerEvent, nextValue?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (event.type === 'dismissed' || !activePicker || !nextValue) {
      return;
    }

    if (activePicker === 'date') {
      const normalizedDate = new Date(nextValue);
      normalizedDate.setHours(0, 0, 0, 0);
      setSelectedDate(normalizedDate);
      return;
    }

    const normalizedTime = new Date(nextValue);
    setSelectedTime(normalizedTime);
  };

  const openMapsForMeetingPoint = async () => {
    const query =
      selectedPlace?.locationAddress || selectedPlace?.locationName || locationQuery.trim();

    if (!query) {
      Alert.alert('Meeting point needed', 'Search for a location before opening maps.');
      return;
    }

    const mapUrls = buildMapUrls(query);

    for (const url of mapUrls) {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        return;
      }
    }

    Alert.alert('Maps unavailable', 'This device could not open a maps app for that location.');
  };

  const handleLocationQueryChange = (value: string) => {
    setLocationQuery(value);
    setSelectedPlace(null);
    setLocationSearchError(null);
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    setIsSearchingPlaces(true);
    const { data, error } = await getPlaceSelection(suggestion.placeId, placesSessionToken);
    setIsSearchingPlaces(false);

    if (error) {
      console.log('CreateActivity.getPlaceSelection error', error);
      setLocationSearchError(error.message);
      Alert.alert('Unable to select place', error.message);
      return;
    }

    if (!data) {
      Alert.alert('Unable to select place', 'This place could not be loaded.');
      return;
    }

    setSelectedPlace(data);
    setLocationQuery(data.locationName);
    setPlaceSuggestions([]);
    setLocationSearchError(null);
    setPlacesSessionToken(createPlacesSessionToken());
  };

  const handleClearSelectedPlace = () => {
    setSelectedPlace(null);
    setLocationQuery('');
    setPlaceSuggestions([]);
    setLocationSearchError(null);
    setPlacesSessionToken(createPlacesSessionToken());
  };

  const handleCreateActivity = () => {
    const fallbackStartAt = getFallbackStartAt();
    const dateValue = selectedDate ?? fallbackStartAt;
    const timeValue = selectedTime ?? fallbackStartAt;
    const resolvedPlace = selectedPlace
      ? selectedPlace
      : {
          placeId: '',
          locationName: 'Location TBD',
          locationAddress: '',
          latitude: null,
          longitude: null,
        };

    const mockParticipants = buildMockParticipants(participantLimit);
    const activity: Activity = {
      id: `activity-${Date.now()}`,
      type: selectedType,
      title: title.trim() || `${selectedType} Meetup`,
      date: dateValue.toISOString(),
      time: timeValue.toISOString(),
      location: resolvedPlace.locationName,
      locationAddress: resolvedPlace.locationAddress || undefined,
      googlePlaceId: resolvedPlace.placeId || undefined,
      latitude: resolvedPlace.latitude ?? undefined,
      longitude: resolvedPlace.longitude ?? undefined,
      participantLimit,
      approvalMode,
      visibility,
      description: description.trim() || 'New activity created on Joinly.',
      createdAt: new Date().toISOString(),
      hostName: 'You',
      hostInitials: 'YO',
      approvedParticipants: mockParticipants.approvedParticipants,
      pendingParticipants: mockParticipants.pendingParticipants,
    };

    console.log('CreateActivity screen payload', {
      title: activity.title,
      description: activity.description,
      type: activity.type,
      location_name: activity.location,
      location_address: activity.locationAddress,
      google_place_id: activity.googlePlaceId,
      latitude: activity.latitude,
      longitude: activity.longitude,
      starts_at: buildStartsAtPreview(dateValue, timeValue),
      ends_at: null,
      capacity: activity.participantLimit,
      visibility: activity.visibility,
      approval_mode: activity.approvalMode,
    });

    setIsSubmitting(true);
    void addActivity(activity).then(({ error }) => {
      setIsSubmitting(false);

      if (error) {
        console.log('CreateActivity screen error', error);
        Alert.alert('Unable to create activity', error.message);
        return;
      }

      router.replace('/(tabs)/(home)');
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.glowAccent} />
      </View>

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.safeArea}>
          <View style={styles.content}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={styles.heroCard}>
                <View style={styles.heroBadge}>
                  <MaterialIcons name="groups-2" size={16} color="#5C4630" />
                  <ThemedText style={styles.heroBadgeText}>Trust-based meetup</ThemedText>
                </View>
                <View style={styles.copyBlock}>
                  <ThemedText style={styles.title}>Create Activity</ThemedText>
                  <ThemedText style={styles.subtitle}>
                    Plan something simple and let the right people join.
                  </ThemedText>
                </View>
              </View>

              <FormSection title="Activity Type">
                <View style={styles.chipRow}>
                  {ACTIVITY_CATEGORIES.map((item) => (
                    <SelectablePill
                      color={item.color}
                      key={item.label}
                      icon={item.icon as keyof typeof MaterialIcons.glyphMap}
                      isSelected={selectedType === item.label}
                      label={item.label}
                      onPress={() => setSelectedType(item.label)}
                    />
                  ))}
                </View>
              </FormSection>

              <FormSection title="Title">
                <TextInput
                  onChangeText={setTitle}
                  placeholder="Morning coffee in Nişantaşı"
                  placeholderTextColor="#8A8379"
                  style={styles.textInput}
                  value={title}
                />
              </FormSection>

              <FormSection title="Date & Time" hint="Choose when to meet">
                <View style={styles.dualFieldRow}>
                  <FieldCard
                    icon="calendar-today"
                    label="Date"
                    onPress={() => openPicker('date')}
                    isPlaceholder={!selectedDate}
                    value={formattedDate}
                  />
                  <FieldCard
                    icon="schedule"
                    label="Time"
                    onPress={() => openPicker('time')}
                    isPlaceholder={!selectedTime}
                    value={formattedTime}
                  />
                </View>
                {activePicker ? (
                  <View
                    style={[
                      styles.pickerCard,
                      activePicker === 'date' ? styles.datePickerCard : styles.timePickerCard,
                    ]}>
                    <View style={styles.pickerCardHeader}>
                      <ThemedText style={styles.pickerCardTitle}>
                        {activePicker === 'date' ? 'Select a date' : 'Select a time'}
                      </ThemedText>
                      {Platform.OS === 'ios' ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => setActivePicker(null)}
                          style={({ pressed }) => [
                            styles.inlinePickerAction,
                            pressed ? styles.inlinePickerActionPressed : null,
                          ]}>
                          <ThemedText style={styles.inlinePickerActionText}>Done</ThemedText>
                        </Pressable>
                      ) : null}
                    </View>
                    <DateTimePicker
                      accentColor={Platform.OS === 'ios' ? '#B8B4AE' : undefined}
                      display={Platform.OS === 'ios' ? (activePicker === 'date' ? 'inline' : 'spinner') : 'default'}
                      minimumDate={activePicker === 'date' ? new Date() : undefined}
                      mode={activePicker}
                      onChange={handlePickerChange}
                      style={activePicker === 'date' ? styles.datePicker : styles.timePicker}
                      textColor={Platform.OS === 'ios' && activePicker === 'time' ? '#171411' : undefined}
                      themeVariant={Platform.OS === 'ios' ? 'light' : undefined}
                      value={pickerValue}
                    />
                  </View>
                ) : null}
              </FormSection>

              <FormSection title="Location">
                <LocationAutocomplete
                  errorMessage={locationSearchError}
                  hasApiKey={hasPlacesApiKey()}
                  isLoading={isSearchingPlaces}
                  neutralBody="You can decide the exact place later."
                  neutralTitle="Location TBD"
                  onChangeQuery={handleLocationQueryChange}
                  onClearSelection={handleClearSelectedPlace}
                  onSelectSuggestion={(suggestion) => {
                    void handleSelectPlace(suggestion);
                  }}
                  query={locationQuery}
                  selectedPlace={selectedPlace}
                  suggestions={placeSuggestions}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={!canOpenMaps}
                  onPress={openMapsForMeetingPoint}
                  style={({ pressed }) => [
                    styles.mapsButton,
                    !canOpenMaps ? styles.mapsButtonDisabled : null,
                    pressed && canOpenMaps ? styles.mapsButtonPressed : null,
                  ]}>
                  <View style={styles.mapsButtonCopy}>
                    <MaterialIcons
                      color={canOpenMaps ? '#5C4630' : '#A49A8D'}
                      name="map"
                      size={18}
                    />
                    <ThemedText
                      style={[styles.mapsButtonText, !canOpenMaps ? styles.mapsButtonTextDisabled : null]}>
                      Open in Maps
                    </ThemedText>
                  </View>
                  <MaterialIcons
                    color={canOpenMaps ? '#7D705E' : '#B4AA9F'}
                    name="north-east"
                    size={18}
                  />
                </Pressable>
              </FormSection>

              <FormSection title="Participant Limit">
                <View style={styles.chipRow}>
                  {PARTICIPANT_LIMITS.map((value) => (
                    <SelectablePill
                      key={value}
                      isSelected={participantLimit === value}
                      label={`${value}`}
                      onPress={() => setParticipantLimit(value)}
                    />
                  ))}
                </View>
              </FormSection>

              <FormSection title="Approval" hint="Recommended">
                <View style={styles.optionColumn}>
                  <OptionCard
                    description="Anyone who fits the vibe can join instantly."
                    icon="bolt"
                    isSelected={approvalMode === 'auto'}
                    onPress={() => setApprovalMode('auto')}
                    title="Auto Accept"
                  />
                  <OptionCard
                    badge="Safer"
                    description="Review requests before someone joins your activity."
                    icon="verified-user"
                    isSelected={approvalMode === 'manual'}
                    onPress={() => setApprovalMode('manual')}
                    title="Host Approval"
                  />
                </View>
              </FormSection>

              <FormSection title="Visibility">
                <View style={styles.optionColumn}>
                  <OptionCard
                    description="Visible in Joinly so nearby people can discover it."
                    icon="public"
                    isSelected={visibility === 'public'}
                    onPress={() => setVisibility('public')}
                    title="Public"
                  />
                  <OptionCard
                    description="Share only with people you invite directly."
                    icon="lock"
                    isSelected={visibility === 'private'}
                    onPress={() => setVisibility('private')}
                    title="Private / Invite Only"
                  />
                </View>
              </FormSection>

              <FormSection title="Description">
                <TextInput
                  multiline
                  onChangeText={setDescription}
                  placeholder="Add a few details so people know the vibe."
                  placeholderTextColor="#8A8379"
                  style={[styles.textInput, styles.textArea]}
                  textAlignVertical="top"
                  value={description}
                />
              </FormSection>

              <View style={styles.helperCard}>
                <View style={styles.helperIconWrap}>
                  <MaterialIcons color="#6A5237" name="shield" size={18} />
                </View>
                <View style={styles.helperCopy}>
                  <ThemedText style={styles.helperTitle}>Trust comes first</ThemedText>
                  <ThemedText style={styles.helperBody}>
                    You control who joins and can manage participants later.
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleCreateActivity}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed ? styles.ctaButtonPressed : null,
                  isSubmitting ? styles.ctaButtonDisabled : null,
                ]}>
                <ThemedText style={styles.ctaText}>
                  {isSubmitting ? 'Creating...' : 'Create Activity'}
                </ThemedText>
                <MaterialIcons color="#FFFDFC" name="arrow-forward" size={18} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const PARTICIPANT_LIMITS = [2, 3, 4, 5, 6, 8, 10];

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTimeLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function getPickerValue(
  activePicker: DateTimePickerMode | null,
  selectedDate: Date | null,
  selectedTime: Date | null
) {
  if (activePicker === 'date') {
    return selectedDate ?? getDefaultDateValue();
  }

  if (activePicker === 'time') {
    return selectedTime ?? getDefaultTimeValue();
  }

  return getDefaultDateValue();
}

function getDefaultDateValue() {
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 1);
  defaultDate.setHours(0, 0, 0, 0);
  return defaultDate;
}

function getDefaultTimeValue() {
  const defaultTime = new Date();
  defaultTime.setHours(18, 30, 0, 0);
  return defaultTime;
}

function getFallbackStartAt() {
  const fallbackDate = new Date(Date.now() + 60 * 60 * 1000);
  fallbackDate.setSeconds(0, 0);
  return fallbackDate;
}

function buildStartsAtPreview(dateValue: Date, timeValue: Date) {
  const nextDate = new Date(dateValue);
  nextDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
  return nextDate.toISOString();
}

function buildMapUrls(query: string) {
  const encodedQuery = encodeURIComponent(query);
  const googleMapsAppUrl =
    Platform.OS === 'ios'
      ? `comgooglemaps://?q=${encodedQuery}`
      : `comgooglemaps://?q=${encodedQuery}`;
  const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  const defaultMapsUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodedQuery}`
      : Platform.OS === 'android'
        ? `geo:0,0?q=${encodedQuery}`
        : googleMapsWebUrl;

  return [googleMapsAppUrl, googleMapsWebUrl, defaultMapsUrl];
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
    top: -110,
    right: -20,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#F1DFC3',
    opacity: 0.8,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 180,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F3E6D7',
    opacity: 0.9,
  },
  glowAccent: {
    position: 'absolute',
    top: 180,
    right: -90,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FAF0DF',
    opacity: 0.9,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 148,
    gap: 26,
  },
  heroCard: {
    gap: 16,
    padding: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 253, 249, 0.88)',
    borderWidth: 1,
    borderColor: '#F1E7DA',
    shadowColor: '#1A1714',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F2E5D1',
  },
  heroBadgeText: {
    color: '#5C4630',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  copyBlock: {
    gap: 10,
  },
  title: {
    color: '#171411',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.9,
  },
  subtitle: {
    color: '#60584E',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  textInput: {
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
    shadowColor: '#1A1714',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  textArea: {
    minHeight: 126,
  },
  dualFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerCard: {
    gap: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 253, 252, 0.96)',
    borderWidth: 1,
    borderColor: '#F2E9DE',
    padding: 16,
    shadowColor: '#1A1714',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  datePickerCard: {
    backgroundColor: '#FFFCF8',
  },
  timePickerCard: {
    backgroundColor: '#FFFDFC',
  },
  pickerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerCardTitle: {
    color: '#4E453B',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  inlinePickerAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3E8D7',
  },
  inlinePickerActionPressed: {
    opacity: 0.92,
  },
  inlinePickerActionText: {
    color: '#5C4630',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  datePicker: {
    borderRadius: 20,
    backgroundColor: '#F2F0EC',
    overflow: 'hidden',
  },
  timePicker: {
    alignSelf: 'stretch',
    borderRadius: 20,
    backgroundColor: '#F6F3EE',
  },
  mapsButton: {
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: '#F6EBDD',
    borderWidth: 1,
    borderColor: '#ECDCC6',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mapsButtonDisabled: {
    backgroundColor: '#F7F1E9',
    borderColor: '#EFE5D9',
  },
  mapsButtonPressed: {
    opacity: 0.94,
  },
  mapsButtonCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapsButtonText: {
    color: '#5C4630',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  mapsButtonTextDisabled: {
    color: '#A49A8D',
  },
  optionColumn: {
    gap: 12,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 24,
    backgroundColor: '#F7ECDC',
    borderWidth: 1,
    borderColor: '#EADCC7',
    padding: 18,
  },
  helperIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFDFC8',
  },
  helperCopy: {
    flex: 1,
    gap: 5,
  },
  helperTitle: {
    color: '#3C2E20',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  helperBody: {
    color: '#6A5C4D',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 248, 240, 0.96)',
  },
  ctaButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: '#201C18',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1A1714',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  ctaButtonPressed: {
    opacity: 0.94,
  },
  ctaButtonDisabled: {
    opacity: 0.72,
  },
  ctaText: {
    color: '#FFFDFC',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
