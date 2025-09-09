import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapProviderFactory, MapProviderConfig, TileLayerOptions } from './mapProviders';
import {
  validateCoordinatesWithinBoundaries,
  createLeafletBounds,
  getBoundariesCenter,
  calculateZoomForBoundaries,
  BCBoundaries,
  BoundaryValidationResult
} from './boundaryUtils';
import { GeocodingService, createGeocodingConfig, ReverseGeocodingResult } from './geocodingUtils';
import { GeolocationService, UserLocation, GeolocationError } from './geolocationUtils';
import AddressSearch from './AddressSearch';
import LocateControl from './LocateControl';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (coordinates: { lat: number; lng: number }, address?: string) => void;
  boundaries: BCBoundaries;
  initialCenter?: [number, number];
  mapProviderConfig?: MapProviderConfig;
  componentSettings?: any;
  useCustomBoundaries?: boolean;
  geoJsonUrl?: string;
  existingCoordinates?: { lat: number; lng: number } | null;
  existingAddress?: string;
}

// Component to handle map click events with boundary validation
function MapClickHandler({
  onLocationSelect,
  boundaries,
  onBoundaryViolation,
  bcBoundaryData,
  useCustomBoundaries,
  geocodingService
}: {
  onLocationSelect: (coordinates: { lat: number; lng: number }, address?: string) => void;
  boundaries: BCBoundaries;
  onBoundaryViolation: (result: BoundaryValidationResult) => void;
  bcBoundaryData?: any;
  useCustomBoundaries?: boolean;
  geocodingService?: GeocodingService | null;
}) {
  useMapEvents({
    click: async (e) => {
      const coordinates = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };

      // If custom boundaries are disabled, allow any selection
      if (!useCustomBoundaries) {
        // Perform reverse geocoding to get address
        let address: string | undefined;
        if (geocodingService) {
          try {
            const reverseResult = await geocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
            address = reverseResult?.address;
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            // Continue without address
          }
        }
        onLocationSelect(coordinates, address);
        return;
      }

      let validationResult: BoundaryValidationResult;

      // Use GeoJSON validation if available, otherwise fall back to rectangular boundaries
      if (bcBoundaryData) {
        const isValid = isPointInGeoJSON(coordinates, bcBoundaryData);
        validationResult = {
          isValid,
          message: isValid ? undefined : 'Selected location is outside the defined boundaries.'
        };
      } else {
        // Fallback to rectangular boundary validation
        validationResult = validateCoordinatesWithinBoundaries(coordinates, boundaries);
      }

      if (validationResult.isValid) {
        // Perform reverse geocoding to get address
        let address: string | undefined;
        if (geocodingService) {
          try {
            const reverseResult = await geocodingService.reverseGeocode(coordinates.lat, coordinates.lng);
            address = reverseResult?.address;
          } catch (error) {
            console.warn('Reverse geocoding failed:', error);
            // Continue without address
          }
        }
        onLocationSelect(coordinates, address);
      } else {
        onBoundaryViolation(validationResult);
      }
    },
  });
  return null;
}

