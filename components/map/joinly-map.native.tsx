import type { Region } from 'react-native-maps';
import MapView, { Marker } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

import { ActivityMapMarker } from '@/components/map/activity-map-marker';
import type { JoinlyMapProps } from '@/components/map/joinly-map.types';

export function JoinlyMap({
  markers,
  mapRef,
  region,
  showsUserLocation = false,
  onMapPress,
  onRegionChangeComplete,
  onMarkerPress,
}: JoinlyMapProps) {
  return (
    <View style={styles.container}>
      <MapView
        initialRegion={region}
        ref={mapRef}
        region={region}
        onPress={onMapPress}
        onRegionChangeComplete={(nextRegion: Region) =>
          onRegionChangeComplete?.(nextRegion)
        }
        showsCompass={false}
        showsMyLocationButton={false}
        showsUserLocation={showsUserLocation}
        style={styles.map}>
        {markers.map((marker) => (
          <Marker
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            key={marker.id}
            onPress={() => onMarkerPress(marker.id)}
            tracksViewChanges={false}>
            <ActivityMapMarker category={marker.category} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6EFEA',
  },
  map: {
    flex: 1,
  },
});
