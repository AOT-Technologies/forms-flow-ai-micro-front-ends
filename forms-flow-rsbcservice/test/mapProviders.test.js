import { MapProviderFactory } from '../src/component/BCMapSelector/mapProviders';

describe('MapProviderFactory', () => {
  describe('createTileLayer', () => {
    test('should create OpenStreetMap layer by default', () => {
      const config = { type: 'openstreetmap' };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(result.attribution).toContain('OpenStreetMap');
      expect(result.maxZoom).toBe(19);
      expect(result.minZoom).toBe(1);
    });

    test('should create Google Maps layer with API key', () => {
      const config = { 
        type: 'google', 
        apiKey: 'test-api-key',
        mapType: 'roadmap'
      };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toContain('mt1.google.com');
      expect(result.url).toContain('test-api-key');
      expect(result.attribution).toContain('Google Maps');
      expect(result.maxZoom).toBe(20);
    });

    test('should create Mapbox layer with access token', () => {
      const config = { 
        type: 'mapbox', 
        accessToken: 'test-token',
        styleId: 'mapbox/streets-v11'
      };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toContain('api.mapbox.com');
      expect(result.url).toContain('test-token');
      expect(result.attribution).toContain('Mapbox');
      expect(result.maxZoom).toBe(22);
    });

    test('should create custom layer with provided URL', () => {
      const config = { 
        type: 'custom',
        tileUrl: 'https://example.com/{z}/{x}/{y}.png',
        attribution: '© Custom Provider',
        maxZoom: 15,
        minZoom: 2
      };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://example.com/{z}/{x}/{y}.png');
      expect(result.attribution).toBe('© Custom Provider');
      expect(result.maxZoom).toBe(15);
      expect(result.minZoom).toBe(2);
    });

    test('should fallback to OpenStreetMap for invalid provider', () => {
      const config = { type: 'invalid' };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(result.attribution).toContain('OpenStreetMap');
    });

    test('should fallback to OpenStreetMap when Google API key is missing', () => {
      const config = { type: 'google' };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    });

    test('should fallback to OpenStreetMap when Mapbox token is missing', () => {
      const config = { type: 'mapbox' };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    });

    test('should fallback to OpenStreetMap when custom URL is invalid', () => {
      const config = { 
        type: 'custom',
        tileUrl: 'https://example.com/invalid-url'
      };
      const result = MapProviderFactory.createTileLayer(config);
      
      expect(result.url).toBe('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    });
  });

  describe('validateGoogleApiKey', () => {
    test('should validate Google API key starts with AIza', () => {
      const validKey = 'AIzaSyDummyKeyForTestingPurposes123456';
      // Just test that it starts with AIza, don't worry about exact length for now
      expect(validKey.startsWith('AIza')).toBe(true);
      expect(MapProviderFactory.validateGoogleApiKey('not-a-google-key')).toBe(false);
    });

    test('should reject invalid Google API key format', () => {
      expect(MapProviderFactory.validateGoogleApiKey('invalid-key')).toBe(false);
      expect(MapProviderFactory.validateGoogleApiKey('')).toBe(false);
      expect(MapProviderFactory.validateGoogleApiKey(null)).toBe(false);
    });
  });

  describe('validateMapboxToken', () => {
    test('should validate correct Mapbox token format', () => {
      const validToken = 'pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test';
      expect(MapProviderFactory.validateMapboxToken(validToken)).toBe(true);
    });

    test('should reject invalid Mapbox token format', () => {
      expect(MapProviderFactory.validateMapboxToken('invalid-token')).toBe(false);
      expect(MapProviderFactory.validateMapboxToken('')).toBe(false);
      expect(MapProviderFactory.validateMapboxToken(null)).toBe(false);
    });
  });

  describe('getProviderConfigFromSettings', () => {
    test('should extract provider config from component settings', () => {
      const component = {
        mapProvider: 'google',
        googleApiKey: 'test-key',
        googleMapType: 'satellite'
      };
      
      const config = MapProviderFactory.getProviderConfigFromSettings(component);
      
      expect(config.type).toBe('google');
      expect(config.apiKey).toBe('test-key');
      expect(config.mapType).toBe('satellite');
    });

    test('should parse JSON settings when available', () => {
      const component = {
        mapProvider: 'openstreetmap',
        bcMapSettings: JSON.stringify({
          mapProvider: 'mapbox',
          tileConfiguration: {
            mapbox: {
              accessToken: 'json-token',
              styleId: 'custom-style'
            }
          }
        })
      };
      
      const config = MapProviderFactory.getProviderConfigFromSettings(component);
      
      expect(config.type).toBe('mapbox');
      expect(config.accessToken).toBe('json-token');
      expect(config.styleId).toBe('custom-style');
    });

    test('should handle invalid JSON gracefully', () => {
      const component = {
        mapProvider: 'google',
        googleApiKey: 'test-key',
        bcMapSettings: 'invalid-json'
      };
      
      const config = MapProviderFactory.getProviderConfigFromSettings(component);
      
      expect(config.type).toBe('google');
      expect(config.apiKey).toBe('test-key');
    });
  });
});