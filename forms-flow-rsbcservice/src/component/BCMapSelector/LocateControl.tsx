import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import { GeolocationService, UserLocation, GeolocationError } from './geolocationUtils';
import { BCBoundaries } from './boundaryUtils';

interface LocateControlProps {
  boundaries: BCBoundaries;
  onLocationFound?: (location: UserLocation) => void;
  onLocationError?: (error: GeolocationError) => void;
  onLocationWithinBoundaries?: (location: UserLocation) => void;
  onLocationOutsideBoundaries?: (location: UserLocation) => void;
}

// Custom Leaflet control for locate functionality
class LeafletLocateControl extends L.Control {
  private button: HTMLButtonElement | null = null;
  private isLocating: boolean = false;
  private boundaries: BCBoundaries;
  private onLocationFound?: (location: UserLocation) => void;
  private onLocationError?: (error: GeolocationError) => void;
  private onLocationWithinBoundaries?: (location: UserLocation) => void;
  private onLocationOutsideBoundaries?: (location: UserLocation) => void;

  constructor(
    options: L.ControlOptions & {
      boundaries: BCBoundaries;
      onLocationFound?: (location: UserLocation) => void;
      onLocationError?: (error: GeolocationError) => void;
      onLocationWithinBoundaries?: (location: UserLocation) => void;
      onLocationOutsideBoundaries?: (location: UserLocation) => void;
    }
  ) {
    super(options);
    this.boundaries = options.boundaries;
    this.onLocationFound = options.onLocationFound;
    this.onLocationError = options.onLocationError;
    this.onLocationWithinBoundaries = options.onLocationWithinBoundaries;
    this.onLocationOutsideBoundaries = options.onLocationOutsideBoundaries;
  }

  onAdd(map: L.Map): HTMLElement {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-locate');
    
    this.button = L.DomUtil.create('button', 'leaflet-control-locate-button', container) as HTMLButtonElement;
    this.button.type = 'button';
    this.button.title = 'Show me where I am';
    this.button.innerHTML = '<i class="fa fa-location-arrow" aria-hidden="true"></i>';
    this.button.setAttribute('aria-label', 'Show my location');

    // Prevent map events when clicking the button
    L.DomEvent.disableClickPropagation(this.button);
    L.DomEvent.disableScrollPropagation(container);

    // Add click event listener
    L.DomEvent.on(this.button, 'click', this.handleLocateClick, this);

    return container;
  }

  onRemove(): void {
    if (this.button) {
      L.DomEvent.off(this.button, 'click', this.handleLocateClick, this);
    }
  }

  private handleLocateClick = async (): Promise<void> => {
    if (this.isLocating || !this.button) {
      return;
    }

    this.setLocatingState(true);

    try {
      const location = await GeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });

      // Validate location against boundaries
      const validationResult = GeolocationService.validateLocationWithinBoundaries(
        location,
        this.boundaries
      );

      // Center map on user location
      const map = (this as any)._map;
      if (map) {
        map.setView([location.lat, location.lng], 16, {
          animate: true,
          duration: 1
        });
      }

      // Call appropriate callbacks
      if (this.onLocationFound) {
        this.onLocationFound(location);
      }

      if (validationResult.isValid) {
        if (this.onLocationWithinBoundaries) {
          this.onLocationWithinBoundaries(location);
        }
      } else {
        if (this.onLocationOutsideBoundaries) {
          this.onLocationOutsideBoundaries(location);
        }
      }

    } catch (error) {
      const geolocationError = error as GeolocationError;
      
      if (this.onLocationError) {
        this.onLocationError(geolocationError);
      }

      console.warn('Geolocation error:', geolocationError.message);
    } finally {
      this.setLocatingState(false);
    }
  };

  private setLocatingState(isLocating: boolean): void {
    this.isLocating = isLocating;
    
    if (this.button) {
      if (isLocating) {
        this.button.innerHTML = '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>';
        this.button.title = 'Locating...';
        this.button.disabled = true;
        this.button.classList.add('locating');
      } else {
        this.button.innerHTML = '<i class="fa fa-location-arrow" aria-hidden="true"></i>';
        this.button.title = 'Show me where I am';
        this.button.disabled = false;
        this.button.classList.remove('locating');
      }
    }
  }

  public updateBoundaries(boundaries: BCBoundaries): void {
    this.boundaries = boundaries;
  }
}

const LocateControl: React.FC<LocateControlProps> = ({
  boundaries,
  onLocationFound,
  onLocationError,
  onLocationWithinBoundaries,
  onLocationOutsideBoundaries
}) => {
  const map = useMap();
  const controlRef = useRef<LeafletLocateControl | null>(null);

  useEffect(() => {
    // Only add control if geolocation is supported
    if (!GeolocationService.isSupported()) {
      return;
    }

    // Create and add the locate control
    const locateControl = new LeafletLocateControl({
      position: 'topright',
      boundaries,
      onLocationFound,
      onLocationError,
      onLocationWithinBoundaries,
      onLocationOutsideBoundaries
    });

    map.addControl(locateControl);
    controlRef.current = locateControl;

    // Cleanup on unmount
    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [map, boundaries, onLocationFound, onLocationError, onLocationWithinBoundaries, onLocationOutsideBoundaries]);

  // Update boundaries when they change
  useEffect(() => {
    if (controlRef.current) {
      controlRef.current.updateBoundaries(boundaries);
    }
  }, [boundaries]);

  return null;
};

export default LocateControl;