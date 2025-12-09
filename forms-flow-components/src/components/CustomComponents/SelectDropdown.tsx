import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  memo,
} from "react";
import { createPortal } from "react-dom";
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
  /** Placeholder text for the dropdown button */
  placeholder?: string;
  /** Custom width for the dropdown (e.g., '300px', '20rem', '100%') */
  width?: string | number;
  /** Max height for the dropdown menu */
  dropdownMaxHeight?: string | number;

  /** --- New props for dependent dropdown --- */
  secondDropdown?: boolean;
  dependentOptions?: Record<string, OptionType[]>; // map primaryValue -> secondary options
  secondDefaultValue?: string | number;
  secondValue?: string | number;
  onSecondChange?: (value: string | number) => void;
  resizeable?: boolean;
}

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

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
      width,
      dropdownMaxHeight,

      // Top-of-list CustomSearch
      searchable = false,
      customSearchPlaceholder = "Search all forms",
      placeholder,

      // Secondary dropdown support
      secondDropdown = false,
      dependentOptions = {},
      secondDefaultValue,
      secondValue,
      onSecondChange,
      resizeable = false,
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
    const primaryWrapperRef = useRef<HTMLDivElement>(null);
    const secondaryWrapperRef = useRef<HTMLDivElement>(null);
    const primaryMenuRef = useRef<HTMLDivElement | null>(null);
    const secondaryMenuRef = useRef<HTMLDivElement | null>(null);
    const [primaryPosition, setPrimaryPosition] = useState<DropdownPosition | null>(null);
    const [secondaryPosition, setSecondaryPosition] = useState<DropdownPosition | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Update values if props change
    useEffect(() => {
      setSelectedValue(value || defaultValue);
    }, [value, defaultValue]);

    useEffect(() => {
      setSecondSelectedValue(secondValue || secondDefaultValue);
    }, [secondValue, secondDefaultValue]);

    useEffect(() => {
      setIsMounted(typeof document !== "undefined");
    }, []);

    const updatePosition = useCallback(
      (
        wrapper: React.RefObject<HTMLDivElement>,
        setter: React.Dispatch<React.SetStateAction<DropdownPosition | null>>
      ) => {
        if (!wrapper.current) return;
        const rect = wrapper.current.getBoundingClientRect();
        setter({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      },
      []
    );

    useEffect(() => {
      if (!isOpen) return;
      const handleUpdate = () => updatePosition(primaryWrapperRef, setPrimaryPosition);
      handleUpdate();
      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);
      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    }, [isOpen, updatePosition]);

    useEffect(() => {
      if (!secondIsOpen) return;
      const handleUpdate = () => updatePosition(secondaryWrapperRef, setSecondaryPosition);
      handleUpdate();
      window.addEventListener("scroll", handleUpdate, true);
      window.addEventListener("resize", handleUpdate);
      return () => {
        window.removeEventListener("scroll", handleUpdate, true);
        window.removeEventListener("resize", handleUpdate);
      };
    }, [secondIsOpen, updatePosition]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          (!primaryMenuRef.current ||
            !primaryMenuRef.current.contains(event.target as Node)) &&
          (!secondaryMenuRef.current ||
            !secondaryMenuRef.current.contains(event.target as Node))
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

    // Shared style for dropdown menus
    const dropdownStyle: React.CSSProperties = useMemo(() => {
      if (!dropdownMaxHeight) return {};
      return {
        maxHeight:
          typeof dropdownMaxHeight === "number"
            ? `${dropdownMaxHeight}px`
            : dropdownMaxHeight,
        overflowY: "auto",
      };
    }, [dropdownMaxHeight]);

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
      itemClass?: string,
      wrapperRef?: React.RefObject<HTMLDivElement>,
      menuRef?: React.MutableRefObject<HTMLDivElement | null>,
      position?: DropdownPosition | null,
      placeholderText?: string
    ) => {
      const shouldPortal =
        isMounted && position && typeof document !== "undefined";
      const dropdownContent = (
        <div
          ref={(node) => {
            if (menuRef) {
              menuRef.current = node;
            }
          }}
          className={buildClassNames(
            "custom-dropdown-options",
            `custom-dropdown-options--${variantType}`
          )}
          style={
            shouldPortal && position
              ? {
                  position: "absolute",
                  top: position.top,
                  left: position.left,
                  ...(resizeable
                    ? { width: "max-content", maxWidth: "15.25rem" }
                    : { width: position.width }),
                  zIndex: 2000,
                  ...dropdownStyle,
                }
              : Object.keys(dropdownStyle).length
              ? dropdownStyle
              : undefined
          }
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
      );

      return (
        <div
          ref={wrapperRef}
          className={buildClassNames("dropdown-wrapper", wrapperClass)}
        >
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
              const selected = opts?.find((o) => o.value === selValue);
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
              const defaultMatch = opts?.find((o) => o.value === defaultVal);
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
              // Show placeholder if no value is selected
              if (!selValue && !defaultVal && placeholderText) {
                return <span className="dropdown-text-placeholder">{placeholderText}</span>;
              }
              return defaultVal ?? "";
            })()}
          </span>
          {renderArrowIcon(isOpenState)}
        </button>
        {isOpenState &&
          !disabled &&
          (shouldPortal
            ? createPortal(dropdownContent, document.body)
            : dropdownContent)}
      </div>
      );
    };

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
    const containerStyle: React.CSSProperties | undefined = {
      ...(incomingStyle || {}),
      ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
      ...(secondDropdown && { marginBottom: hasSecondary ? "5rem" : "2rem" })
    };

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
          dropdownItemClassName,
          primaryWrapperRef,
          primaryMenuRef,
          primaryPosition,
          placeholder
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
                dropdownItemClassName,
                secondaryWrapperRef,
                secondaryMenuRef,
                secondaryPosition,
                undefined
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
