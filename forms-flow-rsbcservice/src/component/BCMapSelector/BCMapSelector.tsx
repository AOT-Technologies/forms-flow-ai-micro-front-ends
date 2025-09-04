import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ReactComponent } from '@aot-technologies/formio-react';
import settingsForm from './BCMapSelector.settingsForm';
import MapModal from './MapModal';
import { MapProviderFactory, MapProviderConfig } from './mapProviders';
import './BCMapSelector.scss';
import './mapModal.scss';

interface MapSelectionData {
  lat: string;
  long: string;
  address?: string;
  timestamp: string;
}

interface BCBoundaries {
  north: number;
  south: number;
  east: number;
  west: number;
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

  // Default BC province boundaries
  private getBCBoundaries(): BCBoundaries {
    // Check if custom boundaries are configured
    if (this.component.useCustomBoundaries) {
      return {
        north: this.component.northBoundary || 60.0,
        south: this.component.southBoundary || 48.0,
        east: this.component.eastBoundary || -114.0,
        west: this.component.westBoundary || -139.0,
      };
    }

    // Parse JSON settings if available
    if (this.component.bcMapSettings) {
      try {
        const settings = JSON.parse(this.component.bcMapSettings);
        if (settings.boundaries) {
          return {
            north: settings.boundaries.north || 60.0,
            south: settings.boundaries.south || 48.0,
            east: settings.boundaries.east || -114.0,
            west: settings.boundaries.west || -139.0,
          };
        }
      } catch (error) {
        console.warn('Invalid BC Map Settings JSON:', error);
      }
    }

    // Default BC boundaries
    return {
      north: 60.0,
      south: 48.0,
      east: -114.0,
      west: -139.0,
    };
  }

  // Handle map selection and emit event
  private handleMapSelection = (coordinates: { lat: number; lng: number }) => {
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