import * as L from 'leaflet';

export interface BCBoundaries {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface BoundaryValidationResult {
  isValid: boolean;
  message?: string;
  suggestedCoordinates?: { lat: number; lng: number };
}

/**
 * Validates if coordinates are within the specified boundaries
 */
export function validateCoordinatesWithinBoundaries(
  coordinates: { lat: number; lng: number },
  boundaries: BCBoundaries
): BoundaryValidationResult {
  const { lat, lng } = coordinates;
  const { north, south, east, west } = boundaries;

  // Check if coordinates are within boundaries
  if (lat >= south && lat <= north && lng >= west && lng <= east) {
    return { isValid: true };
  }

  // Generate appropriate error message based on which boundary was violated
  let message = 'Selected location is outside the allowed boundaries.';
  const violations: string[] = [];

  if (lat > north) violations.push('too far north');
  if (lat < south) violations.push('too far south');
  if (lng > east) violations.push('too far east');
  if (lng < west) violations.push('too far west');

  if (violations.length > 0) {
    message = `Selected location is ${violations.join(' and ')}.`;
  }

  // Suggest nearest valid coordinates by clamping to boundaries
  const suggestedCoordinates = {
    lat: Math.max(south, Math.min(north, lat)),
    lng: Math.max(west, Math.min(east, lng))
  };

  return {
    isValid: false,
    message,
    suggestedCoordinates
  };
}

/**
 * Creates a Leaflet bounds object from BC boundaries
 */
export function createLeafletBounds(boundaries: BCBoundaries): L.LatLngBounds {
  return L.latLngBounds(
    [boundaries.south, boundaries.west], // Southwest corner
    [boundaries.north, boundaries.east]  // Northeast corner
  );
}

/**
 * Creates a boundary rectangle overlay for the map
 */
export function createBoundaryRectangle(boundaries: BCBoundaries): L.Rectangle {
  const bounds = createLeafletBounds(boundaries);
  
  return L.rectangle(bounds, {
    color: '#007bff',
    weight: 2,
    opacity: 0.8,
    fillColor: '#007bff',
    fillOpacity: 0.1,
    dashArray: '5, 5'
  });
}

/**
 * Creates an inverse boundary overlay to show restricted areas
 */
export function createRestrictedAreaOverlay(boundaries: BCBoundaries): L.Polygon {
  // Create a large polygon that covers the world, with a hole for the allowed area
  const worldBounds: L.LatLngExpression[] = [
    [-90, -180], // Southwest corner of world
    [-90, 180],  // Southeast corner of world
    [90, 180],   // Northeast corner of world
    [90, -180]   // Northwest corner of world
  ];

  const allowedArea: L.LatLngExpression[] = [
    [boundaries.south, boundaries.west],
    [boundaries.south, boundaries.east],
    [boundaries.north, boundaries.east],
    [boundaries.north, boundaries.west]
  ];

  return L.polygon([worldBounds, allowedArea], {
    color: '#dc3545',
    weight: 0,
    fillColor: '#dc3545',
    fillOpacity: 0.2,
    interactive: false
  });
}

/**
 * Default BC province boundaries
 */
export const DEFAULT_BC_BOUNDARIES: BCBoundaries = {
  north: 60.0,
  south: 48.0,
  east: -114.0,
  west: -139.0
};

/**
 * Calculates the center point of boundaries
 */
export function getBoundariesCenter(boundaries: BCBoundaries): [number, number] {
  return [
    (boundaries.north + boundaries.south) / 2,
    (boundaries.east + boundaries.west) / 2
  ];
}

/**
 * Calculates appropriate zoom level for boundaries
 */
export function calculateZoomForBoundaries(boundaries: BCBoundaries): number {
  const latDiff = boundaries.north - boundaries.south;
  const lngDiff = boundaries.east - boundaries.west;
  const maxDiff = Math.max(latDiff, Math.abs(lngDiff));
  
  // Rough zoom calculation based on coordinate span
  if (maxDiff > 20) return 4;
  if (maxDiff > 10) return 5;
  if (maxDiff > 5) return 6;
  if (maxDiff > 2) return 7;
  if (maxDiff > 1) return 8;
  return 9;
}