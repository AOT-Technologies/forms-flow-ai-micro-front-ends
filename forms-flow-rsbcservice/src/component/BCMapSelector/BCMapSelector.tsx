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

interface BCMapSelectorData {
  coordinates: {
    lat: string;
    long: string;
  } | null;
  address?: string;
  selectionTimestamp?: string;
  boundaryViolation?: boolean;
}



export default class BCMapSelector extends ReactComponent {
  data: BCMapSelectorData;
  component: any;
  builderMode: boolean;
  emit!: (event: string, ...args: any[]) => void;
  private reactRoot: Root | null = null;
  private isModalOpen: boolean = false;

  constructor(component: any, options: any, data: any) {
    super(component, options, data);
    this.data = this.initializeData(data);
    this.component = component || {};
  }

  // Initialize and validate component data
  private initializeData(inputData: any): BCMapSelectorData {
    // Handle null or undefined input data
    if (!inputData) {
      return {
        coordinates: null,
        address: undefined,
        selectionTimestamp: undefined,
        boundaryViolation: false,
      };
    }

    // If inputData is already in the correct format, validate and return
    if (this.isValidCoordinateData(inputData)) {
      return {
        coordinates: inputData.coordinates ? {
          lat: this.sanitizeCoordinate(inputData.coordinates.lat),
          long: this.sanitizeCoordinate(inputData.coordinates.long),
        } : null,
        address: inputData.address,
        selectionTimestamp: inputData.selectionTimestamp,
        boundaryViolation: inputData.boundaryViolation || false,
      };
    }

    // Handle legacy or direct coordinate format (e.g., {lat: "48.123", long: "-123.456"})
    if (inputData.lat && inputData.long) {
      return {
        coordinates: {
          lat: this.sanitizeCoordinate(inputData.lat),
          long: this.sanitizeCoordinate(inputData.long),
        },
        address: inputData.address,
        selectionTimestamp: inputData.selectionTimestamp || new Date().toISOString(),
        boundaryViolation: false,
      };
    }

    // Return empty state for any other format
    return {
      coordinates: null,
      address: undefined,
      selectionTimestamp: undefined,
      boundaryViolation: false,
    };
  }

  // Validate if data has the expected coordinate structure
  private isValidCoordinateData(data: any): boolean {
    return data && (
      (data.coordinates && typeof data.coordinates === 'object') ||
      data.coordinates === null
    );
  }

  // Sanitize and validate coordinate values
  private sanitizeCoordinate(value: any): string {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && isFinite(parsed)) {
        return parsed.toString();
      }
    }
    if (typeof value === 'number' && isFinite(value)) {
      return value.toString();
    }
    throw new Error(`Invalid coordinate value: ${value}`);
  }

  // Get the current data in the format expected by form.io
  getValue(): BCMapSelectorData {
    return this.data;
  }

  // Set data from form.io (called when form loads existing data)
  setValue(value: any): void {
    this.data = this.initializeData(value);
    this.renderComponent();
  }

  // Check if the component has a valid selection
  hasValidSelection(): boolean {
    return !!(this.data?.coordinates?.lat && this.data?.coordinates?.long);
  }

  // Update form.io value and trigger change events (for form integration)
  updateComponentValue(value: BCMapSelectorData): void {
    this.data = value;

    // Trigger form.io change event for proper form integration (Requirement 6.2)
    (this as any).emit('componentChange', {
      component: this.component,
      value: value,
      flags: {},
      isValid: this.hasValidSelection() || value.coordinates === null
    });
  }

  // Get value as string for form.io compatibility (commonly used for display/export)
  getValueAsString(): string {
    if (!this.hasValidSelection()) {
      return '';
    }

    const coords = this.data.coordinates!;
    let result = this.formatCoordinatesForDisplay(coords);

    if (this.data.address) {
      result += ` (${this.data.address})`;
    }

    return result;
  }

  // Check if component is empty (for form.io validation)
  isEmpty(): boolean {
    return !this.hasValidSelection();
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
  private handleMapSelection = (coordinates: { lat: number; lng: number }, address?: string) => {
    // Skip boundary validation if custom boundaries are disabled
    if (this.component.useCustomBoundaries) {
      const boundaries = this.getBCBoundaries();

      // Validate coordinates against boundaries (double-check, though MapModal should prevent invalid selections)
      const validationResult = validateCoordinatesWithinBoundaries(coordinates, boundaries);

      if (!validationResult.isValid) {
        console.warn('Invalid coordinates selected:', validationResult.message);
        // Emit boundary violation event
        (this as any).emit('boundaryViolation', {
          data: {
            attempted: coordinates,
            message: validationResult.message
          }
        });
        return;
      }
    }

    try {
      const mapData: MapSelectionData = {
        lat: this.sanitizeCoordinate(coordinates.lat),
        long: this.sanitizeCoordinate(coordinates.lng),
        address: address,
        timestamp: new Date().toISOString(),
      };

      // Update component data with proper validation
      this.data = {
        coordinates: {
          lat: mapData.lat,
          long: mapData.long,
        },
        address: mapData.address,
        selectionTimestamp: mapData.timestamp,
        boundaryViolation: false, // Clear any previous boundary violation flag
      };

      // Emit mapSelected event as specified in requirements (6.1, 6.2)
      (this as any).emit('mapSelected', {
        data: {
          lat: mapData.lat,
          long: mapData.long,
        },
      });

      // Trigger form.io change event for form integration
      this.updateComponentValue(this.data);

      // Re-render to show updated coordinates (6.4)
      this.renderComponent();
    } catch (error) {
      console.error('Error processing map selection:', error);
      // Handle invalid coordinate data gracefully
      (this as any).emit('coordinateError', {
        data: {
          error: 'Invalid coordinate data',
          attempted: coordinates,
        }
      });
    }
  };

  // Clear the selected coordinates
  private clearSelection = () => {
    this.data = {
      coordinates: null,
      address: undefined,
      selectionTimestamp: undefined,
      boundaryViolation: false,
    };

    // Trigger form.io change event
    this.updateComponentValue(this.data);

    // Re-render to show cleared state
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

  // Format coordinates for display in readable format (Requirement 6.4)
  private formatCoordinatesForDisplay(coordinates: { lat: string; long: string }): string {
    const lat = parseFloat(coordinates.lat);
    const lng = parseFloat(coordinates.long);

    const latDirection = lat >= 0 ? 'N' : 'S';
    const lngDirection = lng >= 0 ? 'E' : 'W';

    return `${Math.abs(lat).toFixed(6)}°${latDirection}, ${Math.abs(lng).toFixed(6)}°${lngDirection}`;
  }

  // Get initial map center based on existing data or boundaries
  private getInitialMapCenter(): [number, number] | undefined {
    if (this.hasValidSelection()) {
      const coords = this.data.coordinates!;
      return [parseFloat(coords.lat), parseFloat(coords.long)];
    }
    return undefined; // Let MapModal use default center
  }

  // Render the Select from Map button component
  private renderSelectButton(): React.ReactElement {
    const selectedCoordinates = this.data?.coordinates;
    const hasSelection = this.hasValidSelection();
    const boundaries = this.getBCBoundaries();
    const mapProviderConfig = this.getMapProviderConfig();

    return (
      <div className="bc-map-selector-container">
        <div className="bc-map-selector-controls">
          <button
            type="button"
            className="btn btn-primary select-from-map-button"
            onClick={this.openMapModal}
          >
            <i className="fa fa-map-marker" aria-hidden="true"></i>
            {hasSelection ? (this.component.buttonLabelSelected || 'Change Location') : (this.component.buttonLabelEmpty || 'Select from Map')}
          </button>

          {hasSelection && (
            <button
              type="button"
              className="btn btn-secondary clear-selection-button"
              onClick={this.clearSelection}
              title="Clear selected location"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
              Clear
            </button>
          )}
        </div>

        {/* Display coordinates in readable format (Requirement 6.4) */}
        {hasSelection && selectedCoordinates && this.component.showSelectedCoordinates !== false && (
          <div className="selected-coordinates">
            <div className="coordinates-header">
              <strong>Selected Location:</strong>
            </div>
            <div className="coordinates-display">
              <div className="coordinates-formatted">
                {this.formatCoordinatesForDisplay(selectedCoordinates)}
              </div>
              <div className="coordinates-raw">
                <small>
                  Lat: {selectedCoordinates.lat}, Long: {selectedCoordinates.long}
                </small>
              </div>
              {this.data.address && (
                <div className="coordinates-address">
                  <small>
                    <i className="fa fa-map-pin" aria-hidden="true"></i>
                    {this.data.address}
                  </small>
                </div>
              )}
              {this.data.selectionTimestamp && (
                <div className="coordinates-timestamp">
                  <small>
                    Selected: {new Date(this.data.selectionTimestamp).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Display empty state message (Requirement 6.3) */}
        {!hasSelection && (
          <div className="no-selection-message">
            <small className="text-muted">
              <i className="fa fa-info-circle" aria-hidden="true"></i>
              No location selected. Click "Select from Map" to choose a location.
            </small>
          </div>
        )}

        <MapModal
          isOpen={this.isModalOpen}
          onClose={this.closeMapModal}
          onLocationSelect={this.handleMapSelection}
          boundaries={boundaries}
          mapProviderConfig={mapProviderConfig}
          componentSettings={this.component}
          initialCenter={this.getInitialMapCenter()}
          useCustomBoundaries={this.component.useCustomBoundaries}
          geoJsonUrl={this.component.geoJsonUrl}
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