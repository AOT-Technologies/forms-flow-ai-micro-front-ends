import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, memo } from "react";
import { DownArrowIcon, UpArrowIcon, VerticalLineIcon } from "../SvgIcons";
import { ListGroup } from "react-bootstrap";
import { CustomSearch } from "./Search";

/**
 * Dropdown option interface for SelectDropdown component
 */
export interface OptionType {
  /** Display text for the option */
  label: string;
  /** Value associated with the option */
  value: string | number;
  /** Optional icon rendered alongside the label */
  icon?: React.ReactNode;
}

/**
 * Dropdown variant type
 */
export type DropdownVariant = "primary" | "secondary";

/**
 * Props for `SelectDropdown` component.
 * Optimized, accessible dropdown component with search functionality.
 */
export interface SelectDropdownProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Array of options to display in the dropdown */
  /** Currently selected value */
  /** Currently selected value */
  options: OptionType[];
  value?: string | number;
  /** Callback function when selection changes */
  onChange?: (value: string | number) => void;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Default value to show when nothing is selected */
  defaultValue?: string | number;
  /** Whether to render as searchable input field */
  searchDropdown?: boolean;
  /** HTML id attribute for the dropdown */
  id?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Visual variant of the dropdown ('primary' or 'secondary') */
  variant?: DropdownVariant;
  className?: string;
  dropdownWrapperClassName?: string;
  dropdownItemClassName?: string;
  /** Show a CustomSearch input at the top of the options list */
  searchable?: boolean;
  /** Placeholder for the CustomSearch input */
  customSearchPlaceholder?: string;

  /** --- New props for dependent dropdown --- */
  secondDropdown?: boolean;
  dependentOptions?: Record<string, OptionType[]>; // map primaryValue -> secondary options
  secondDefaultValue?: string | number;
  secondValue?: string | number;
  onSecondChange?: (value: string | number) => void;
}

/** Utility: build className string */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

/** SelectDropdown Component */
const SelectDropdownComponent = forwardRef<HTMLDivElement, SelectDropdownProps>(
  (
    {
      options,
      value,
      onChange,
      disabled = false,
      defaultValue,
      searchDropdown = false,
      id = "",
      dataTestId = "",
      ariaLabel = "",
      className = "",
      variant = "primary",
      dropdownWrapperClassName,
      dropdownItemClassName,

      // Top-of-list CustomSearch
      searchable = false,
      customSearchPlaceholder = "Search all forms",

      // Secondary dropdown support
      secondDropdown = false,
      dependentOptions = {},
      secondDefaultValue,
      secondValue,
      onSecondChange,
      ...restProps
    },
    ref
  ) => {
    // ---------- PRIMARY DROPDOWN ----------
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedValue, setSelectedValue] = useState<string | number | undefined>(
      value || defaultValue
    );
    const [searchTerm, setSearchTerm] = useState<string>("");

    // ---------- SECONDARY DROPDOWN ----------
    const [secondIsOpen, setSecondIsOpen] = useState<boolean>(false);
    const [secondSelectedValue, setSecondSelectedValue] = useState<
      string | number | undefined
    >(secondValue || secondDefaultValue);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update values if props change
    useEffect(() => {
      setSelectedValue(value || defaultValue);
    }, [value, defaultValue]);

    useEffect(() => {
      setSecondSelectedValue(secondValue || secondDefaultValue);
    }, [secondValue, secondDefaultValue]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSecondIsOpen(false);
          setSearchTerm("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    /** Handle primary toggle */
    const handleToggle = useCallback(() => {
      if (!disabled) setIsOpen((prev) => !prev);
    }, [disabled]);

    /** Handle secondary toggle */
    const handleSecondToggle = useCallback(() => {
      if (!disabled) setSecondIsOpen((prev) => !prev);
    }, [disabled]);

    /** Handle primary select */
    const handleOptionClick = useCallback(
      (optionValue: string | number): void => {
        setSelectedValue(optionValue);
        setIsOpen(false);
        setSearchTerm("");
        onChange?.(optionValue);

        // Reset dependent dropdown when parent changes
        // Do NOT auto-select the first secondary option; require user action
        if (secondDropdown) {
          // Clear secondary selection and wait for manual pick
          setSecondSelectedValue('');
        }
      },
      [onChange, secondDropdown, dependentOptions, onSecondChange]
    );

    /** Handle secondary select */
    const handleSecondSelect = useCallback(
      (optionValue: string | number): void => {
        setSecondSelectedValue(optionValue);
        setSecondIsOpen(false);
        onSecondChange?.(optionValue);
      },
      [onSecondChange]
    );

    /** Filtered primary options */
    const filteredOptions = useMemo(() => {
      return searchDropdown && searchTerm
        ? options.filter((o) =>
            o.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;
    }, [options, searchDropdown, searchTerm]);

    // Memoized selected option
    const selectedOption = useMemo(() => {
      return options?.find(opt => opt.value === selectedValue);
    }, [options, selectedValue]);

    const secondaryOptions = useMemo(() => {
      if (!secondDropdown || !selectedValue) return [];
      return dependentOptions[selectedValue] || [];
    }, [dependentOptions, secondDropdown, selectedValue]);

    /** Arrow icon */
    const renderArrowIcon = (open: boolean) => {
      const iconColor = disabled ? "#c5c5c5" : "#4a4a4a";
      return open ? (
        <UpArrowIcon color={iconColor} />
      ) : (
        <DownArrowIcon color={iconColor} />
      );
    };

    /** Generic dropdown renderer (used for both primary and secondary) */
    const renderDropdown = (
      opts: OptionType[],
      selValue: string | number | undefined,
      isOpenState: boolean,
      toggleFn: () => void,
      selectFn: (value: string | number) => void,
      variantType: DropdownVariant,
      defaultVal?: string | number,
      wrapperClass?: string,
      itemClass?: string
    ) => (
      <div className={buildClassNames("dropdown-wrapper", wrapperClass)}>
        <button
          type="button"
          className={buildClassNames(
            "custom-selectdropdown",
            `custom-selectdropdown--${variantType}`,
            disabled && "disabled"
          )}
          onClick={toggleFn}
          aria-expanded={isOpenState}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="dropdown-text">
            {(() => {
              const selected = opts.find((o) => o.value === selValue);
              if (selected) {
                return (
                  <span className="dropdown-text-content">
                    {selected.icon && (
                      <span className="dropdown-icon">{selected.icon}</span>
                    )}
                    <span>{selected.label}</span>
                  </span>
                );
              }
              const defaultMatch = opts.find((o) => o.value === defaultVal);
              if (defaultMatch) {
                return (
                  <span className="dropdown-text-content">
                    {defaultMatch.icon && (
                      <span className="dropdown-icon">{defaultMatch.icon}</span>
                    )}
                    <span>{defaultMatch.label}</span>
                  </span>
                );
              }
              return defaultVal ?? "";
            })()}
          </span>
          {renderArrowIcon(isOpenState)}
        </button>
        {isOpenState && !disabled && (
          <div
            className={buildClassNames(
              "custom-dropdown-options",
              `custom-dropdown-options--${variantType}`
            )}
          >
            {searchable && (
              <div className="custom-dropdown-search">
                <CustomSearch
                  search={searchTerm}
                  setSearch={setSearchTerm}
                  handleSearch={() => {}}
                  placeholder={customSearchPlaceholder}
                  dataTestId={`${dataTestId}-dropdown-search`}
                />
              </div>
            )}
            {opts.length > 0 ? (
              opts.map((option) => (
                <ListGroup.Item
                  key={option.value}
                  className={buildClassNames(
                    "custom-dropdown-item",
                    itemClass,
                    option.value === selValue && "selected"
                  )}
                  onClick={() => selectFn(option.value)}
                  aria-selected={option.value === selValue}
                  data-testid={`${dataTestId}-${option.value}`}
                >
                  <span className="dropdown-option-content">
                    {option.icon && (
                      <span className="dropdown-icon">{option.icon}</span>
                    )}
                    <span className="text-break">{option.label}</span>
                  </span>
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item className="custom-dropdown-item no-results">
                No Matching Results
              </ListGroup.Item>
            )}
          </div>
        )}
      </div>
    );

    const containerClassName = useMemo(
      () =>
        buildClassNames(
          "selectdropdown-container",
          `selectdropdown-container--${variant}`,
          className
        ),
      [className, variant]
    );

    // Compute automatic block spacing based on whether a secondary dropdown will render
    const hasSecondary = secondDropdown && (secondaryOptions.length > 0);
    const { style: incomingStyle, ...restDivProps } = restProps as { style?: React.CSSProperties } & Record<string, any>;
    const containerStyle: React.CSSProperties | undefined = secondDropdown
      ? { ...(incomingStyle || {}), marginBottom: hasSecondary ? "5rem" : "2rem" }
      : incomingStyle;

    return (
      <div
        ref={(node) => {
          dropdownRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={containerClassName}
        data-testid={dataTestId}
        style={containerStyle}
        {...restDivProps}
      >
        {/* --- PRIMARY DROPDOWN --- */}
        {renderDropdown(
          filteredOptions,
          selectedValue,
          isOpen,
          handleToggle,
          handleOptionClick,
          variant,
          defaultValue,
          dropdownWrapperClassName,
          dropdownItemClassName
        )}

        {/* --- SECONDARY DROPDOWN (Indented) --- */}
        {secondDropdown && secondaryOptions.length > 0 && (
          
          <div className="secondary-dropdown-container">
                      <VerticalLineIcon color="#E5E5E5" className='vertical-line-icon' />

            <div className="secondary-dropdown-line" />
            <div className="secondary-dropdown-inner">
              {renderDropdown(
                secondaryOptions,
                secondSelectedValue,
                secondIsOpen,
                handleSecondToggle,
                handleSecondSelect,
                "secondary",
                secondDefaultValue,
                dropdownWrapperClassName,
                dropdownItemClassName
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SelectDropdownComponent.displayName = "SelectDropdown";

export const SelectDropdown = memo(SelectDropdownComponent);
export type {
  SelectDropdownProps as SelectDropdownPropsType,
  OptionType as SelectDropdownOptionType,
};
