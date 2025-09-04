import { BCBoundaries, validateCoordinatesWithinBoundaries } from './boundaryUtils';

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
  type: 'permission_denied' | 'position_unavailable' | 'timeout' | 'not_supported';
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class GeolocationService {
  private static readonly DEFAULT_OPTIONS: GeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 15000, // 15 seconds
    maximumAge: 30000 // 30 seconds
  };

  /**
   * Check if geolocation is supported by the browser
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get current user position
   */
  static getCurrentPosition(options?: GeolocationOptions): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject({
          code: 0,
          message: 'Geolocation is not supported by this browser',
          type: 'not_supported'
        } as GeolocationError);
        return;
      }

      const opts = { ...this.DEFAULT_OPTIONS, ...options };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let errorType: GeolocationError['type'];
          let message: string;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = 'permission_denied';
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = 'position_unavailable';
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorType = 'timeout';
              message = 'Location request timed out';
              break;
            default:
              errorType = 'position_unavailable';
              message = 'An unknown error occurred while retrieving location';
              break;
          }

          reject({
            code: error.code,
            message,
            type: errorType
          } as GeolocationError);
        },
        opts
      );
    });
  }

  /**
   * Watch user position changes
   */
  static watchPosition(
    callback: (location: UserLocation) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: GeolocationOptions
  ): number | null {
    if (!this.isSupported()) {
      if (errorCallback) {
        errorCallback({
          code: 0,
          message: 'Geolocation is not supported by this browser',
          type: 'not_supported'
        });
      }
      return null;
    }

    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        if (errorCallback) {
          let errorType: GeolocationError['type'];
          let message: string;

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorType = 'permission_denied';
              message = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorType = 'position_unavailable';
              message = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorType = 'timeout';
              message = 'Location request timed out';
              break;
            default:
              errorType = 'position_unavailable';
              message = 'An unknown error occurred while retrieving location';
              break;
          }

          errorCallback({
            code: error.code,
            message,
            type: errorType
          });
        }
      },
      opts
    );
  }

  /**
   * Clear position watch
   */
  static clearWatch(watchId: number): void {
    if (this.isSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Validate user location against boundaries
   */
  static validateLocationWithinBoundaries(
    location: UserLocation,
    boundaries: BCBoundaries
  ) {
    return validateCoordinatesWithinBoundaries(
      { lat: location.lat, lng: location.lng },
      boundaries
    );
  }

  /**
   * Get user-friendly error message for geolocation errors
   */
  static getErrorMessage(error: GeolocationError): string {
    switch (error.type) {
      case 'permission_denied':
        return 'Location access was denied. You can still select a location manually on the map.';
      case 'position_unavailable':
        return 'Your location could not be determined. Please select a location manually on the map.';
      case 'timeout':
        return 'Location request timed out. Please select a location manually on the map.';
      case 'not_supported':
        return 'Location services are not supported by your browser. Please select a location manually on the map.';
      default:
        return 'Unable to access your location. Please select a location manually on the map.';
    }
  }
}