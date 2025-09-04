import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import settingsForm from './BCMapSelector.settingsForm';
import MapModal from './MapModal';
import { MapProviderFactory, MapProviderConfig } from './mapProviders';
import { BCBoundaries, DEFAULT_BC_BOUNDARIES, validateCoordinatesWithinBoundaries } from './boundaryUtils';
import './BCMapSelector.scss';
import './mapModal.scss';

interface MapSelectionData {
  lat: string;
  long: string;
  address?: string;
  timestamp: string;
}



export default class BCMapSelector extends ReactComponent {
  data: any;
  component: any;
  builderMode: boolean;
  emit!: (event: string, ...args: any[]) => void;
  private reactRoot: Root | null = null;
  private isModalOpen: boolean = false;

  constructor(component: any, options: any, data: any) {
    super(component, options, data);
    this.data = data || {};
    this.component = component || {};
  }

  static readonly builderInfo = {
    title: 'BC Map Selector',
    group: 'basic',
    icon: 'map-marker',
    documentation: '',
    weight: 70,
    schema: BCMapSelector.schema(),
  };

  static schema(): any {
    return {
      type: 'bcmapselector',
      label: 'BC Map Selector',
      key: 'bcMapSelector',
    };
  }

  static readonly editForm = settingsForm;

  // Get map provider configuration from component settings
  private getMapProviderConfig(): MapProviderConfig {
    return MapProviderFactory.getProviderConfigFromSettings(this.component);
  }

  // Get configured boundaries (custom or default BC province boundaries)
  private getBCBoundaries(): BCBoundaries {
    // Check if custom boundaries are configured
    if (this.component.useCustomBoundaries) {
      return {
        north: this.component.northBoundary || DEFAULT_BC_BOUNDARIES.north,
        south: this.component.southBoundary || DEFAULT_BC_BOUNDARIES.south,
        east: this.component.eastBoundary || DEFAULT_BC_BOUNDARIES.east,
        west: this.component.westBoundary || DEFAULT_BC_BOUNDARIES.west,
      };
    }

    // Parse JSON settings if available
    if (this.component.bcMapSettings) {
      try {
        const settings = JSON.parse(this.component.bcMapSettings);
        if (settings.boundaries) {
          return {
            north: settings.boundaries.north || DEFAULT_BC_BOUNDARIES.north,
            south: settings.boundaries.south || DEFAULT_BC_BOUNDARIES.south,
            east: settings.boundaries.east || DEFAULT_BC_BOUNDARIES.east,
            west: settings.boundaries.west || DEFAULT_BC_BOUNDARIES.west,
          };
        }
      } catch (error) {
        console.warn('Invalid BC Map Settings JSON:', error);
      }
    }

    // Return default BC boundaries
    return DEFAULT_BC_BOUNDARIES;
  }

  // Handle map selection and emit event with boundary validation
  private handleMapSelection = (coordinates: { lat: number; lng: number }) => {
    const boundaries = this.getBCBoundaries();
    
    // Validate coordinates against boundaries (double-check, though MapModal should prevent invalid selections)
    const validationResult = validateCoordinatesWithinBoundaries(coordinates, boundaries);
    
    if (!validationResult.isValid) {
      console.warn('Invalid coordinates selected:', validationResult.message);
      // Emit boundary violation event
      this.emit('boundaryViolation', {
        data: {
          attempted: coordinates,
          message: validationResult.message
        }
      });
      return;
    }

    const mapData: MapSelectionData = {
      lat: coordinates.lat.toString(),
      long: coordinates.lng.toString(),
      timestamp: new Date().toISOString(),
    };

    // Store in component data
    this.data = {
      ...this.data,
      coordinates: {
        lat: mapData.lat,
        long: mapData.long,
      },
      selectionTimestamp: mapData.timestamp,
      boundaryViolation: false, // Clear any previous boundary violation flag
    };

    // Emit mapSelected event as specified in requirements
    this.emit('mapSelected', {
      data: {
        lat: mapData.lat,
        long: mapData.long,
      },
    });

    // Re-render to show updated coordinates
    this.renderComponent();
  };

  // Open map modal
  private openMapModal = () => {
    this.isModalOpen = true;
    this.renderComponent();
  };

  // Close map modal
  private closeMapModal = () => {
    this.isModalOpen = false;
    this.renderComponent();
  };

  // Render the Select from Map button component
  private renderSelectButton(): React.ReactElement {
    const selectedCoordinates = this.data?.coordinates;
    const hasSelection = selectedCoordinates?.lat && selectedCoordinates?.long;
    const boundaries = this.getBCBoundaries();
    const mapProviderConfig = this.getMapProviderConfig();

    return (
      <div className="bc-map-selector-container">
        <button
          type="button"
          className="btn btn-primary select-from-map-button"
          onClick={this.openMapModal}
        >
          <i className="fa fa-map-marker" aria-hidden="true"></i>
          Select from Map
        </button>
        
        {hasSelection && (
          <div className="selected-coordinates">
            <strong>Selected Location:</strong><br />
            Latitude: {selectedCoordinates.lat}<br />
            Longitude: {selectedCoordinates.long}
          </div>
        )}

        <MapModal
          isOpen={this.isModalOpen}
          onClose={this.closeMapModal}
          onLocationSelect={this.handleMapSelection}
          boundaries={boundaries}
          mapProviderConfig={mapProviderConfig}
          componentSettings={this.component}
        />
      </div>
    );
  }

  // Helper method to re-render the component
  private renderComponent(): void {
    if (this.reactRoot) {
      this.reactRoot.render(this.renderSelectButton());
    }
  }

  // Renders the BC Map Selector component within the given HTML element
  attachReact(element: HTMLElement): void {
    try {
      // Clean up any existing root
      if (this.reactRoot) {
        this.reactRoot.unmount();
      }

      // Create new root and render component
      this.reactRoot = createRoot(element);
      this.renderComponent();
    } catch (error) {
      console.error('Error rendering BC Map Selector:', error);
      // Fallback to basic HTML rendering
      element.innerHTML = `
        <div class="bc-map-selector-container">
          <button type="button" class="btn btn-primary select-from-map-button">
            <i class="fa fa-map-marker" aria-hidden="true"></i>
            Select from Map
          </button>
        </div>
      `;
    }
  }

  // Unmounts the React component from the given HTML element
  detachReact(element: HTMLElement): void {
    try {
      // Close modal if open
      this.isModalOpen = false;
      
      if (this.reactRoot) {
        this.reactRoot.unmount();
        this.reactRoot = null;
      }
    } catch (error) {
      console.warn('Error unmounting BC Map Selector:', error);
    }
    
    // Clear element content as fallback
    element.innerHTML = '';
  }
}