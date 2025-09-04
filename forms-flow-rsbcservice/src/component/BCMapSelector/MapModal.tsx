import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapProviderFactory, MapProviderConfig, TileLayerOptions } from './mapProviders';

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
  onLocationSelect: (coordinates: { lat: number; lng: number }) => void;
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  initialCenter?: [number, number];
  mapProviderConfig?: MapProviderConfig;
}

// Component to handle map click events
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (coordinates: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });
  return null;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  boundaries,
  initialCenter,
  mapProviderConfig
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tileLayerOptions, setTileLayerOptions] = useState<TileLayerOptions | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Calculate center point from boundaries if no initial center provided
  const center: [number, number] = initialCenter || [
    (boundaries.north + boundaries.south) / 2,
    (boundaries.east + boundaries.west) / 2
  ];

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

  // Handle location selection
  const handleLocationSelect = (coordinates: { lat: number; lng: number }) => {
    setSelectedCoords(coordinates);
  };

  // Handle choosing the selected area
  const handleChooseArea = () => {
    if (selectedCoords) {
      onLocationSelect(selectedCoords);
      onClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedCoords(null);
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
      if (mapRef.current) {
        mapRef.current.remove();
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
            Click anywhere on the map to select a location
          </div>
          
          {mapError && (
            <div className="map-error-message">
              <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
              {mapError}
            </div>
          )}
          
          <div className="map-container">
            {tileLayerOptions ? (
              <MapContainer
                center={center}
                zoom={6}
                style={{ height: '400px', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution={tileLayerOptions.attribution}
                  url={tileLayerOptions.url}
                  maxZoom={tileLayerOptions.maxZoom}
                  minZoom={tileLayerOptions.minZoom}
                  subdomains={tileLayerOptions.subdomains}
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {selectedCoords && (
                  <Marker position={[selectedCoords.lat, selectedCoords.lng]}>
                    <Popup>
                      <div>
                        <strong>Selected Location</strong><br />
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
              <p>
                <strong>Selected Coordinates:</strong><br />
                Latitude: {selectedCoords.lat.toFixed(6)}<br />
                Longitude: {selectedCoords.lng.toFixed(6)}
              </p>
              <button
                type="button"
                className="btn btn-success choose-area-button"
                onClick={handleChooseArea}
              >
                <i className="fa fa-check" aria-hidden="true"></i>
                Choose Area
              </button>
            </div>
          )}
        </div>
        
        <div className="map-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapModal;