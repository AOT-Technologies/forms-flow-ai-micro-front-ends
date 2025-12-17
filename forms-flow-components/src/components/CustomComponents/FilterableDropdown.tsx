import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { DownArrowIcon, UpArrowIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";

/**
 * Option interface for FilterableDropdown component
 */
export interface FilterableOption {
  /** Display text for the option */
  label: string;
  /** Value associated with the option */
  value: string | number;
}

/**
 * Props for `FilterableDropdown` component.
 * A searchable dropdown with input field that filters options as you type.
 */
export interface FilterableDropdownProps {
  /** Array of options to display in the dropdown */
  options: FilterableOption[];
  /** Currently selected value */
  value?: string | number;
  /** Callback function when selection changes */
  onChange?: (value: string | number, option?: FilterableOption) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Default value to show when nothing is selected */
  defaultValue?: string | number;
  /** HTML id attribute for the dropdown */
  id?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Custom width for the dropdown (e.g., '300px', '20rem', '100%') */
  width?: string | number;
  /** Max height for the dropdown menu */
  dropdownMaxHeight?: string | number;
  /** Whether to show the dropdown arrow icon */
  showArrow?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Custom className for dropdown items */
  itemClassName?: string;
  /** Whether to make the dropdown resizable */
  resizable?: boolean;
  /** Callback when input value changes (for custom filtering) */
  onInputChange?: (value: string) => void;
  /** Custom filter function */
  filterFunction?: (option: FilterableOption, searchTerm: string) => boolean;
}

/**
 * FilterableDropdown: A searchable dropdown component with input field.
 * Filters options as you type and allows selection from the filtered list.
 *
 * Usage:
 * <FilterableDropdown
 *   options={options}
 *   value={selectedValue}
 *   onChange={handleChange}
 *   dataTestId="filterable-dropdown"
 * />
 */
export const FilterableDropdown: React.FC<FilterableDropdownProps> = ({
  options = [],
  value,
  onChange,
  disabled = false,
  defaultValue,
  id = "",
  dataTestId = "",
  ariaLabel = "",
  width,
  dropdownMaxHeight = "300px",
  showArrow = true,
  className = "",
  itemClassName = "",
  onInputChange,
  filterFunction,
  resizable = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [isUserTyping, setIsUserTyping] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value || opt.value === defaultValue);
  }, [options, value, defaultValue]);

  // Console options on load
  useEffect(() => {
    console.log("FilterableDropdown options on load:", options);
  }, [options]);

  // Console dropdown state
  useEffect(() => {
    console.log("FilterableDropdown isOpen:", isOpen);
  }, [isOpen]);

  // Initialize input value with selected option label only when dropdown is closed and user is not typing
  useEffect(() => {
    if (!isOpen && !isUserTyping) {
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else {
        setInputValue("");
      }
    }
  }, [selectedOption, isOpen, isUserTyping]);

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) {
      return options;
    }

    const searchTerm = inputValue.toLowerCase().trim();

    if (filterFunction) {
      return options.filter((option) => filterFunction(option, searchTerm));
    }

    // Default filter: search in label
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm)
    );
  }, [options, inputValue, filterFunction]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setIsOpen(true);
      setIsUserTyping(true);
      setHighlightedIndex(-1);
      onInputChange?.(newValue);
    },
    [onInputChange]
  );

  // Handle option selection
  const handleSelectOption = useCallback(
    (option: FilterableOption) => {
      setInputValue(option.label);
      setIsOpen(false);
      setIsUserTyping(false);
      setHighlightedIndex(-1);
      onChange?.(option.value, option);
    },
    [onChange]
  );

  // Handle clear
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      onChange?.(undefined as any, undefined);
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setIsOpen(true);
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelectOption(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          if (selectedOption) {
            setInputValue(selectedOption.label);
          }
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [disabled, filteredOptions, highlightedIndex, handleSelectOption, selectedOption]
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsUserTyping(false);
        setHighlightedIndex(-1);
        // Reset input value to selected option if available
        if (selectedOption) {
          setInputValue(selectedOption.label);
        } else {
          setInputValue("");
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, selectedOption]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll(".filterable-dropdown-item");
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex]);

  const iconColor = disabled
    ? StyleServices.getCSSVariable("--gray-medium-dark")
    : StyleServices.getCSSVariable("--secondary-dark");

  const containerStyle: React.CSSProperties = width
    ? { width: typeof width === "number" ? `${width}px` : width }
    : {};

  // Calculate dropdown width to match input
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(undefined);
  const [isEllipsis, setIsEllipsis] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const inputWidth = inputRef.current.offsetWidth;
      setDropdownWidth(inputWidth);
      // Check if content is overflowing (ellipsis)
      setIsEllipsis(inputRef.current.scrollWidth > inputRef.current.clientWidth);
    }
  }, [isOpen, inputValue]);

  const dropdownStyle: React.CSSProperties = {
    maxHeight:
      typeof dropdownMaxHeight === "number"
        ? `${dropdownMaxHeight}px`
        : dropdownMaxHeight,
    overflowY: "auto",
    ...(isEllipsis
      ? { width: "max-content", maxWidth: "11.25rem" }
      : dropdownWidth ? { width: `${dropdownWidth}px` } : {}),
  };

  return (
    <div
      ref={containerRef}
      className={`filterable-dropdown-container ${className}`}
      style={containerStyle}
      id={id}
      data-testid={dataTestId}
    >
      <div 
        className="filterable-dropdown-input-wrapper"
        onClick={() => !disabled && !isOpen && setIsOpen(true)}
      >
        <input
          ref={inputRef}
          type="text"
          className="filterable-dropdown-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          data-testid={`${dataTestId}-input`}
        />
        {showArrow && (
          <div 
            className="filterable-dropdown-arrow"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            style={{ cursor: disabled ? 'default' : 'pointer', pointerEvents: 'all' }}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsOpen(!isOpen);
              }
            }}
            aria-label="Toggle dropdown"
          >
            {isOpen ? (
              <UpArrowIcon color={iconColor} />
            ) : (
              <DownArrowIcon color={iconColor} />
            )}
          </div>
        )}
      </div>

      {isOpen && !disabled && (
        <>
          {filteredOptions.length > 0 ? (
            <div
              ref={dropdownRef}
              className="filterable-dropdown-menu"
              style={dropdownStyle}
              role="listbox"
              data-testid={`${dataTestId}-menu`}
            >
              {filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className={`filterable-dropdown-item ${
                    highlightedIndex === index ? "highlighted" : ""
                  } ${option.value === value ? "selected" : ""} ${itemClassName}`}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={option.value === value}
                  data-testid={`${dataTestId}-option-${option.value}`}
                >
                  <span className="filterable-dropdown-item-label">{option.label}</span>
                </div>
              ))}
            </div>
          ) : inputValue.trim() ? (
            <div
              className="filterable-dropdown-menu filterable-dropdown-no-results"
              style={dropdownStyle}
              role="listbox"
              data-testid={`${dataTestId}-no-results`}
            >
              <div className="filterable-dropdown-item filterable-dropdown-empty">
                {t("No results found")}
              </div>
            </div>
          ) : (
            <div
              ref={dropdownRef}
              className="filterable-dropdown-menu"
              style={dropdownStyle}
              role="listbox"
              data-testid={`${dataTestId}-menu`}
            >
              {options.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className={`filterable-dropdown-item ${
                    highlightedIndex === index ? "highlighted" : ""
                  } ${option.value === value ? "selected" : ""} ${itemClassName}`}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={option.value === value}
                  data-testid={`${dataTestId}-option-${option.value}`}
                >
                  <span className="filterable-dropdown-item-label">{option.label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

