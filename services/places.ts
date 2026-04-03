const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
const GOOGLE_PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const GOOGLE_PLACES_DETAILS_URL = 'https://places.googleapis.com/v1/places';

export type PlaceSuggestion = {
  placeId: string;
  name: string;
  secondaryText: string;
  fullText: string;
};

export type PlaceSelection = {
  placeId: string;
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
};

type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      place?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      text?: { text?: string };
    };
  }>;
};

type PlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

export async function searchPlaceSuggestions(
  query: string,
  sessionToken: string
): Promise<ServiceResponse<PlaceSuggestion[]>> {
  const trimmedQuery = query.trim();

  if (!GOOGLE_PLACES_API_KEY) {
    return { data: null, error: new Error('Google Places API key is not configured.') };
  }

  if (!trimmedQuery) {
    return { data: [], error: null };
  }

  try {
    const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.place,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.text',
      },
      body: JSON.stringify({
        input: trimmedQuery,
        sessionToken,
        languageCode: 'en',
      }),
    });

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`Places autocomplete failed with status ${response.status}.`),
      };
    }

    const result = (await response.json()) as AutocompleteResponse;
    const data =
      result.suggestions
        ?.map((suggestion) => suggestion.placePrediction)
        .filter(Boolean)
        .map((prediction) => {
          const placeResourceName = prediction?.place ?? '';
          const placeId = placeResourceName.replace('places/', '');
          const mainText = prediction?.structuredFormat?.mainText?.text?.trim() ?? '';
          const secondaryText = prediction?.structuredFormat?.secondaryText?.text?.trim() ?? '';
          const fallbackText = prediction?.text?.text?.trim() ?? '';
          const name = mainText || fallbackText || 'Unknown place';

          return {
            placeId,
            name,
            secondaryText,
            fullText: secondaryText ? `${name}, ${secondaryText}` : name,
          } satisfies PlaceSuggestion;
        })
        .filter((suggestion) => suggestion.placeId.length > 0) ?? [];

    return { data, error: null };
  } catch (error) {
    console.log('searchPlaceSuggestions unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export async function getPlaceSelection(
  placeId: string,
  sessionToken: string
): Promise<ServiceResponse<PlaceSelection>> {
  if (!GOOGLE_PLACES_API_KEY) {
    return { data: null, error: new Error('Google Places API key is not configured.') };
  }

  if (!placeId.trim()) {
    return { data: null, error: new Error('Place id is required.') };
  }

  try {
    const response = await fetch(`${GOOGLE_PLACES_DETAILS_URL}/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        'X-Goog-Session-Token': sessionToken,
      },
    });

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`Place details failed with status ${response.status}.`),
      };
    }

    const result = (await response.json()) as PlaceDetailsResponse;
    const latitude = result.location?.latitude;
    const longitude = result.location?.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { data: null, error: new Error('Selected place did not return coordinates.') };
    }

    return {
      data: {
        placeId: result.id?.trim() || placeId,
        locationName: result.displayName?.text?.trim() || 'Selected place',
        locationAddress: result.formattedAddress?.trim() || '',
        latitude,
        longitude,
      },
      error: null,
    };
  } catch (error) {
    console.log('getPlaceSelection unexpected error', error);
    return { data: null, error: toError(error) };
  }
}

export function createPlacesSessionToken() {
  return `joinly-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function hasPlacesApiKey() {
  return GOOGLE_PLACES_API_KEY.length > 0;
}

function toError(error: unknown) {
  if (error instanceof Error) {
    return error;
  }

  return new Error('Unknown places service error');
}
