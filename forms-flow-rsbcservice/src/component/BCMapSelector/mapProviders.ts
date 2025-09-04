import * as L from 'leaflet';

export interface MapProviderConfig {
  type: 'openstreetmap' | 'google' | 'mapbox' | 'custom';
  apiKey?: string;
  accessToken?: string;
  styleId?: string;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  tileUrl?: string;
  attribution?: string;
  maxZoom?: number;
  minZoom?: number;
}

export interface TileLayerOptions {
  url: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  subdomains?: string[];
}

export class MapProviderFactory {
  /**
   * Creates a tile layer configuration based on the provider type and settings
   */
  static createTileLayer(config: MapProviderConfig): TileLayerOptions {
    switch (config.type) {
      case 'openstreetmap':
        return MapProviderFactory.createOpenStreetMapLayer();
      
      case 'google':
        return MapProviderFactory.createGoogleMapsLayer(config);
      
      case 'mapbox':
        return MapProviderFactory.createMapboxLayer(config);
      
      case 'custom':
        return MapProviderFactory.createCustomLayer(config);
      
      default:
        console.warn(`Unknown map provider type: ${config.type}, falling back to OpenStreetMap`);
        return MapProviderFactory.createOpenStreetMapLayer();
    }
  }

  /**
   * Creates OpenStreetMap tile layer configuration
   */
  private static createOpenStreetMapLayer(): TileLayerOptions {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 1,
      subdomains: ['a', 'b', 'c']
    };
  }

  /**
   * Creates Google Maps tile layer configuration
   * Note: This uses Google's tile service through Leaflet, which may require proper API key setup
   */
  private static createGoogleMapsLayer(config: MapProviderConfig): TileLayerOptions {
    if (!config.apiKey) {
      console.error('Google Maps API key is required');
      return MapProviderFactory.createOpenStreetMapLayer();
    }

    const mapType = config.mapType || 'roadmap';
    let url: string;
    let attribution: string;

    switch (mapType) {
      case 'satellite':
        url = `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${config.apiKey}`;
        attribution = '&copy; <a href="https://www.google.com/maps">Google Maps</a>';
        break;
      case 'hybrid':
        url = `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${config.apiKey}`;
        attribution = '&copy; <a href="https://www.google.com/maps">Google Maps</a>';
        break;
      case 'terrain':
        url = `https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}&key=${config.apiKey}`;
        attribution = '&copy; <a href="https://www.google.com/maps">Google Maps</a>';
        break;
      case 'roadmap':
      default:
        url = `https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=${config.apiKey}`;
        attribution = '&copy; <a href="https://www.google.com/maps">Google Maps</a>';
        break;
    }

    return {
      url,
      attribution,
      maxZoom: 20,
      minZoom: 1
    };
  }

  /**
   * Creates Mapbox tile layer configuration
   */
  private static createMapboxLayer(config: MapProviderConfig): TileLayerOptions {
    if (!config.accessToken) {
      console.error('Mapbox access token is required');
      return MapProviderFactory.createOpenStreetMapLayer();
    }

    const styleId = config.styleId || 'mapbox/streets-v11';
    
    return {
      url: `https://api.mapbox.com/styles/v1/${styleId}/tiles/{z}/{x}/{y}?access_token=${config.accessToken}`,
      attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 22,
      minZoom: 1
    };
  }

  /**
   * Creates custom tile layer configuration
   */
  private static createCustomLayer(config: MapProviderConfig): TileLayerOptions {
    if (!config.tileUrl) {
      console.error('Custom tile URL is required');
      return MapProviderFactory.createOpenStreetMapLayer();
    }

    // Validate that the URL contains required placeholders
    if (!config.tileUrl.includes('{z}') || !config.tileUrl.includes('{x}') || !config.tileUrl.includes('{y}')) {
      console.error('Custom tile URL must contain {z}, {x}, and {y} placeholders');
      return MapProviderFactory.createOpenStreetMapLayer();
    }

    return {
      url: config.tileUrl,
      attribution: config.attribution || '&copy; Custom Map Provider',
      maxZoom: config.maxZoom || 18,
      minZoom: config.minZoom || 1
    };
  }

  /**
   * Validates API key for Google Maps
   */
  static validateGoogleApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }
    
    // Basic format validation - Google API keys typically start with 'AIza' and are 39 characters long
    const googleApiKeyPattern = /^AIza[0-9A-Za-z-_]{35}$/;
    return googleApiKeyPattern.test(apiKey);
  }

  /**
   * Validates access token for Mapbox
   */
  static validateMapboxToken(token: string): boolean {
    if (!token || token.trim().length === 0) {
      return false;
    }
    
    // Basic format validation - Mapbox tokens start with 'pk.' or 'sk.'
    const mapboxTokenPattern = /^(pk|sk)\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/;
    return mapboxTokenPattern.test(token);
  }

  /**
   * Gets the appropriate provider configuration from component settings
   */
  static getProviderConfigFromSettings(component: any): MapProviderConfig {
    // First check direct component properties (from settings form)
    const mapProvider = component.mapProvider || 'openstreetmap';
    
    let config: MapProviderConfig = {
      type: mapProvider as MapProviderConfig['type']
    };

    // Add provider-specific configuration
    switch (mapProvider) {
      case 'google':
        config.apiKey = component.googleApiKey;
        config.mapType = component.googleMapType || 'roadmap';
        break;
      
      case 'mapbox':
        config.accessToken = component.mapboxAccessToken;
        config.styleId = component.mapboxStyleId || 'mapbox/streets-v11';
        break;
      
      case 'custom':
        config.tileUrl = component.customTileUrl;
        config.attribution = component.customAttribution;
        config.maxZoom = component.customMaxZoom;
        config.minZoom = component.customMinZoom;
        break;
    }

    // Check for JSON settings override
    if (component.bcMapSettings) {
      try {
        const jsonSettings = JSON.parse(component.bcMapSettings);
        if (jsonSettings.mapProvider) {
          config.type = jsonSettings.mapProvider;
        }
        
        if (jsonSettings.tileConfiguration) {
          const tileConfig = jsonSettings.tileConfiguration[config.type];
          if (tileConfig) {
            Object.assign(config, tileConfig);
          }
        }
      } catch (error) {
        console.warn('Invalid BC Map Settings JSON, using form settings:', error);
      }
    }

    return config;
  }
}