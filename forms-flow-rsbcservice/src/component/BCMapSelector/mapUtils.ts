// Default BC boundaries
export const BC_BOUNDARIES = {
  north: 60.0,
  south: 48.0,
  east: -114.0,
  west: -139.0,
};

// Map configuration interfaces
export interface MapSettings {
  boundaries?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  defaultZoom?: number;
  enableAddressSearch?: boolean;
  offlineMode?: 'auto' | 'enabled' | 'disabled';
  mapProvider: 'openstreetmap' | 'google' | 'mapbox' | 'custom';
  tileConfiguration?: {
    openstreetmap?: {
      tileUrl: string;
      attribution: string;
    };
    google?: {
      apiKey: string;
      mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    };
    mapbox?: {
      accessToken: string;
      styleId: string;
    };
    custom?: {
      tileUrl: string;
      attribution: string;
      maxZoom?: number;
      minZoom?: number;
    };
  };
  geocodingProvider?: 'nominatim' | 'google' | 'mapbox' | 'disabled';
}

export interface MapSelectionData {
  lat: string;
  long: string;
  address?: string;
  timestamp: string;
}

// Utility functions
export const isWithinBoundaries = (
  lat: number,
  lng: number,
  boundaries: { north: number; south: number; east: number; west: number }
): boolean => {
  return (
    lat >= boundaries.south &&
    lat <= boundaries.north &&
    lng >= boundaries.west &&
    lng <= boundaries.east
  );
};

export const getBoundaries = (customBoundaries?: any) => {
  if (customBoundaries && 
      typeof customBoundaries.north === 'number' &&
      typeof customBoundaries.south === 'number' &&
      typeof customBoundaries.east === 'number' &&
      typeof customBoundaries.west === 'number') {
    return customBoundaries;
  }
  return BC_BOUNDARIES;
};

export const parseMapSettings = (settingsJson?: string): MapSettings => {
  const defaultSettings: MapSettings = {
    mapProvider: 'openstreetmap',
    defaultZoom: 7,
    enableAddressSearch: true,
    offlineMode: 'auto',
    geocodingProvider: 'nominatim',
  };

  if (!settingsJson) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(settingsJson);
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Failed to parse map settings JSON:', error);
    return defaultSettings;
  }
};