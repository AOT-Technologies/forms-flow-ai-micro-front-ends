import { GeocodingService, createGeocodingConfig } from '../geocodingUtils';
import { DEFAULT_BC_BOUNDARIES } from '../boundaryUtils';

// Mock fetch for testing
global.fetch = jest.fn();

describe('GeocodingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Nominatim Provider', () => {
    it('should search addresses using Nominatim API', async () => {
      const mockResponse = [
        {
          lat: '49.2827',
          lon: '-123.1207',
          display_name: 'Vancouver, BC, Canada',
          place_id: '12345'
        }
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const config = {
        provider: 'nominatim' as const,
        nominatim: {
          baseUrl: 'https://nominatim.openstreetmap.org/search'
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const results = await service.searchAddress('Vancouver');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        lat: 49.2827,
        lng: -123.1207,
        display_name: 'Vancouver, BC, Canada',
        address: 'Vancouver, BC, Canada',
        place_id: '12345'
      });
    });

    it('should filter results outside boundaries', async () => {
      const mockResponse = [
        {
          lat: '49.2827', // Within BC boundaries
          lon: '-123.1207',
          display_name: 'Vancouver, BC, Canada',
          place_id: '12345'
        },
        {
          lat: '43.6532', // Outside BC boundaries (Toronto)
          lon: '-79.3832',
          display_name: 'Toronto, ON, Canada',
          place_id: '67890'
        }
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const config = {
        provider: 'nominatim' as const,
        nominatim: {
          baseUrl: 'https://nominatim.openstreetmap.org/search'
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const results = await service.searchAddress('Canada');

      // Should only return Vancouver (within boundaries)
      expect(results).toHaveLength(1);
      expect(results[0].display_name).toBe('Vancouver, BC, Canada');
    });
  });

  describe('Google Provider', () => {
    it('should search addresses using Google Geocoding API', async () => {
      const mockResponse = {
        status: 'OK',
        results: [
          {
            geometry: {
              location: {
                lat: 49.2827,
                lng: -123.1207
              }
            },
            formatted_address: 'Vancouver, BC, Canada',
            place_id: 'ChIJs0-pQ_FzhlQRi_OBm-qWkbs'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const config = {
        provider: 'google' as const,
        google: {
          apiKey: 'test-api-key'
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const results = await service.searchAddress('Vancouver');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        lat: 49.2827,
        lng: -123.1207,
        display_name: 'Vancouver, BC, Canada',
        address: 'Vancouver, BC, Canada',
        place_id: 'ChIJs0-pQ_FzhlQRi_OBm-qWkbs'
      });
    });

    it('should throw error when API key is missing', async () => {
      const config = {
        provider: 'google' as const,
        google: {
          apiKey: ''
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      
      await expect(service.searchAddress('Vancouver')).rejects.toThrow('Google API key not configured');
    });
  });

  describe('Mapbox Provider', () => {
    it('should search addresses using Mapbox Geocoding API', async () => {
      const mockResponse = {
        features: [
          {
            center: [-123.1207, 49.2827],
            place_name: 'Vancouver, British Columbia, Canada',
            id: 'place.123'
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const config = {
        provider: 'mapbox' as const,
        mapbox: {
          accessToken: 'test-access-token'
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const results = await service.searchAddress('Vancouver');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        lat: 49.2827,
        lng: -123.1207,
        display_name: 'Vancouver, British Columbia, Canada',
        address: 'Vancouver, British Columbia, Canada',
        place_id: 'place.123'
      });
    });
  });

  describe('Disabled Provider', () => {
    it('should return empty results when disabled', async () => {
      const config = {
        provider: 'disabled' as const
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const results = await service.searchAddress('Vancouver');

      expect(results).toHaveLength(0);
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('Reverse Geocoding', () => {
    describe('Nominatim Provider', () => {
      it('should reverse geocode coordinates using Nominatim API', async () => {
        const mockResponse = {
          display_name: '123 Main Street, Vancouver, BC, Canada',
          place_id: '12345'
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const config = {
          provider: 'nominatim' as const,
          nominatim: {
            baseUrl: 'https://nominatim.openstreetmap.org/search'
          }
        };

        const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
        const result = await service.reverseGeocode(49.2827, -123.1207);

        expect(result).toEqual({
          address: '123 Main Street, Vancouver, BC, Canada',
          display_name: '123 Main Street, Vancouver, BC, Canada',
          place_id: '12345'
        });
      });

      it('should return null when reverse geocoding fails', async () => {
        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ error: 'No results found' })
        });

        const config = {
          provider: 'nominatim' as const,
          nominatim: {
            baseUrl: 'https://nominatim.openstreetmap.org/search'
          }
        };

        const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
        const result = await service.reverseGeocode(49.2827, -123.1207);

        expect(result).toBeNull();
      });
    });

    describe('Google Provider', () => {
      it('should reverse geocode coordinates using Google API', async () => {
        const mockResponse = {
          status: 'OK',
          results: [
            {
              formatted_address: '123 Main Street, Vancouver, BC, Canada',
              place_id: 'ChIJs0-pQ_FzhlQRi_OBm-qWkbs'
            }
          ]
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const config = {
          provider: 'google' as const,
          google: {
            apiKey: 'test-api-key'
          }
        };

        const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
        const result = await service.reverseGeocode(49.2827, -123.1207);

        expect(result).toEqual({
          address: '123 Main Street, Vancouver, BC, Canada',
          display_name: '123 Main Street, Vancouver, BC, Canada',
          place_id: 'ChIJs0-pQ_FzhlQRi_OBm-qWkbs'
        });
      });

      it('should return null when no results found', async () => {
        const mockResponse = {
          status: 'ZERO_RESULTS',
          results: []
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const config = {
          provider: 'google' as const,
          google: {
            apiKey: 'test-api-key'
          }
        };

        const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
        const result = await service.reverseGeocode(49.2827, -123.1207);

        expect(result).toBeNull();
      });
    });

    describe('Disabled Provider', () => {
      it('should return null when reverse geocoding is disabled', async () => {
        const config = {
          provider: 'disabled' as const
        };

        const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
        const result = await service.reverseGeocode(49.2827, -123.1207);

        expect(result).toBeNull();
      });
    });

    it('should handle network errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const config = {
        provider: 'nominatim' as const,
        nominatim: {
          baseUrl: 'https://nominatim.openstreetmap.org/search'
        }
      };

      const service = new GeocodingService(config, DEFAULT_BC_BOUNDARIES);
      const result = await service.reverseGeocode(49.2827, -123.1207);

      expect(result).toBeNull();
    });
  });
});

describe('createGeocodingConfig', () => {
  it('should create Nominatim config by default', () => {
    const config = createGeocodingConfig({});
    
    expect(config.provider).toBe('nominatim');
    expect(config.nominatim?.baseUrl).toBe('https://nominatim.openstreetmap.org/search');
  });

  it('should create Google config with API key', () => {
    const settings = {
      geocodingProvider: 'google',
      googleApiKey: 'test-key'
    };
    
    const config = createGeocodingConfig(settings);
    
    expect(config.provider).toBe('google');
    expect(config.google?.apiKey).toBe('test-key');
  });

  it('should fallback to disabled when Google API key is missing', () => {
    const settings = {
      geocodingProvider: 'google'
      // No API key provided
    };
    
    const config = createGeocodingConfig(settings);
    
    expect(config.provider).toBe('disabled');
  });

  it('should parse JSON settings', () => {
    const settings = {
      bcMapSettings: JSON.stringify({
        geocodingProvider: 'mapbox',
        geocodingConfiguration: {
          mapbox: {
            accessToken: 'json-token'
          }
        }
      })
    };
    
    const config = createGeocodingConfig(settings);
    
    expect(config.provider).toBe('mapbox');
    expect(config.mapbox?.accessToken).toBe('json-token');
  });
});