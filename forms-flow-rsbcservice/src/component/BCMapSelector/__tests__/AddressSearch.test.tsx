import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddressSearch from '../AddressSearch';
import { GeocodingService } from '../geocodingUtils';
import { DEFAULT_BC_BOUNDARIES } from '../boundaryUtils';

// Mock the geocoding service
const mockGeocodingService = {
  isEnabled: jest.fn(() => true),
  getProviderName: jest.fn(() => 'Test Provider'),
  searchAddress: jest.fn()
} as unknown as GeocodingService;

const mockOnLocationSelect = jest.fn();
const mockOnError = jest.fn();

describe('AddressSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input when geocoding is enabled', () => {
    render(
      <AddressSearch
        geocodingService={mockGeocodingService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    expect(screen.getByPlaceholderText(/Search addresses using Test Provider/)).toBeInTheDocument();
  });

  it('shows disabled message when geocoding is disabled', () => {
    const disabledService = {
      ...mockGeocodingService,
      isEnabled: jest.fn(() => false)
    } as unknown as GeocodingService;

    render(
      <AddressSearch
        geocodingService={disabledService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Address search is disabled')).toBeInTheDocument();
  });

  it('performs search when user types', async () => {
    const mockResults = [
      {
        lat: 49.2827,
        lng: -123.1207,
        display_name: 'Vancouver, BC, Canada',
        address: 'Vancouver, BC, Canada',
        place_id: '1'
      }
    ];

    (mockGeocodingService.searchAddress as jest.Mock).mockResolvedValue(mockResults);

    render(
      <AddressSearch
        geocodingService={mockGeocodingService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const input = screen.getByPlaceholderText(/Search addresses using Test Provider/);
    fireEvent.change(input, { target: { value: 'Vancouver' } });

    await waitFor(() => {
      expect(mockGeocodingService.searchAddress).toHaveBeenCalledWith('Vancouver');
    });

    await waitFor(() => {
      expect(screen.getByText('Vancouver, BC, Canada')).toBeInTheDocument();
    });
  });

  it('calls onLocationSelect when result is clicked', async () => {
    const mockResults = [
      {
        lat: 49.2827,
        lng: -123.1207,
        display_name: 'Vancouver, BC, Canada',
        address: 'Vancouver, BC, Canada',
        place_id: '1'
      }
    ];

    (mockGeocodingService.searchAddress as jest.Mock).mockResolvedValue(mockResults);

    render(
      <AddressSearch
        geocodingService={mockGeocodingService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const input = screen.getByPlaceholderText(/Search addresses using Test Provider/);
    fireEvent.change(input, { target: { value: 'Vancouver' } });

    await waitFor(() => {
      expect(screen.getByText('Vancouver, BC, Canada')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Vancouver, BC, Canada'));

    expect(mockOnLocationSelect).toHaveBeenCalledWith(
      { lat: 49.2827, lng: -123.1207 },
      'Vancouver, BC, Canada'
    );
  });

  it('handles search errors', async () => {
    const errorMessage = 'Search failed';
    (mockGeocodingService.searchAddress as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <AddressSearch
        geocodingService={mockGeocodingService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const input = screen.getByPlaceholderText(/Search addresses using Test Provider/);
    fireEvent.change(input, { target: { value: 'Invalid Address' } });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Address search failed. Please try again.');
    });
  });

  it('clears search when clear button is clicked', async () => {
    render(
      <AddressSearch
        geocodingService={mockGeocodingService}
        onLocationSelect={mockOnLocationSelect}
        onError={mockOnError}
      />
    );

    const input = screen.getByPlaceholderText(/Search addresses using Test Provider/);
    fireEvent.change(input, { target: { value: 'Vancouver' } });

    expect(input).toHaveValue('Vancouver');

    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
  });
});