// Component to handle map instance reference
function MapInstanceManager({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  
  useEffect(() => {
    mapRef.current = map;
    return () => {
      // Don't manually remove the map, React-Leaflet handles this
      mapRef.current = null;
    };
  }, [map, mapRef]);
  
  return null;
}

// Component to zoom to existing coordinates when modal opens
function ZoomToExistingCoordinates({ 
  existingCoordinates, 
  isModalOpen 
}: { 
  existingCoordinates: { lat: number; lng: number } | null;
  isModalOpen: boolean;
}) {
  const map = useMap();
  
  useEffect(() => {
    if (isModalOpen && existingCoordinates && map) {
      // Add a small delay to ensure map is fully rendered
      const timer = setTimeout(() => {
        try {
          // Zoom to existing coordinates with smooth animation
          map.setView([existingCoordinates.lat, existingCoordinates.lng], 16, {
            animate: true,
            duration: 0.8
          });
        } catch (error) {
          console.warn('Error zooming to existing coordinates:', error);
        }
      }, 200); // Slightly longer delay for better reliability

      return () => clearTimeout(timer);
    }
  }, [map, existingCoordinates, isModalOpen]);
  
  return null;
}

// Component to fit map view to boundaries and add boundary layer
function BoundaryManager({
  boundaries,
  onBoundaryDataLoaded,
  useCustomBoundaries,
  geoJsonUrl
}: {
  boundaries: BCBoundaries;
  onBoundaryDataLoaded?: (geoJsonData: any) => void;
  useCustomBoundaries?: boolean;
  geoJsonUrl?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && useCustomBoundaries) {
      let boundaryLayer: L.GeoJSON | L.Rectangle | null = null;
      let isMounted = true; // Track if component is still mounted
      const abortController = new AbortController(); // For cancelling fetch requests

      // Load boundary data
      const loadBoundary = async () => {
        try {
          // Use custom GeoJSON URL if provided
          const url = geoJsonUrl || "";
          const response = await fetch(url, { signal: abortController.signal });
          
          // Check if component is still mounted before proceeding
          if (!isMounted) return;
          
          const boundaryData = await response.json();

          // Check again after async operation
          if (!isMounted) return;

          // Pass the GeoJSON data to parent for validation
          if (onBoundaryDataLoaded) {
            onBoundaryDataLoaded(boundaryData);
          }

          // Create GeoJSON layer for boundary
          const geoJsonLayer = L.geoJSON(boundaryData, {
            style: {
              color: '#007bff',
              weight: 2,
              opacity: 0.8,
              fillColor: '#007bff',
              fillOpacity: 0.1,
              dashArray: '5, 5'
            }
          });

          boundaryLayer = geoJsonLayer;
          
          // Check if map is still valid before adding layer
          if (isMounted && map && map.getContainer()) {
            boundaryLayer.addTo(map);

            // Add tooltip to boundary
            const tooltipText = geoJsonUrl ? 'Custom Boundary - Allowed selection area' : 'British Columbia - Allowed selection area';
            boundaryLayer.bindTooltip(tooltipText, {
              permanent: false,
              direction: 'center'
            });

            // Fit map to the boundary bounds - check if map is still valid
            if (map.getContainer()) {
              map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20] });
            }
          }

        } catch (error) {
          // Don't log error if it's just an aborted fetch
          if (error.name === 'AbortError') {
            return;
          }
          
          console.warn('Could not load boundary GeoJSON, falling back to rectangle:', error);

          // Check if component is still mounted before fallback
          if (!isMounted) return;

          // Fallback to rectangle if GeoJSON fails to load
          const bounds = createLeafletBounds(boundaries);
          
          // Check if map is still valid before operations
          if (isMounted && map && map.getContainer()) {
            map.fitBounds(bounds, { padding: [20, 20] });

            const rectangleLayer = L.rectangle(bounds, {
              color: '#007bff',
              weight: 2,
              opacity: 0.8,
              fillColor: '#007bff',
              fillOpacity: 0.1,
              dashArray: '5, 5'
            });

            boundaryLayer = rectangleLayer;
            boundaryLayer.addTo(map);

            // Add tooltip to boundary rectangle
            boundaryLayer.bindTooltip('Allowed selection area', {
              permanent: false,
              direction: 'center'
            });
          }
        }
      };

      loadBoundary();

      // Cleanup on unmount
      return () => {
        isMounted = false; // Mark as unmounted to prevent async operations
        abortController.abort(); // Cancel any ongoing fetch requests
        if (boundaryLayer && map && map.getContainer()) {
          try {
            map.removeLayer(boundaryLayer);
          } catch (error) {
            // Ignore cleanup errors if map is already destroyed
            console.warn('Error removing boundary layer:', error);
          }
        }
      };
    } else if (map && !useCustomBoundaries) {
      // If custom boundaries are disabled, fit to default view without boundary layer
      const bounds = createLeafletBounds(boundaries);
      // Check if map is still valid before fitting bounds
      if (map.getContainer()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [map, boundaries, onBoundaryDataLoaded, useCustomBoundaries, geoJsonUrl]);

  return null;
}

