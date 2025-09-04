import { BCBoundaries, validateCoordinatesWithinBoundaries } from './boundaryUtils';

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address?: string;
  place_id?: string;
}

export class GeocodingError extends Error {
  code?: string;
  
  constructor(options: { message: string; code?: string }) {
    super(options.message);
    this.name = 'GeocodingError';
    this.code = options.code;
  }
}

export interface GeocodingConfig {
  provider: 'nominatim' | 'google' | 'mapbox' | 'disabled';
  nominatim?: {
    baseUrl?: string;
  };
  google?: {
    apiKey: string;
  };
  mapbox?: {
    accessToken: string;
  };
}

export class GeocodingService {
  private config: GeocodingConfig;
  private boundaries: BCBoundaries;

  constructor(config: GeocodingConfig, boundaries: BCBoundaries) {
    this.config = config;
    this.boundaries = boundaries;
  }

  async searchAddress(query: string): Promise<GeocodingResult[]> {
    if (!this.isEnabled() || !query.trim()) {
      return [];
    }

    try {
      let results: GeocodingResult[] = [];

      switch (this.config.provider) {
        case 'nominatim':
          results = await this.searchNominatim(query);
          break;
        case 'google':
          results = await this.searchGoogle(query);
          break;
        case 'mapbox':
          results = await this.searchMapbox(query);
          break;
        default:
          return [];
      }

      // Filter results to only include those within boundaries
      return results.filter(result => {
        const validation = validateCoordinatesWithinBoundaries(
          { lat: result.lat, lng: result.lng },
          this.boundaries
        );
        return validation.isValid;
      });
    } catch (error) {
      console.error('Geocoding search failed:', error);
      throw new GeocodingError({
        message: `Address search failed: ${error.message}`,
        code: 'SEARCH_FAILED'
      });
    }
  }

  private async searchNominatim(query: string): Promise<GeocodingResult[]> {
    const baseUrl = this.config.nominatim?.baseUrl || 'https://nominatim.openstreetmap.org/search';
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
      countrycodes: 'ca', // Limit to Canada
      bounded: '1',
      viewbox: `${this.boundaries.west},${this.boundaries.south},${this.boundaries.east},${this.boundaries.north}`
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'User-Agent': 'BCMapSelector/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      address: item.display_name,
      place_id: item.place_id
    }));
  }

  private async searchGoogle(query: string): Promise<GeocodingResult[]> {
    if (!this.config.google?.apiKey) {
      throw new Error('Google API key not configured');
    }

    const params = new URLSearchParams({
      address: query,
      key: this.config.google.apiKey,
      bounds: `${this.boundaries.south},${this.boundaries.west}|${this.boundaries.north},${this.boundaries.east}`,
      region: 'ca' // Bias towards Canada
    });

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    
    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Geocoding API error: ${data.status}`);
    }

    return data.results.map((item: any) => ({
      lat: item.geometry.location.lat,
      lng: item.geometry.location.lng,
      display_name: item.formatted_address,
      address: item.formatted_address,
      place_id: item.place_id
    }));
  }

  private async searchMapbox(query: string): Promise<GeocodingResult[]> {
    if (!this.config.mapbox?.accessToken) {
      throw new Error('Mapbox access token not configured');
    }

    const bbox = `${this.boundaries.west},${this.boundaries.south},${this.boundaries.east},${this.boundaries.north}`;
    const params = new URLSearchParams({
      access_token: this.config.mapbox.accessToken,
      bbox: bbox,
      country: 'ca',
      limit: '5'
    });

    const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`);
    
    if (!response.ok) {
      throw new Error(`Mapbox Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.features.map((item: any) => ({
      lat: item.center[1],
      lng: item.center[0],
      display_name: item.place_name,
      address: item.place_name,
      place_id: item.id
    }));
  }

  isEnabled(): boolean {
    return this.config.provider !== 'disabled';
  }

  getProviderName(): string {
    switch (this.config.provider) {
      case 'nominatim':
        return 'Nominatim (OpenStreetMap)';
      case 'google':
        return 'Google Geocoding';
      case 'mapbox':
        return 'Mapbox Geocoding';
      default:
        return 'Disabled';
    }
  }
}

interface ParsedSettings {
  geocodingProvider?: string;
  geocodingConfiguration?: {
    nominatim?: {
      baseUrl?: string;
    };
    google?: {
      apiKey?: string;
    };
    mapbox?: {
      accessToken?: string;
    };
  };
}

export function createGeocodingConfig(componentSettings: any): GeocodingConfig {
  // Parse JSON settings if available
  let settings: ParsedSettings = {};
  if (componentSettings.bcMapSettings) {
    try {
      settings = JSON.parse(componentSettings.bcMapSettings) as ParsedSettings;
    } catch (error) {
      console.warn('Failed to parse bcMapSettings JSON:', error);
    }
  }

  // Determine provider from settings or component config
  const provider = settings.geocodingProvider || 
                  componentSettings.geocodingProvider || 
                  'nominatim';

  const config: GeocodingConfig = {
    provider: provider as 'nominatim' | 'google' | 'mapbox' | 'disabled'
  };

  // Configure provider-specific settings
  if (provider === 'nominatim') {
    config.nominatim = {
      baseUrl: settings.geocodingConfiguration?.nominatim?.baseUrl || 
               'https://nominatim.openstreetmap.org/search'
    };
  } else if (provider === 'google') {
    const apiKey = settings.geocodingConfiguration?.google?.apiKey ||
                   componentSettings.googleGeocodingApiKey ||
                   componentSettings.googleApiKey;
    
    if (apiKey) {
      config.google = { apiKey };
    } else {
      console.warn('Google geocoding selected but no API key provided');
      config.provider = 'disabled';
    }
  } else if (provider === 'mapbox') {
    const accessToken = settings.geocodingConfiguration?.mapbox?.accessToken ||
                       componentSettings.mapboxGeocodingToken ||
                       componentSettings.mapboxAccessToken;
    
    if (accessToken) {
      config.mapbox = { accessToken };
    } else {
      console.warn('Mapbox geocoding selected but no access token provided');
      config.provider = 'disabled';
    }
  }

  return config;
}