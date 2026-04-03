import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

import { DEFAULT_MAP_REGION, type MapRegion } from '@/lib/location';

type MapMode = 'nearby' | 'all';

type MapStoreValue = {
  region: MapRegion;
  mode: MapMode;
  selectedCategory: string | null;
  setRegion: (region: MapRegion) => void;
  setMode: (mode: MapMode) => void;
  setSelectedCategory: (category: string | null) => void;
};

const MapStoreContext = createContext<MapStoreValue | null>(null);

export function MapStoreProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<MapRegion>(DEFAULT_MAP_REGION);
  const [mode, setMode] = useState<MapMode>('nearby');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      region,
      mode,
      selectedCategory,
      setRegion,
      setMode,
      setSelectedCategory,
    }),
    [mode, region, selectedCategory]
  );

  return <MapStoreContext.Provider value={value}>{children}</MapStoreContext.Provider>;
}

export function useMapStore() {
  const contextValue = useContext(MapStoreContext);

  if (!contextValue) {
    throw new Error('useMapStore must be used within a MapStoreProvider');
  }

  return contextValue;
}

export type { MapMode };
