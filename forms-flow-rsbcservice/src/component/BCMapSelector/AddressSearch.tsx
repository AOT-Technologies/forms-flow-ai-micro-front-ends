import React, { useState, useRef, useEffect } from 'react';
import { GeocodingService, GeocodingResult, GeocodingError } from './geocodingUtils';

interface AddressSearchProps {
  geocodingService: GeocodingService;
  onLocationSelect: (coordinates: { lat: number; lng: number }, address?: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  initialAddress?: string;
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  geocodingService,
  onLocationSelect,
  onError,
  disabled = false,
  initialAddress = ''
}) => {
  const [query, setQuery] = useState(initialAddress);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Update query when initialAddress changes
  useEffect(() => {
    setQuery(initialAddress);
  }, [initialAddress]);

  // Handle search input change with debouncing
  useEffect(() => {
    if (!query.trim() || disabled || !geocodingService.isEnabled()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, disabled]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          break;
      }
    };

    if (showResults) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults, results, selectedIndex]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await geocodingService.searchAddress(searchQuery);
      setResults(searchResults);
      setShowResults(searchResults.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Address search failed:', error);
      if (error instanceof GeocodingError) {
        onError(error.message);
      } else {
        onError('Address search failed. Please try again.');
      }
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: GeocodingResult) => {
    onLocationSelect(
      { lat: result.lat, lng: result.lng },
      result.address || result.display_name
    );
    // Clear the search input after selection
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
    } else {
      // Show results if we have them, or they will be shown when search completes
      if (results.length > 0) {
        setShowResults(true);
      }
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setShowResults(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  if (!geocodingService.isEnabled() || disabled) {
    return (
      <div className="address-search-disabled">
        <div className="search-disabled-message">
          <i className="fa fa-info-circle" aria-hidden="true"></i>
          Address search is disabled
        </div>
      </div>
    );
  }

  return (
    <div className="address-search-container">
      <div className="search-input-wrapper">
        <input
          ref={searchInputRef}
          type="text"
          className="address-search-input"
          placeholder={`Search addresses...`}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          aria-label="Search for addresses"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          role="combobox"
        />
        <div className={`search-icon-container ${!query ? 'non-interactive' : ''}`}>
          {isSearching ? (
            <i className="fa fa-spinner fa-spin" aria-hidden="true"></i>
          ) : query ? (
            <button
              type="button"
              className="btn-clear-search"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <i className="fa fa-times" aria-hidden="true"></i>
            </button>
          ) : (
            <i className="fa fa-search" aria-hidden="true"></i>
          )}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <div
          ref={resultsRef}
          className="search-results-dropdown"
          role="listbox"
          aria-label="Address search results"
        >
          {results.map((result, index) => (
            <div
              key={result.place_id || index}
              className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleResultSelect(result)}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={-1}
            >
              <div className="result-content">
                <div className="result-name">
                  <i className="fa fa-map-marker" aria-hidden="true"></i>
                  {result.display_name}
                </div>
                <div className="result-coordinates">
                  {result.lat.toFixed(6)}, {result.lng.toFixed(6)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && query.trim() && !isSearching && (
        <div className="search-no-results">
          <i className="fa fa-exclamation-circle" aria-hidden="true"></i>
          No addresses found within the allowed area
        </div>
      )}
    </div>
  );
};

export default AddressSearch;