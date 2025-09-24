import React, { FC, useState, useRef, useEffect } from "react";
import { DownArrowIcon, UpArrowIcon } from "../../formsflow-components";
import { ListGroup } from "react-bootstrap";

/**
 * Interface for dropdown option items
 */
export interface OptionType {
  label: string; // Display text for the option
  value: string | number; // Value associated with the option
}

/**
 * Props interface for SelectDropdown component
 */
interface SelectDropdownProps {
  options: OptionType[]; // Array of options to display in the dropdown
  value?: string | number; // Currently selected value
  onChange?: (value: string | number) => void; // Callback function when selection changes
  disabled?: boolean; // Whether the dropdown is disabled
  defaultValue?: string | number; // Default value to show when nothing is selected
  id?: string; // HTML id attribute for the dropdown
  searchDropdown?: boolean; // Whether to render as searchable input field
  dataTestId?: string; // HTML data-testid attribute for the dropdown
  ariaLabel?: string; // HTML aria-label attribute for the dropdown
}



export const SelectDropdown: FC<SelectDropdownProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  defaultValue,
  id = "bootstrap-select-dropdown",
  searchDropdown = false,
  dataTestId = "",
  ariaLabel = "",
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false); // Controls dropdown visibility
  const [selectedValue, setSelectedValue] = useState(value || defaultValue); // Currently selected value
  const [searchTerm, setSearchTerm] = useState(""); // Search input value for filtering
  
  // Refs for DOM manipulation
  const dropdownRef = useRef<HTMLDivElement>(null); // Reference to dropdown container
  const searchInputRef = useRef<HTMLInputElement>(null); // Reference to search input field

  /**
   * Effect: Update internal state when external value prop changes
   * This ensures the component stays in sync with parent component state
   */
  useEffect(() => {
    setSelectedValue(value || defaultValue);
  }, [value, defaultValue]);

  /**
   * Effect: Handle click outside to close dropdown
   * Adds event listener to detect clicks outside the dropdown container
   * and closes the dropdown when such clicks occur
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(""); // Clear search term when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  /**
   * Handler: Toggle dropdown open/close state
   * Used for traditional dropdown mode (when searchDropdown is false)
   */
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm(""); // Clear search when opening
      }
    }
  };

  /**
   * Handler: Open dropdown when input receives focus
   * Used for search dropdown mode (when searchDropdown is true)
   */
  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  /**
   * Handler: Close dropdown when input loses focus
   * Includes a small delay to allow option clicks to register
   */
  const handleInputBlur = () => {
    // Delay closing to allow option clicks
    // preventing the click from registering
    setTimeout(() => {
      setIsOpen(false);
      setSearchTerm("");
    }, 150);
  };

  /**
   * Handler: Handle option selection
   * Updates selected value, closes dropdown, and calls onChange callback
   */
  const handleOptionClick = (optionValue: string | number) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    onChange?.(optionValue);
  };

  /**
   * Handler: Handle search input changes
   * Updates search term, opens dropdown, and handles empty input reset
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setSearchTerm(inputValue);
    setIsOpen(true);
    
    // If user clears the input, reset to default value
    if (inputValue === "") {
      setSelectedValue(defaultValue);
      onChange?.(defaultValue);
    }
  };

  /**
   * Filter options based on search term
   * Returns filtered options when in search mode and search term exists
   * Otherwise returns all options
   */
  const filteredOptions = searchDropdown && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;


  // Find the currently selected option for display purposes
  const selectedOption = options.find(opt => opt.value === selectedValue);

  return (
    <div className="selectdropdown-container" ref={dropdownRef}>
      {/* Conditional rendering based on searchDropdown prop */}
      {searchDropdown ? (
        /* Search Dropdown Mode: Input field with dropdown functionality */
        <div className={`custom-selectdropdown ${disabled ? 'disabled' : ''}`}>
          <input
            ref={searchInputRef}
            type="text"
            className="dropdown-text"
            value={searchTerm || selectedOption?.label || ""}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={ariaLabel}
            id={id}
            data-testid={dataTestId}
          />
          {/* Arrow icon indicating dropdown state */}
          {isOpen ? (
            <UpArrowIcon color={disabled ? '#E5E5E5' : '#9E9E9E'} />
          ) : (
            <DownArrowIcon color="#9E9E9E" />
          )}
        </div>
      ) : (
        /* Traditional Dropdown Mode: Click-to-open button */
        <div
          className={`custom-selectdropdown ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          tabIndex={disabled ? -1 : 0}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          id={id}
          data-testid={dataTestId}
        >
          <span className="dropdown-text">
            {selectedOption?.label || defaultValue}
          </span>
          {/* Arrow icon indicating dropdown state */}
          {isOpen ? (
              <UpArrowIcon color={disabled ? '#E5E5E5' : '#9E9E9E'} />
            ) : (
              <DownArrowIcon color="#9E9E9E" />
            )}
        </div>
      )}
      
      {/* Dropdown Options: Rendered when dropdown is open and not disabled */}
      {isOpen && !disabled && (
        <div className="custom-dropdown-options">
          {filteredOptions.length > 0 ? (
            /* Render filtered options */
            filteredOptions.map((option, index) => (
              <ListGroup.Item
                key={option.value}
                className={`custom-dropdown-item ${option.value === selectedValue ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option.value)}
                role="option"
                aria-selected={option.value === selectedValue}
                data-testid={`${dataTestId}-option-${index}`}
                aria-label={`${ariaLabel}-option-${index}`}
              >
                {option.label}
              </ListGroup.Item>
            ))
          ) : (
            /* No results message when search yields no matches */
            <ListGroup.Item className="custom-dropdown-item no-results">
              No Matching Results
            </ListGroup.Item>   
          )}
        </div>
      )}
    </div>
  );
};
