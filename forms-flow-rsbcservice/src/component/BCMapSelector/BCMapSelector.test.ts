// Mock the MapModal to avoid react-leaflet import issues in tests
jest.mock('./MapModal', () => {
  return function MockMapModal() {
    return null;
  };
});

// Mock the SCSS imports
jest.mock('./BCMapSelector.scss', () => ({}));
jest.mock('./mapModal.scss', () => ({}));

import BCMapSelector from './BCMapSelector';

describe('BCMapSelector Data Persistence', () => {
  let component: BCMapSelector;
  let mockComponent: any;
  let mockOptions: any;

  beforeEach(() => {
    mockComponent = {
      key: 'testMapSelector',
      label: 'Test Map Selector',
      // Add default form.io component properties
      input: true,
      tableView: false,
      persistent: true,
      validate: {
        required: false,
        custom: '',
        customPrivate: false,
        strictDateValidation: false,
        multiple: false,
        unique: false
      },
      conditional: {
        show: null,
        when: null,
        eq: ''
      },
      type: 'bcmapselector',
      labelPosition: 'top',
      tags: [],
      properties: {},
      addons: [],
      allowCalculateOverride: false,
      allowMultipleMasks: false,
      attributes: {},
      autofocus: false,
      calculateServer: false,
      calculateValue: '',
      clearOnHide: true,
      customClass: '',
      customDefaultValue: '',
      dataGridLabel: false,
      dbIndex: false,
      defaultValue: null,
      description: '',
      disabled: false,
      encrypted: false,
      errorLabel: '',
      hidden: false,
      hideLabel: false,
      id: 'e65t75',
      modalEdit: false,
      multiple: false,
      overlay: {
        style: '',
        left: '',
        top: '',
        width: '',
        height: ''
      },
      placeholder: '',
      prefix: '',
      protected: false,
      redrawOn: '',
      refreshOn: '',
      showCharCount: false,
      showWordCount: false,
      suffix: '',
      tabindex: '',
      tooltip: '',
      unique: false,
      validateOn: 'change',
      widget: null
    };
    mockOptions = {};
  });

  describe('Data Initialization', () => {
    it('should initialize with null coordinates when no data provided', () => {
      component = new BCMapSelector(mockComponent, mockOptions, null);
      
      expect(component.data.coordinates).toBeNull();
      expect(component.data.address).toBeUndefined();
      expect(component.data.boundaryViolation).toBe(false);
      expect(component.hasValidSelection()).toBe(false);
    });

    it('should initialize with null coordinates when empty data provided', () => {
      component = new BCMapSelector(mockComponent, mockOptions, {});
      
      expect(component.data.coordinates).toBeNull();
      expect(component.hasValidSelection()).toBe(false);
    });

    it('should initialize with valid coordinates when proper data provided', () => {
      const inputData = {
        coordinates: {
          lat: '48.4284',
          long: '-123.3656'
        },
        address: 'Victoria, BC',
        selectionTimestamp: '2023-01-01T00:00:00.000Z'
      };

      component = new BCMapSelector(mockComponent, mockOptions, inputData);
      
      expect(component.data.coordinates).toEqual({
        lat: '48.4284',
        long: '-123.3656'
      });
      expect(component.data.address).toBe('Victoria, BC');
      expect(component.hasValidSelection()).toBe(true);
    });

    it('should handle legacy coordinate format', () => {
      const legacyData = {
        lat: '48.4284',
        long: '-123.3656',
        address: 'Victoria, BC'
      };

      component = new BCMapSelector(mockComponent, mockOptions, legacyData);
      
      expect(component.data.coordinates).toEqual({
        lat: '48.4284',
        long: '-123.3656'
      });
      expect(component.data.address).toBe('Victoria, BC');
      expect(component.hasValidSelection()).toBe(true);
    });
  });

  describe('Data Validation and Sanitization', () => {
    it('should sanitize string coordinates', () => {
      const inputData = {
        coordinates: {
          lat: '48.4284000',
          long: '-123.3656000'
        }
      };

      component = new BCMapSelector(mockComponent, mockOptions, inputData);
      
      expect(component.data.coordinates?.lat).toBe('48.4284');
      expect(component.data.coordinates?.long).toBe('-123.3656');
    });

    it('should sanitize numeric coordinates', () => {
      const inputData = {
        coordinates: {
          lat: 48.4284,
          long: -123.3656
        }
      };

      component = new BCMapSelector(mockComponent, mockOptions, inputData);
      
      expect(component.data.coordinates?.lat).toBe('48.4284');
      expect(component.data.coordinates?.long).toBe('-123.3656');
    });

    it('should throw error for invalid coordinates', () => {
      const inputData = {
        coordinates: {
          lat: 'invalid',
          long: '-123.3656'
        }
      };

      expect(() => {
        new BCMapSelector(mockComponent, mockOptions, inputData);
      }).toThrow('Invalid coordinate value: invalid');
    });
  });

  describe('Value Management', () => {
    beforeEach(() => {
      component = new BCMapSelector(mockComponent, mockOptions, null);
    });

    it('should return current data with getValue', () => {
      const expectedData = {
        coordinates: null,
        address: undefined,
        selectionTimestamp: undefined,
        boundaryViolation: false
      };

      expect(component.getValue()).toEqual(expectedData);
    });

    it('should update data with setValue', () => {
      const newData = {
        coordinates: {
          lat: '49.2827',
          long: '-123.1207'
        },
        address: 'Vancouver, BC',
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };

      component.setValue(newData);
      
      expect(component.data).toEqual(newData);
      expect(component.hasValidSelection()).toBe(true);
    });

    it('should handle null setValue', () => {
      component.setValue(null);
      
      expect(component.data.coordinates).toBeNull();
      expect(component.hasValidSelection()).toBe(false);
    });
  });

  describe('Coordinate Display Formatting', () => {
    beforeEach(() => {
      component = new BCMapSelector(mockComponent, mockOptions, null);
    });

    it('should format coordinates for display correctly', () => {
      const coordinates = { lat: '48.428421', long: '-123.365644' };
      
      // Access private method for testing
      const formatted = (component as any).formatCoordinatesForDisplay(coordinates);
      
      expect(formatted).toBe('48.428421°N, 123.365644°W');
    });

    it('should handle negative latitude correctly', () => {
      const coordinates = { lat: '-48.428421', long: '-123.365644' };
      
      const formatted = (component as any).formatCoordinatesForDisplay(coordinates);
      
      expect(formatted).toBe('48.428421°S, 123.365644°W');
    });

    it('should handle positive longitude correctly', () => {
      const coordinates = { lat: '48.428421', long: '123.365644' };
      
      const formatted = (component as any).formatCoordinatesForDisplay(coordinates);
      
      expect(formatted).toBe('48.428421°N, 123.365644°E');
    });
  });

  describe('Map Selection Handling', () => {
    beforeEach(() => {
      component = new BCMapSelector(mockComponent, mockOptions, null);
      // Mock the emit function
      (component as any).emit = jest.fn();
      // Mock updateComponentValue to avoid rendering issues in tests
      component.updateComponentValue = jest.fn();
      // Mock renderComponent to avoid DOM issues in tests
      (component as any).renderComponent = jest.fn();
    });

    it('should handle valid map selection', () => {
      const coordinates = { lat: 48.4284, lng: -123.3656 };
      const address = 'Victoria, BC';

      (component as any).handleMapSelection(coordinates, address);

      expect(component.data.coordinates).toEqual({
        lat: '48.4284',
        long: '-123.3656'
      });
      expect(component.data.address).toBe(address);
      expect(component.data.boundaryViolation).toBe(false);
      expect((component as any).emit).toHaveBeenCalledWith('mapSelected', {
        data: {
          lat: '48.4284',
          long: '-123.3656'
        }
      });
    });

    it('should handle map selection without address', () => {
      const coordinates = { lat: 48.4284, lng: -123.3656 };

      (component as any).handleMapSelection(coordinates);

      expect(component.data.coordinates).toEqual({
        lat: '48.4284',
        long: '-123.3656'
      });
      expect(component.data.address).toBeUndefined();
    });

    it('should clear selection properly', () => {
      // First set some data
      component.data = {
        coordinates: { lat: '48.4284', long: '-123.3656' },
        address: 'Victoria, BC',
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };

      (component as any).clearSelection();

      expect(component.data.coordinates).toBeNull();
      expect(component.data.address).toBeUndefined();
      expect(component.data.selectionTimestamp).toBeUndefined();
      expect(component.data.boundaryViolation).toBe(false);
    });
  });

  describe('Form.io Integration Methods', () => {
    beforeEach(() => {
      component = new BCMapSelector(mockComponent, mockOptions, null);
    });

    it('should return empty string for getValueAsString when no selection', () => {
      expect(component.getValueAsString()).toBe('');
    });

    it('should return formatted coordinates for getValueAsString with selection', () => {
      component.data = {
        coordinates: { lat: '48.428421', long: '-123.365644' },
        address: undefined,
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };

      expect(component.getValueAsString()).toBe('48.428421°N, 123.365644°W');
    });

    it('should include address in getValueAsString when available', () => {
      component.data = {
        coordinates: { lat: '48.428421', long: '-123.365644' },
        address: 'Victoria, BC',
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };

      expect(component.getValueAsString()).toBe('48.428421°N, 123.365644°W (Victoria, BC)');
    });

    it('should return true for isEmpty when no selection', () => {
      expect(component.isEmpty()).toBe(true);
    });

    it('should return false for isEmpty when has selection', () => {
      component.data = {
        coordinates: { lat: '48.428421', long: '-123.365644' },
        address: undefined,
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };

      expect(component.isEmpty()).toBe(false);
    });

    it('should have updateComponentValue method for form integration', () => {
      // Verify that the component has the updateComponentValue method for form.io integration
      expect(typeof component.updateComponentValue).toBe('function');
      
      // Verify that updateComponentValue can be called without errors
      const newData = {
        coordinates: { lat: '48.428421', long: '-123.365644' },
        address: 'Victoria, BC',
        selectionTimestamp: '2023-01-01T00:00:00.000Z',
        boundaryViolation: false
      };
      
      expect(() => component.updateComponentValue(newData)).not.toThrow();
    });

    it('should have emit function available for form integration', () => {
      // Verify that the component has the emit functionality for form.io integration
      expect(typeof (component as any).emit).toBe('function');
    });
  });
});