import React, { FC, useState, useRef, useEffect } from "react";
import { DownArrowIcon, UpArrowIcon } from "../../formsflow-components";
import { ListGroup } from "react-bootstrap";
import { StyleServices } from "@formsflow/service";

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
  const disabledColor = StyleServices.getCSSVariable('--gray-x-light');
  const grayMediumDark = StyleServices.getCSSVariable('--gray-medium-dark');
  
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
   * Handler: Handle keyboard events for accessibility
   * Supports Enter and Space keys to toggle dropdown
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setSearchTerm("");
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

  /**
   * Render arrow icon based on dropdown state
   */
  const renderArrowIcon = () => {
    const iconColor = disabled ? disabledColor : grayMediumDark;
    return isOpen ? (
      <UpArrowIcon color = {grayMediumDark} />
    ) : (
      <DownArrowIcon color={iconColor} />
    );
  };

  /**
   * Render search dropdown input
   */
  const renderSearchDropdown = () => (
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
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        id={id}
        data-testid={dataTestId}
      />
      {renderArrowIcon()}
    </div>
  );

  /**
   * Render traditional dropdown button
   */
  const renderTraditionalDropdown = () => (
    <button
      className={`custom-selectdropdown ${disabled ? 'disabled' : ''}`}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-label={ariaLabel}
      id={id}
      data-testid={dataTestId}
    >
      <span className="dropdown-text">
        {selectedOption?.label || defaultValue}
      </span>
      {renderArrowIcon()}
    </button>
  );

  /**
   * Render dropdown options
   */
  const renderDropdownOptions = () => {
    if (!isOpen || disabled) return null;

    return (
      <div className="custom-dropdown-options">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <ListGroup.Item
              key={option.value}
              className={`custom-dropdown-item ${option.value === selectedValue ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option.value)}
              aria-selected={option.value === selectedValue}
              data-testid={`${dataTestId}-option-${index}`}
              aria-label={`${ariaLabel}-option-${index}`}
            >
              {option.label}
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="custom-dropdown-item no-results">
            No Matching Results
          </ListGroup.Item>   
        )}
      </div>
    );
  };

  return (
    <div className="selectdropdown-container" ref={dropdownRef}>
      {searchDropdown ? renderSearchDropdown() : renderTraditionalDropdown()}
      {renderDropdownOptions()}
    </div>
  );
};
