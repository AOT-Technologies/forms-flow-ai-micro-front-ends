import { 
  validateCoordinatesWithinBoundaries, 
  createLeafletBounds, 
  getBoundariesCenter,
  calculateZoomForBoundaries,
  DEFAULT_BC_BOUNDARIES 
} from '../src/component/BCMapSelector/boundaryUtils';

describe('Boundary Utilities', () => {
  const testBoundaries = {
    north: 60.0,
    south: 48.0,
    east: -114.0,
    west: -139.0
  };

  describe('validateCoordinatesWithinBoundaries', () => {
    test('should validate coordinates within boundaries', () => {
      const validCoords = { lat: 55.0, lng: -125.0 };
      const result = validateCoordinatesWithinBoundaries(validCoords, testBoundaries);
      
      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    test('should reject coordinates outside north boundary', () => {
      const invalidCoords = { lat: 65.0, lng: -125.0 };
      const result = validateCoordinatesWithinBoundaries(invalidCoords, testBoundaries);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far north');
      expect(result.suggestedCoordinates).toEqual({ lat: 60.0, lng: -125.0 });
    });

    test('should reject coordinates outside south boundary', () => {
      const invalidCoords = { lat: 45.0, lng: -125.0 };
      const result = validateCoordinatesWithinBoundaries(invalidCoords, testBoundaries);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far south');
      expect(result.suggestedCoordinates).toEqual({ lat: 48.0, lng: -125.0 });
    });

    test('should reject coordinates outside east boundary', () => {
      const invalidCoords = { lat: 55.0, lng: -110.0 };
      const result = validateCoordinatesWithinBoundaries(invalidCoords, testBoundaries);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far east');
      expect(result.suggestedCoordinates).toEqual({ lat: 55.0, lng: -114.0 });
    });

    test('should reject coordinates outside west boundary', () => {
      const invalidCoords = { lat: 55.0, lng: -145.0 };
      const result = validateCoordinatesWithinBoundaries(invalidCoords, testBoundaries);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far west');
      expect(result.suggestedCoordinates).toEqual({ lat: 55.0, lng: -139.0 });
    });

    test('should handle multiple boundary violations', () => {
      const invalidCoords = { lat: 65.0, lng: -145.0 };
      const result = validateCoordinatesWithinBoundaries(invalidCoords, testBoundaries);
      
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too far north');
      expect(result.message).toContain('too far west');
      expect(result.suggestedCoordinates).toEqual({ lat: 60.0, lng: -139.0 });
    });

    test('should validate coordinates on boundary edges', () => {
      const edgeCoords = [
        { lat: 60.0, lng: -125.0 }, // North edge
        { lat: 48.0, lng: -125.0 }, // South edge
        { lat: 55.0, lng: -114.0 }, // East edge
        { lat: 55.0, lng: -139.0 }  // West edge
      ];

      edgeCoords.forEach(coords => {
        const result = validateCoordinatesWithinBoundaries(coords, testBoundaries);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('getBoundariesCenter', () => {
    test('should calculate correct center point', () => {
      const center = getBoundariesCenter(testBoundaries);
      expect(center).toEqual([54.0, -126.5]);
    });
  });

  describe('calculateZoomForBoundaries', () => {
    test('should calculate appropriate zoom for BC boundaries', () => {
      const zoom = calculateZoomForBoundaries(testBoundaries);
      expect(zoom).toBeGreaterThan(0);
      expect(zoom).toBeLessThan(20);
    });

    test('should return higher zoom for smaller areas', () => {
      const smallBoundaries = {
        north: 50.0,
        south: 49.0,
        east: -120.0,
        west: -121.0
      };
      
      const smallZoom = calculateZoomForBoundaries(smallBoundaries);
      const largeZoom = calculateZoomForBoundaries(testBoundaries);
      
      expect(smallZoom).toBeGreaterThan(largeZoom);
    });
  });

  describe('DEFAULT_BC_BOUNDARIES', () => {
    test('should have valid BC province boundaries', () => {
      expect(DEFAULT_BC_BOUNDARIES.north).toBe(60.0);
      expect(DEFAULT_BC_BOUNDARIES.south).toBe(48.0);
      expect(DEFAULT_BC_BOUNDARIES.east).toBe(-114.0);
      expect(DEFAULT_BC_BOUNDARIES.west).toBe(-139.0);
      
      // Validate boundary relationships
      expect(DEFAULT_BC_BOUNDARIES.north).toBeGreaterThan(DEFAULT_BC_BOUNDARIES.south);
      expect(DEFAULT_BC_BOUNDARIES.east).toBeGreaterThan(DEFAULT_BC_BOUNDARIES.west);
    });
  });

  describe('createLeafletBounds', () => {
    test('should create bounds object with correct structure', () => {
      const bounds = createLeafletBounds(testBoundaries);
      
      // Check that bounds object has expected methods/properties
      expect(bounds).toBeDefined();
      expect(typeof bounds.getSouthWest).toBe('function');
      expect(typeof bounds.getNorthEast).toBe('function');
    });
  });
});