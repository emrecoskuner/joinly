import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type MapView from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { ACTIVITY_CATEGORIES } from '@/constants/activity-categories';
import { JoinlyMap } from '@/components/map/joinly-map';
import type { MapActivityMarker } from '@/components/map/joinly-map.types';
import { shouldAppearInDiscovery } from '@/lib/activity-time';
import {
  buildMapRegion,
  DEFAULT_MAP_REGION,
  getDistanceInKilometers,
  hasValidCoordinates,
  type Coordinates,
  type MapRegion,
} from '@/lib/location';
import { mapActivityToEventItem, useActivityStore } from '@/store/activity-store';
import { useMapStore } from '@/store/map-store';

const NEARBY_DISTANCE_KM = 12;
const TAB_BAR_ALLOWANCE = 112;

type PermissionState = 'idle' | 'granted' | 'denied';

type MappedActivity = MapActivityMarker & {
  hostId: string;
  isHostedByCurrentUser: boolean;
  dateTimeIso: string;
};

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const hasStoredRegionRef = useRef(false);
  const { browseEvents, createdActivities, currentTime, currentUserId, isLoadingActivities } =
    useActivityStore();
  const {
    mode,
    region,
    selectedCategory,
    setMode,
    setRegion,
    setSelectedCategory,
  } = useMapStore();
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [hasDismissedExplainer, setHasDismissedExplainer] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  useEffect(() => {
    hasStoredRegionRef.current = !isDefaultRegion(region);
  }, [region]);

  useEffect(() => {
    void (async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();

        if (permission.granted) {
          setPermissionState('granted');
          setHasDismissedExplainer(true);
          try {
            const currentPosition = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const nextLocation = {
              latitude: currentPosition.coords.latitude,
              longitude: currentPosition.coords.longitude,
            };
            const nextRegion = buildMapRegion(nextLocation, 0.08, 0.08);

            setUserLocation(nextLocation);
            if (!hasStoredRegionRef.current) {
              setRegion(nextRegion);
            }
          } catch (locationError) {
            console.log('MapScreen.restoreCurrentLocation error', locationError);
            setUserLocation(null);
          }
          return;
        }

        setPermissionState(permission.canAskAgain ? 'idle' : 'denied');
      } catch (error) {
        console.log('MapScreen.restoreLocationPermission error', error);
        setPermissionState('denied');
      }
    })();
  }, [setRegion]);

  const mapActivities = useMemo<MappedActivity[]>(() => {
    const hostedEvents = createdActivities.map((activity) => ({
      ...mapActivityToEventItem(activity),
      isHostedByCurrentUser: true,
    }));
    const nonHostedEvents = browseEvents.map((event) => ({
      ...event,
      isHostedByCurrentUser: event.hostId === currentUserId,
    }));
    const mergedEvents = [...hostedEvents, ...nonHostedEvents];
    const uniqueEvents = mergedEvents.filter(
      (event, index, list) => list.findIndex((candidate) => candidate.id === event.id) === index
    );

    return uniqueEvents
      .filter(
        (event) =>
          shouldAppearInDiscovery(
            { startsAt: event.dateTimeIso, status: event.status },
            currentTime
          ) &&
          event.location !== 'Location TBD' &&
          hasValidCoordinates(event.latitude, event.longitude)
      )
      .map((event) => {
        const marker: MappedActivity = {
          id: event.id,
          title: event.title,
          category: event.category,
          location: event.location,
          hostName: event.hostName,
          dateLabel: event.dateLabel,
          timeLabel: event.timeLabel,
          accentColor: event.accentColor,
          latitude: event.latitude as number,
          longitude: event.longitude as number,
          hostId: event.hostId,
          isHostedByCurrentUser: event.hostId === currentUserId,
          dateTimeIso: event.dateTimeIso,
        };

        if (!userLocation) {
          return marker;
        }

        return {
          ...marker,
          distanceKm: getDistanceInKilometers(userLocation, {
            latitude: marker.latitude,
            longitude: marker.longitude,
          }),
        };
      })
      .sort((left, right) => {
        if (typeof left.distanceKm === 'number' && typeof right.distanceKm === 'number') {
          return left.distanceKm - right.distanceKm;
        }

        return new Date(left.dateTimeIso).getTime() - new Date(right.dateTimeIso).getTime();
      });
  }, [browseEvents, createdActivities, currentTime, currentUserId, userLocation]);

  const availableCategoryLabels = useMemo(
    () =>
      ACTIVITY_CATEGORIES.map((category) => category.label).filter((label) =>
        mapActivities.some((activity) => activity.category === label)
      ),
    [mapActivities]
  );

  useEffect(() => {
    if (selectedCategory && !availableCategoryLabels.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [availableCategoryLabels, selectedCategory, setSelectedCategory]);

  const effectiveMode = userLocation ? mode : 'all';
  const displayedMarkers = useMemo(() => {
    let filtered = mapActivities;

    if (effectiveMode === 'nearby') {
      filtered = filtered.filter(
        (activity) =>
          typeof activity.distanceKm === 'number' && activity.distanceKm <= NEARBY_DISTANCE_KM
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((activity) => activity.category === selectedCategory);
    }

    return filtered;
  }, [effectiveMode, mapActivities, selectedCategory]);

  const showsExplainer = permissionState === 'idle' && !hasDismissedExplainer;
  const nearbyCount = mapActivities.filter(
    (activity) => typeof activity.distanceKm === 'number' && activity.distanceKm <= NEARBY_DISTANCE_KM
  ).length;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <JoinlyMap
        mapRef={mapRef}
        markers={displayedMarkers}
        onMarkerPress={handleMarkerPress}
        onRegionChangeComplete={setRegion}
        region={region}
        showsUserLocation={permissionState === 'granted' && Platform.OS !== 'web'}
      />

      <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={styles.safeArea}>
        <View pointerEvents="box-none" style={styles.overlayRoot}>
          <View style={[styles.topOverlay, { paddingTop: Math.max(insets.top, 8) }]}>
            <View style={styles.modeRail}>
              <ModeChip
                disabled={!userLocation}
                isSelected={effectiveMode === 'nearby'}
                label={userLocation ? `Nearby${nearbyCount ? ` (${nearbyCount})` : ''}` : 'Nearby'}
                onPress={() => setMode('nearby')}
              />
              <ModeChip
                isSelected={effectiveMode === 'all'}
                label={`All activities (${mapActivities.length})`}
                onPress={() => setMode('all')}
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.categoryRailContent}
              horizontal
              showsHorizontalScrollIndicator={false}>
              <CategoryChip
                isSelected={selectedCategory === null}
                label="All types"
                onPress={() => setSelectedCategory(null)}
              />
              {availableCategoryLabels.map((label) => (
                <CategoryChip
                  isSelected={selectedCategory === label}
                  key={label}
                  label={label}
                  onPress={() => setSelectedCategory(label)}
                />
              ))}
            </ScrollView>

            {permissionState === 'denied' ? (
              <View style={styles.inlineNotice}>
                <MaterialIcons color="#805A34" name="location-off" size={15} />
                <ThemedText style={styles.inlineNoticeText}>
                  Location is off. Showing all pinned activities.
                </ThemedText>
              </View>
            ) : null}
          </View>

          {showsExplainer ? (
            <View style={styles.permissionSheet}>
              <View style={styles.permissionIconWrap}>
                <MaterialIcons color="#2F6F68" name="near-me" size={20} />
              </View>
              <ThemedText style={styles.permissionTitle}>Find activities near you</ThemedText>
              <ThemedText style={styles.permissionBody}>
                Allow foreground location so Joinly can center the map around you and surface nearby plans first.
              </ThemedText>
              <View style={styles.permissionActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isResolvingLocation}
                  onPress={() => {
                    void requestLocationAccess();
                  }}
                  style={({ pressed }) => [
                    styles.primaryAction,
                    pressed ? styles.buttonPressed : null,
                    isResolvingLocation ? styles.buttonDisabled : null,
                  ]}>
                  {isResolvingLocation ? (
                    <ActivityIndicator color="#FFFDFC" size="small" />
                  ) : (
                    <>
                      <MaterialIcons color="#FFFDFC" name="my-location" size={16} />
                      <ThemedText style={styles.primaryActionText}>Enable location</ThemedText>
                    </>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setHasDismissedExplainer(true)}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    pressed ? styles.buttonPressed : null,
                  ]}>
                  <ThemedText style={styles.secondaryActionText}>Maybe later</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}

          {userLocation ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleRecenter}
              style={({ pressed }) => [
                styles.recenterButton,
                { top: Math.max(insets.top, 8) + 122 },
                pressed ? styles.recenterButtonPressed : null,
              ]}>
              <MaterialIcons color="#201C18" name="my-location" size={20} />
            </Pressable>
          ) : null}

          {isLoadingActivities ? (
            <View style={[styles.bottomFloatingCard, { bottom: TAB_BAR_ALLOWANCE + insets.bottom }]}>
              <ActivityIndicator color="#3F7C74" />
              <ThemedText style={styles.stateTitle}>Loading map activity...</ThemedText>
            </View>
          ) : displayedMarkers.length === 0 ? (
            <View style={[styles.bottomFloatingCard, { bottom: TAB_BAR_ALLOWANCE + insets.bottom }]}>
              <MaterialIcons color="#73695E" name="room" size={18} />
              <View style={styles.stateCopy}>
                <ThemedText style={styles.stateTitle}>
                  {effectiveMode === 'nearby' ? 'No nearby pins right now' : 'No pinned activities yet'}
                </ThemedText>
                <ThemedText style={styles.stateBody}>
                  {effectiveMode === 'nearby'
                    ? `Nothing is within ${NEARBY_DISTANCE_KM} km. Try All activities or another type.`
                    : 'Activities with a saved place will appear here as map pins.'}
                </ThemedText>
              </View>
            </View>
          ) : (
            <View style={[styles.bottomHint, { bottom: TAB_BAR_ALLOWANCE + insets.bottom }]}>
              <MaterialIcons color="#FFFDFC" name="explore" size={15} />
              <ThemedText style={styles.bottomHintText}>
                Tap a marker to open the activity
              </ThemedText>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );

  function handleMarkerPress(markerId: string) {
    const selectedMarker = displayedMarkers.find((marker) => marker.id === markerId);

    if (!selectedMarker) {
      return;
    }

    router.push({
      pathname: selectedMarker.isHostedByCurrentUser ? '/activity/[id]' : '/event/[id]',
      params: { id: selectedMarker.id },
    });
  }

  function handleRecenter() {
    if (!userLocation) {
      return;
    }

    const nextRegion = buildMapRegion(userLocation, 0.08, 0.08);
    setRegion(nextRegion);
    const mapInstance = mapRef.current as {
      animateToRegion?: (nextRegionValue: MapRegion, duration?: number) => void;
    } | null;
    mapInstance?.animateToRegion?.(nextRegion, 350);
  }

  async function requestLocationAccess() {
    try {
      setIsResolvingLocation(true);
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setPermissionState('denied');
        setHasDismissedExplainer(true);
        return;
      }

      setPermissionState('granted');
      setHasDismissedExplainer(true);
      await resolveCurrentLocation();
    } catch (error) {
      console.log('MapScreen.requestLocationAccess error', error);
      setPermissionState('denied');
      setHasDismissedExplainer(true);
    } finally {
      setIsResolvingLocation(false);
    }
  }

  async function resolveCurrentLocation() {
    try {
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const nextLocation = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      const nextRegion = buildMapRegion(nextLocation, 0.08, 0.08);

      setUserLocation(nextLocation);
      if (!hasStoredRegionRef.current) {
        setRegion(nextRegion);
      }
      const mapInstance = mapRef.current as {
        animateToRegion?: (nextRegionValue: MapRegion, duration?: number) => void;
      } | null;
      if (!hasStoredRegionRef.current) {
        mapInstance?.animateToRegion?.(nextRegion, 350);
      }
    } catch (error) {
      console.log('MapScreen.resolveCurrentLocation error', error);
      setUserLocation(null);
      if (!hasStoredRegionRef.current) {
        setRegion(DEFAULT_MAP_REGION);
      }
    }
  }
}

