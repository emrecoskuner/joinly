import type { RefObject } from 'react';
import type MapView from 'react-native-maps';
import type { MapRegion } from '@/lib/location';

export type MapActivityMarker = {
  id: string;
  title: string;
  category: string;
  location: string;
  hostName: string;
  dateLabel: string;
  timeLabel: string;
  accentColor: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

export type JoinlyMapProps = {
  markers: MapActivityMarker[];
  region: MapRegion;
  showsUserLocation?: boolean;
  mapRef?: RefObject<MapView | null>;
  onMapPress?: () => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  onMarkerPress: (markerId: string) => void;
};
