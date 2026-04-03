export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MapRegion = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
};

const EARTH_RADIUS_KM = 6371;

export function buildMapRegion(
  coordinates: Coordinates,
  latitudeDelta = 0.08,
  longitudeDelta = 0.08
): MapRegion {
  return {
    ...coordinates,
    latitudeDelta,
    longitudeDelta,
  };
}

export function getDistanceInKilometers(from: Coordinates, to: Coordinates) {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const fromLatitude = toRadians(from.latitude);
  const toLatitudeValue = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) *
      Math.cos(toLatitudeValue) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const angle = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * angle;
}

export function hasValidCoordinates(latitude?: number | null, longitude?: number | null) {
  return typeof latitude === 'number' && typeof longitude === 'number';
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}