// Point-in-polygon validation function
function isPointInGeoJSON(point: { lat: number; lng: number }, geoJsonData: any): boolean {
  if (!geoJsonData || !geoJsonData.features) return false;

  for (const feature of geoJsonData.features) {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates[0]; // Get outer ring
      if (isPointInPolygon(point, coordinates)) {
        return true;
      }
    }
  }
  return false;
}

// Ray casting algorithm for point-in-polygon test
function isPointInPolygon(point: { lat: number; lng: number }, polygon: number[][]): boolean {
  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  boundaries,
  initialCenter,
  mapProviderConfig,
  componentSettings,
  useCustomBoundaries,
  geoJsonUrl,
  existingCoordinates,
  existingAddress
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const selectButtonRef = useRef<HTMLButtonElement | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(existingCoordinates || null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(existingAddress || null);
  const [tileLayerOptions, setTileLayerOptions] = useState<TileLayerOptions | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [boundaryViolation, setBoundaryViolation] = useState<BoundaryValidationResult | null>(null);
  const [geocodingService, setGeocodingService] = useState<GeocodingService | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geolocationError, setGeolocationError] = useState<GeolocationError | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState<boolean>(false);
  const [userLocationMarker, setUserLocationMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [bcBoundaryData, setBcBoundaryData] = useState<any>(null);

  // Calculate center point - prioritize existing coordinates, then initial center, then boundaries center
  const center: [number, number] = existingCoordinates 
    ? [existingCoordinates.lat, existingCoordinates.lng]
    : initialCenter || getBoundariesCenter(boundaries);
  
  // Use higher zoom if we have existing coordinates to focus on
  const zoom = existingCoordinates ? 16 : calculateZoomForBoundaries(boundaries);

  // Initialize tile layer options based on provider configuration
  useEffect(() => {
    try {
      const config = mapProviderConfig || { type: 'openstreetmap' };
      const options = MapProviderFactory.createTileLayer(config);
      setTileLayerOptions(options);
      setMapError(null);
    } catch (error) {
      console.error('Error creating tile layer:', error);
      setMapError('Failed to load map provider. Using default OpenStreetMap.');
      // Fallback to OpenStreetMap
      setTileLayerOptions(MapProviderFactory.createTileLayer({ type: 'openstreetmap' }));
    }
  }, [mapProviderConfig]);

  // Initialize geocoding service
  useEffect(() => {
    try {
      const geocodingConfig = createGeocodingConfig(componentSettings || {});
      const service = new GeocodingService(geocodingConfig, boundaries);
      setGeocodingService(service);
    } catch (error) {
      console.error('Error creating geocoding service:', error);
      setGeocodingService(null);
    }
  }, [componentSettings, boundaries]);

  // Reset modal state when opening with existing coordinates
  useEffect(() => {
    if (isOpen) {
      setSelectedCoords(existingCoordinates || null);
      setSelectedAddress(existingAddress || null);
      setBoundaryViolation(null);
      setSearchError(null);
      
      // Automatic geolocation request when modal opens (only if no existing coordinates and no existing address)
      if (!existingCoordinates && !existingAddress && GeolocationService.isSupported()) {
        requestUserLocation();
      }
    } else {
      // Clean up state when modal is closed
      setUserLocation(null);
      setGeolocationError(null);
      setUserLocationMarker(null);
      setIsRequestingLocation(false);
      setBcBoundaryData(null);
    }
  }, [isOpen, existingCoordinates, existingAddress]);

  // Zoom to existing coordinates when modal opens and map is ready
  useEffect(() => {
    if (isOpen && existingCoordinates && mapRef.current && mapRef.current.getContainer()) {
      // Add a small delay to ensure map is fully initialized
      const timer = setTimeout(() => {
        if (mapRef.current && mapRef.current.getContainer()) {
          try {
            // Center and zoom to the existing coordinates with a higher zoom level for better focus
            mapRef.current.setView([existingCoordinates.lat, existingCoordinates.lng], 16, {
              animate: true,
              duration: 0.5
            });
          } catch (error) {
            console.warn('Error zooming to existing coordinates:', error);
          }
        }
      }, 100); // Small delay to ensure map is ready

      return () => clearTimeout(timer);
    }
  }, [isOpen, existingCoordinates]);

  // Request user location
  const requestUserLocation = async () => {
    if (isRequestingLocation) {
      return;
    }

    setIsRequestingLocation(true);
    setGeolocationError(null);

    try {
      const location = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });

      setUserLocation(location);

      // Validate location against boundaries
      const validationResult = GeolocationService.validateLocationWithinBoundaries(
        location,
        boundaries
      );

      if (validationResult.isValid) {
        // Location is within boundaries - show marker and center map
        setUserLocationMarker({ lat: location.lat, lng: location.lng });

        // Center map on user location
        if (mapRef.current && mapRef.current.getContainer()) {
          try {
            mapRef.current.setView([location.lat, location.lng], 12, {
              animate: true,
              duration: 1
            });
          } catch (error) {
            console.warn('Error setting map view:', error);
          }
        }
      } else {
        // Location is outside boundaries - center on boundaries but don't show marker
        setUserLocationMarker(null);
        console.info('User location is outside configured boundaries');
      }

    } catch (error) {
      const geolocationError = error as GeolocationError;
      setGeolocationError(geolocationError);
      console.warn('Geolocation error:', geolocationError.message);
    } finally {
      setIsRequestingLocation(false);
    }
  };

  // Handle location selection from map click
  const handleLocationSelect = (coordinates: { lat: number; lng: number }, address?: string) => {
    setSelectedCoords(coordinates);
    setSelectedAddress(address || null); // Set address from reverse geocoding if available
    setBoundaryViolation(null); // Clear any previous boundary violation
    setSearchError(null); // Clear any search errors

    // Focus the Select button for keyboard accessibility
    setTimeout(() => {
      if (selectButtonRef.current) {
        selectButtonRef.current.focus();
      }
    }, 100);
  };

  // Handle location selection from address search
  const handleAddressLocationSelect = (coordinates: { lat: number; lng: number }, address?: string) => {
    // If custom boundaries are disabled, allow any selection
    if (!useCustomBoundaries) {
      setSelectedCoords(coordinates);
      setSelectedAddress(address || null);
      setBoundaryViolation(null);
      setSearchError(null);

      // Center map on selected location
      if (mapRef.current && mapRef.current.getContainer()) {
        try {
          mapRef.current.setView([coordinates.lat, coordinates.lng], 15);
        } catch (error) {
          console.warn('Error setting map view:', error);
        }
      }

      // Focus the Select button for keyboard accessibility
      setTimeout(() => {
        if (selectButtonRef.current) {
          selectButtonRef.current.focus();
        }
      }, 100);
      return;
    }

    // Validate coordinates against boundaries (same as map click)
    let validationResult: BoundaryValidationResult;

    if (bcBoundaryData) {
      const isValid = isPointInGeoJSON(coordinates, bcBoundaryData);
      validationResult = {
        isValid,
        message: isValid ? undefined : 'Selected address is outside the defined boundaries.'
      };
    } else {
      // Fallback to rectangular boundary validation
      validationResult = validateCoordinatesWithinBoundaries(coordinates, boundaries);
    }

    if (validationResult.isValid) {
      setSelectedCoords(coordinates);
      setSelectedAddress(address || null);
      setBoundaryViolation(null); // Clear any previous boundary violation
      setSearchError(null); // Clear any search errors

      // Center map on selected location
      if (mapRef.current && mapRef.current.getContainer()) {
        try {
          mapRef.current.setView([coordinates.lat, coordinates.lng], 15);
        } catch (error) {
          console.warn('Error setting map view:', error);
        }
      }

      // Focus the Select button for keyboard accessibility
      setTimeout(() => {
        if (selectButtonRef.current) {
          selectButtonRef.current.focus();
        }
      }, 100);
    } else {
      // Show boundary violation for address search
      setBoundaryViolation(validationResult);
      setSelectedCoords(null); // Clear any previous selection
      setSearchError(null); // Clear search errors when showing boundary violations
    }
  };

  // Handle search errors
  const handleSearchError = (error: string) => {
    setSearchError(error);
    setBoundaryViolation(null); // Clear boundary violations when showing search errors
  };

  // Handle boundary violation
  const handleBoundaryViolation = (result: BoundaryValidationResult) => {
    setBoundaryViolation(result);
    setSelectedCoords(null); // Clear any previous selection
  };

  // Handle choosing the selected area
  const handleChooseArea = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords, selectedAddress || undefined);
      onClose();
    }
  };

  // Handle geolocation events from LocateControl
  const handleLocationFound = (location: UserLocation) => {
    setUserLocation(location);
    setGeolocationError(null);
  };

  const handleLocationError = (error: GeolocationError) => {
    setGeolocationError(error);
    setUserLocation(null);
    setUserLocationMarker(null);
  };

  const handleLocationWithinBoundaries = (location: UserLocation) => {
    setUserLocationMarker({ lat: location.lat, lng: location.lng });
  };

  const handleLocationOutsideBoundaries = (location: UserLocation) => {
    setUserLocationMarker(null);
    // Show a temporary message about location being outside boundaries
    setBoundaryViolation({
      isValid: false,
      message: 'Your current location is outside the allowed selection area',
      suggestedCoordinates: null
    });

    // Clear the boundary violation message after 5 seconds
    setTimeout(() => {
      setBoundaryViolation(null);
    }, 5000);
  };

  // Handle modal close - reset to existing coordinates instead of clearing
  const handleClose = () => {
    // Reset to existing coordinates instead of clearing completely
    setSelectedCoords(existingCoordinates || null);
    setSelectedAddress(existingAddress || null);
    setBoundaryViolation(null);
    setSearchError(null);
    setUserLocation(null);
    setGeolocationError(null);
    setUserLocationMarker(null);
    setIsRequestingLocation(false);
    
    // Clear map reference safely to prevent cleanup issues
    if (mapRef.current) {
      mapRef.current = null;
    }
    
    onClose();
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      // Clear the map reference safely
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="map-modal-overlay" onClick={handleClose}>
      <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="map-modal-header">
          <h3>Select Location on Map</h3>
          <button
            type="button"
            className="map-modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="map-modal-body">
          <div className="map-instructions">
            {!useCustomBoundaries ? (
              GeolocationService.isSupported()
                ? "Use the locate button to find your current location, search for an address, or click anywhere on the map to select a location"
                : "Search for an address or click anywhere on the map to select a location"
            ) : (
              GeolocationService.isSupported()
                ? "Use the locate button to find your current location, search for an address, or click anywhere within the highlighted area to select a location"
                : "Search for an address or click anywhere within the highlighted area to select a location"
            )}
          </div>

          {geocodingService && (
            <AddressSearch
              geocodingService={geocodingService}
              onLocationSelect={handleAddressLocationSelect}
              onError={handleSearchError}
              disabled={false}
              initialAddress={existingAddress || ''}
            />
          )}

          {mapError && (
            <div className="map-error-message">
              <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
              {mapError}
            </div>
          )}

          {searchError && (
            <div className="map-error-message">
              <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
              {searchError}
            </div>
          )}

          {geolocationError && (
            <div className="map-error-message">
              <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
              {GeolocationService.getErrorMessage(geolocationError)}
            </div>
          )}

          {boundaryViolation && (
            <div className="boundary-violation-message">
              <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
              <strong>Selection Outside Boundaries:</strong> {boundaryViolation.message}
              {boundaryViolation.suggestedCoordinates && (
                <div className="suggested-coordinates">
                  Suggested location: {boundaryViolation.suggestedCoordinates.lat.toFixed(6)}, {boundaryViolation.suggestedCoordinates.lng.toFixed(6)}
                </div>
              )}
            </div>
          )}

          <div className="map-container">
            {tileLayerOptions ? (
              <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '400px', width: '100%' }}
                dragging={true}
                scrollWheelZoom={true}
                zoomControl={true}
              >
                <TileLayer
                  attribution={tileLayerOptions.attribution}
                  url={tileLayerOptions.url}
                  maxZoom={tileLayerOptions.maxZoom}
                  minZoom={tileLayerOptions.minZoom}
                  subdomains={tileLayerOptions.subdomains}
                />
                <MapInstanceManager mapRef={mapRef} />
                <ZoomToExistingCoordinates 
                  existingCoordinates={existingCoordinates} 
                  isModalOpen={isOpen} 
                />
                <BoundaryManager
                  boundaries={boundaries}
                  onBoundaryDataLoaded={setBcBoundaryData}
                  useCustomBoundaries={useCustomBoundaries}
                  geoJsonUrl={geoJsonUrl}
                />
                <MapClickHandler
                  onLocationSelect={handleLocationSelect}
                  boundaries={boundaries}
                  onBoundaryViolation={handleBoundaryViolation}
                  bcBoundaryData={bcBoundaryData}
                  useCustomBoundaries={useCustomBoundaries}
                  geocodingService={geocodingService}
                />
                <LocateControl
                  boundaries={boundaries}
                  onLocationFound={handleLocationFound}
                  onLocationError={handleLocationError}
                  onLocationWithinBoundaries={handleLocationWithinBoundaries}
                  onLocationOutsideBoundaries={handleLocationOutsideBoundaries}
                />
                {userLocationMarker && (
                  <Marker
                    position={[userLocationMarker.lat, userLocationMarker.lng]}
                    icon={L.divIcon({
                      className: 'user-location-marker',
                      html: '<div class="user-location-dot"><div class="user-location-pulse"></div></div>',
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })}
                  >
                    <Popup>
                      <div>
                        <strong>Your Current Location</strong><br />
                        Lat: {userLocationMarker.lat.toFixed(6)}<br />
                        Lng: {userLocationMarker.lng.toFixed(6)}<br />
                        {userLocation && (
                          <>
                            Accuracy: ±{Math.round(userLocation.accuracy)}m
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
                {selectedCoords && (
                  <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                    <Popup>
                      <div>
                        <strong>Selected Location</strong><br />
                        {selectedAddress && (
                          <>
                            <strong>Address:</strong> {selectedAddress}<br />
                          </>
                        )}
                        Lat: {selectedCoords.lat.toFixed(6)}<br />
                        Lng: {selectedCoords.lng.toFixed(6)}
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            ) : (
              <div className="map-loading">
                <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
                Loading map...
              </div>
            )}
          </div>

          {selectedCoords && (
            <div className="selected-location-info">
              <div className="location-info-content">
                <div className="location-info-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="fa fa-map-marker" aria-hidden="true" style={{ color: '#28a745', fontSize: '16px' }}></i>
                  <strong>Selected Location</strong>
                </div>
                {selectedAddress && (
                  <div className="location-info-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <i className="fa fa-home" aria-hidden="true" style={{ color: '#6c757d', fontSize: '14px', marginTop: '2px' }}></i>
                    <span><strong>Address:</strong> {selectedAddress}</span>
                  </div>
                )}
                <div className="location-info-coordinates" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <div className="coordinate-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-compass" aria-hidden="true" style={{ color: '#007bff', fontSize: '14px' }}></i>
                    <span><strong>Lat:</strong> {selectedCoords.lat.toFixed(6)}</span>
                  </div>
                  <div className="coordinate-item" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa fa-globe" aria-hidden="true" style={{ color: '#007bff', fontSize: '14px' }}></i>
                    <span><strong>Lng:</strong> {selectedCoords.lng.toFixed(6)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="map-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
          {selectedCoords && (
            <button
              ref={selectButtonRef}
              type="button"
              className="btn btn-success choose-area-button"
              onClick={handleChooseArea}
            >
              <i className="fa fa-check" aria-hidden="true"></i>
              Select
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapModal;