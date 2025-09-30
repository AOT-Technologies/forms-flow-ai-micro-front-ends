import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, memo } from "react";
import { DownArrowIcon, UpArrowIcon } from "../SvgIcons";
import { ListGroup } from "react-bootstrap";

/**
 * Dropdown option interface for SelectDropdown component
 */
export interface OptionType {
  /** Display text for the option */
  label: string;
  /** Value associated with the option */
  value: string | number;
}

/**
 * Props for `SelectDropdown` component.
 * Optimized, accessible dropdown component with search functionality.
 */
export interface SelectDropdownProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Array of options to display in the dropdown */
  options: OptionType[];
  /** Currently selected value */
  value?: string | number;
  /** Callback function when selection changes */
  onChange?: (value: string | number) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Default value to show when nothing is selected */
  defaultValue?: string | number;
  /** Whether to render as searchable input field */
  searchDropdown?: boolean;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}



/**
 * Utility function to build className string
 */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

/**
 * SelectDropdown: Accessible, memoized dropdown component with search functionality.
 *
 * Usage:
 * <SelectDropdown
 *   options={[{ label: "Option 1", value: "1" }]}
 *   value="1"
 *   onChange={(value) => console.log(value)}
 *   searchDropdown={true}
 *   disabled={false}
 * />
 */
const SelectDropdownComponent = forwardRef<HTMLDivElement, SelectDropdownProps>(
  (
    {
      options,
      value,
      onChange,
      disabled = false,
      defaultValue,
      searchDropdown = false,
      dataTestId = "",
      ariaLabel = "",
      className = "",
      ...restProps
    },
    ref
  ) => {
    // State management
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value || defaultValue);
    const [searchTerm, setSearchTerm] = useState<string>("");
    
    // Refs for DOM manipulation
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Update internal state when external value prop changes
    useEffect(() => {
      setSelectedValue(value || defaultValue);
    }, [value, defaultValue]);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [isOpen]);


    // Memoized toggle handler
    const handleToggle = useCallback((): void => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          setSearchTerm("");
        }
      }
    }, [disabled, isOpen]);

    // Memoized keyboard event handler
    const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
      if (disabled) return;
      
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
      }
    }, [disabled, handleToggle]);

    // Memoized input focus handler
    const handleInputFocus = useCallback((): void => {
      if (!disabled) {
        setIsOpen(true);
      }
    }, [disabled]);

    // Memoized input blur handler
    const handleInputBlur = useCallback((): void => {
      setTimeout(() => {
        setIsOpen(false);
        setSearchTerm("");
      }, 150);
    }, []);

    // Memoized option selection handler
    const handleOptionClick = useCallback((optionValue: string | number): void => {
      setSelectedValue(optionValue);
      setIsOpen(false);
      setSearchTerm("");
      onChange?.(optionValue);
    }, [onChange]);

    // Memoized search change handler
    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
      const inputValue = event.target.value;
      setSearchTerm(inputValue);
      setIsOpen(true);
      
      if (inputValue === "") {
        setSelectedValue(defaultValue);
        onChange?.(defaultValue);
      }
    }, [defaultValue, onChange]);

    // Memoized filtered options
    const filteredOptions = useMemo(() => {
      return searchDropdown && searchTerm
        ? options.filter(option => 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;
    }, [options, searchDropdown, searchTerm]);

    // Memoized selected option
    const selectedOption = useMemo(() => {
      return options.find(opt => opt.value === selectedValue);
    }, [options, selectedValue]);

    // Memoized arrow icon renderer
    const renderArrowIcon = useCallback(() => {
      const iconColor = disabled ? "#c5c5c5" : "#4a4a4a";
      return isOpen ? (
        <UpArrowIcon color="#4a4a4a" />
      ) : (
        <DownArrowIcon color={iconColor} />
      );
    }, [disabled, isOpen]);

    // Memoized search dropdown renderer
    const renderSearchDropdown = useCallback(() => (
      <div className={buildClassNames("custom-selectdropdown", disabled && "disabled")}>
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
          data-testid={dataTestId}
        />
        {renderArrowIcon()}
      </div>
    ), [searchTerm, selectedOption, handleSearchChange, handleInputFocus, handleInputBlur, disabled, ariaLabel, dataTestId, renderArrowIcon]);

    // Memoized traditional dropdown renderer
    const renderTraditionalDropdown = useCallback(() => (
      <button
        className={buildClassNames("custom-selectdropdown", disabled && "disabled")}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        <span className="dropdown-text">
          {selectedOption?.label || defaultValue}
        </span>
        {renderArrowIcon()}
      </button>
    ), [disabled, handleToggle, handleKeyDown, isOpen, ariaLabel, dataTestId, selectedOption, defaultValue, renderArrowIcon]);

    // Memoized dropdown options renderer
    const renderDropdownOptions = useCallback(() => {
      if (!isOpen || disabled) return null;

      return (
        <div className="custom-dropdown-options">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <ListGroup.Item
                key={option.value}
                className={buildClassNames(
                  "custom-dropdown-item",
                  option.value === selectedValue && "selected"
                )}
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
    }, [isOpen, disabled, filteredOptions, selectedValue, dataTestId, ariaLabel, handleOptionClick]);

    // Memoized container className
    const containerClassName = useMemo(
      () => buildClassNames("selectdropdown-container", className),
      [className]
    );

    return (
      <div
        ref={ref}
        className={containerClassName}
        data-testid={dataTestId}
        {...restProps}
      >
        {searchDropdown ? renderSearchDropdown() : renderTraditionalDropdown()}
        {renderDropdownOptions()}
      </div>
    );
  }
);

// Set display name for better debugging
SelectDropdownComponent.displayName = "SelectDropdown";

// Export memoized component for performance optimization
export const SelectDropdown = memo(SelectDropdownComponent);

// Export types for consumers
export type { SelectDropdownProps as SelectDropdownPropsType, OptionType as SelectDropdownOptionType };
