import { GeolocationService, UserLocation, GeolocationError } from './geolocationUtils';
import { DEFAULT_BC_BOUNDARIES } from './boundaryUtils';

// Mock the navigator.geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    geolocation: mockGeolocation
  },
  writable: true
});

describe('GeolocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when geolocation is available', () => {
      expect(GeolocationService.isSupported()).toBe(true);
    });

    it('should return false when geolocation is not available', () => {
      const originalGeolocation = global.navigator.geolocation;
      delete (global.navigator as any).geolocation;
      
      expect(GeolocationService.isSupported()).toBe(false);
      
      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('getCurrentPosition', () => {
    it('should resolve with user location on success', async () => {
      const mockPosition = {
        coords: {
          latitude: 49.2827,
          longitude: -123.1207,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const result = await GeolocationService.getCurrentPosition();

      expect(result).toEqual({
        lat: 49.2827,
        lng: -123.1207,
        accuracy: 10,
        timestamp: mockPosition.timestamp
      });
    });

    it('should reject with GeolocationError on permission denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied the request for Geolocation.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(GeolocationService.getCurrentPosition()).rejects.toEqual({
        code: 1,
        message: 'Location access denied by user',
        type: 'permission_denied'
      });
    });

    it('should reject with GeolocationError on position unavailable', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Location information is unavailable.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(GeolocationService.getCurrentPosition()).rejects.toEqual({
        code: 2,
        message: 'Location information is unavailable',
        type: 'position_unavailable'
      });
    });

    it('should reject with GeolocationError on timeout', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'The request to get user location timed out.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        error(mockError);
      });

      await expect(GeolocationService.getCurrentPosition()).rejects.toEqual({
        code: 3,
        message: 'Location request timed out',
        type: 'timeout'
      });
    });

    it('should reject with not_supported error when geolocation is not available', async () => {
      const originalGeolocation = global.navigator.geolocation;
      delete (global.navigator as any).geolocation;

      await expect(GeolocationService.getCurrentPosition()).rejects.toEqual({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'not_supported'
      });

      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('validateLocationWithinBoundaries', () => {
    it('should return valid result for location within BC boundaries', () => {
      const location: UserLocation = {
        lat: 49.2827, // Vancouver
        lng: -123.1207,
        accuracy: 10,
        timestamp: Date.now()
      };

      const result = GeolocationService.validateLocationWithinBoundaries(
        location,
        DEFAULT_BC_BOUNDARIES
      );

      expect(result.isValid).toBe(true);
    });

    it('should return invalid result for location outside BC boundaries', () => {
      const location: UserLocation = {
        lat: 45.0, // Outside BC (too far south)
        lng: -123.0,
        accuracy: 10,
        timestamp: Date.now()
      };

      const result = GeolocationService.validateLocationWithinBoundaries(
        location,
        DEFAULT_BC_BOUNDARIES
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far south');
    });
  });

  describe('getErrorMessage', () => {
    it('should return appropriate message for permission denied', () => {
      const error: GeolocationError = {
        code: 1,
        message: 'Permission denied',
        type: 'permission_denied'
      };

      const message = GeolocationService.getErrorMessage(error);
      expect(message).toContain('Location access was denied');
    });

    it('should return appropriate message for position unavailable', () => {
      const error: GeolocationError = {
        code: 2,
        message: 'Position unavailable',
        type: 'position_unavailable'
      };

      const message = GeolocationService.getErrorMessage(error);
      expect(message).toContain('Your location could not be determined');
    });

    it('should return appropriate message for timeout', () => {
      const error: GeolocationError = {
        code: 3,
        message: 'Timeout',
        type: 'timeout'
      };

      const message = GeolocationService.getErrorMessage(error);
      expect(message).toContain('Location request timed out');
    });

    it('should return appropriate message for not supported', () => {
      const error: GeolocationError = {
        code: 0,
        message: 'Not supported',
        type: 'not_supported'
      };

      const message = GeolocationService.getErrorMessage(error);
      expect(message).toContain('Location services are not supported');
    });
  });

  describe('watchPosition', () => {
    it('should return watch ID when geolocation is supported', () => {
      mockGeolocation.watchPosition.mockReturnValue(123);

      const callback = jest.fn();
      const watchId = GeolocationService.watchPosition(callback);

      expect(watchId).toBe(123);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });

    it('should return null and call error callback when geolocation is not supported', () => {
      const originalGeolocation = global.navigator.geolocation;
      delete (global.navigator as any).geolocation;

      const callback = jest.fn();
      const errorCallback = jest.fn();
      const watchId = GeolocationService.watchPosition(callback, errorCallback);

      expect(watchId).toBeNull();
      expect(errorCallback).toHaveBeenCalledWith({
        code: 0,
        message: 'Geolocation is not supported by this browser',
        type: 'not_supported'
      });

      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });

  describe('clearWatch', () => {
    it('should call navigator.geolocation.clearWatch when supported', () => {
      GeolocationService.clearWatch(123);
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(123);
    });

    it('should not throw when geolocation is not supported', () => {
      const originalGeolocation = global.navigator.geolocation;
      delete (global.navigator as any).geolocation;

      expect(() => GeolocationService.clearWatch(123)).not.toThrow();

      // Restore
      global.navigator.geolocation = originalGeolocation;
    });
  });
});