function ModeChip({
  label,
  isSelected,
  disabled = false,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.modeChip,
        isSelected ? styles.modeChipSelected : null,
        disabled ? styles.modeChipDisabled : null,
        pressed && !disabled ? styles.modeChipPressed : null,
      ]}>
      <ThemedText style={[styles.modeChipText, isSelected ? styles.modeChipTextSelected : null]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function CategoryChip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryChip,
        isSelected ? styles.categoryChipSelected : null,
        pressed ? styles.categoryChipPressed : null,
      ]}>
      <ThemedText
        style={[styles.categoryChipText, isSelected ? styles.categoryChipTextSelected : null]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function isDefaultRegion(region: MapRegion) {
  return (
    region.latitude === DEFAULT_MAP_REGION.latitude &&
    region.longitude === DEFAULT_MAP_REGION.longitude &&
    region.latitudeDelta === DEFAULT_MAP_REGION.latitudeDelta &&
    region.longitudeDelta === DEFAULT_MAP_REGION.longitudeDelta
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E6EFEA',
  },
  safeArea: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayRoot: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    gap: 12,
  },
  modeRail: {
    flexDirection: 'row',
    gap: 10,
  },
  modeChip: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(233, 222, 210, 0.9)',
    justifyContent: 'center',
    shadowColor: '#1A1714',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  modeChipSelected: {
    backgroundColor: '#1F6A61',
    borderColor: '#1F6A61',
  },
  modeChipDisabled: {
    opacity: 0.55,
  },
  modeChipPressed: {
    opacity: 0.92,
  },
  modeChipText: {
    color: '#4C463D',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  modeChipTextSelected: {
    color: '#FFFDFC',
  },
  categoryRailContent: {
    gap: 10,
    paddingRight: 8,
  },
  categoryChip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255, 253, 249, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(233, 222, 210, 0.85)',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: '#201C18',
    borderColor: '#201C18',
  },
  categoryChipPressed: {
    opacity: 0.92,
  },
  categoryChipText: {
    color: '#51493F',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
  },
  categoryChipTextSelected: {
    color: '#FFFDFC',
  },
  inlineNotice: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(248, 236, 221, 0.94)',
    borderWidth: 1,
    borderColor: '#E9D6BE',
  },
  inlineNoticeText: {
    color: '#805A34',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  permissionSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 164,
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 253, 250, 0.98)',
    borderWidth: 1,
    borderColor: '#E8DED2',
    gap: 12,
    shadowColor: '#1A1714',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  permissionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F3F0',
  },
  permissionTitle: {
    color: '#171411',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  permissionBody: {
    color: '#60584E',
    fontSize: 14,
    lineHeight: 20,
  },
  permissionActions: {
    gap: 10,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: '#201C18',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFDFC',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: '#F7F1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#5A5146',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  recenterButton: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 253, 249, 0.95)',
    borderWidth: 1,
    borderColor: '#E9DED2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1714',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  recenterButtonPressed: {
    opacity: 0.92,
  },
  bottomFloatingCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 253, 250, 0.98)',
    borderWidth: 1,
    borderColor: '#E8DED2',
    shadowColor: '#1A1714',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stateCopy: {
    flex: 1,
    gap: 4,
  },
  stateTitle: {
    color: '#171411',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  stateBody: {
    color: '#6A6258',
    fontSize: 13,
    lineHeight: 18,
  },
  bottomHint: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 28, 24, 0.9)',
  },
  bottomHintText: {
    color: '#FFFDFC',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
