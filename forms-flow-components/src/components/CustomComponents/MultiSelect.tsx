import React, { useState, useRef, useEffect } from "react";
import Multiselect from "multiselect-react-dropdown";
import { CloseIcon } from "../SvgIcons/index";
import { StyleServices } from "@formsflow/service";

/**
 * Interface defining the props for the MultipleSelect component
 */
interface MultiSelectInterface {
  /** Array of options to display in the dropdown */
  options: Array<any>;
  /** Array of currently selected values */
  selectedValues?: Array<any>;
  /** Callback function triggered when an option is selected */
  onSelect?: (selected: any) => void;
  /** Callback function triggered when an option is removed */
  onRemove?: (removed: any) => void;
  /** Property name to display from the option objects */
  displayValue?: string;
  /** Whether to avoid highlighting the first option by default */
  avoidHighlightFirstOption?: boolean;
  /** Whether to hide the placeholder text */
  hidePlaceholder?: boolean;
  /** Additional CSS class names to apply */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Placeholder text to display when no options are selected */
  placeholder?: string;
  /** Label text to display above the component */
  label?: string;
  /** Visual variant of the component ('primary' or 'secondary') */
  variant?: "primary" | "secondary";
}

export const MultipleSelect: React.FC<MultiSelectInterface> = ({
  options = [],
  selectedValues = [],
  onSelect = () => {},
  onRemove = () => {},
  displayValue = "",
  avoidHighlightFirstOption = true,
  hidePlaceholder = true,
  className = "",
  disabled,
  placeholder = "",
  label,
  variant = "",
}) => {
  // Get color values from CSS variables for different states and variants
  const disabledPrimaryColor = StyleServices.getCSSVariable("--primary");
  const disabledSecondaryColor = StyleServices.getCSSVariable("--gray-x-light");
  const primaryColor = StyleServices.getCSSVariable("--primary-dark");
  const secondaryColor = StyleServices.getCSSVariable("--secondary-dark");

  // Ref to track the dropdown container for click outside detection
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // State to track whether the dropdown is currently open
  const [isOpen, setIsOpen] = useState(false);
  // Toggle dropdown open/close when clicked
  const handleClick = (e: MouseEvent) => {
    if (dropdownRef.current?.contains(e.target as Node) && !disabled) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  /**
   * Effect hook to add/remove global click event listener
   * Enables click-outside-to-close functionality
   */
  useEffect(() => {
    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const iconColor =
    disabled && variant === "primary"
      ? disabledPrimaryColor
      : disabled && variant === "secondary"
      ? disabledSecondaryColor
      : variant === "primary"
      ? primaryColor
      : secondaryColor;
  return (
    <div
      className={`multiselect-container ${className} ${variant}-variant`}
      ref={dropdownRef}
    >
      {/* Conditionally render label if provided */}
      {label && <label className="multiple-select-label">{label}</label>}

      {/* Main multiselect component */}
      <Multiselect
        options={options}
        selectedValues={selectedValues}
        data-testid="multi-select"
        // className={`${isOpen && "open-dropdown"}`} // Commented out - could be used for styling open state
        onSelect={onSelect}
        onRemove={onRemove}
        displayValue={displayValue}
        avoidHighlightFirstOption={avoidHighlightFirstOption}
        hidePlaceholder={hidePlaceholder}
        disable={disabled}
        placeholder={placeholder}
        customCloseIcon={
          <CloseIcon
            onClick={onRemove}
            color={iconColor}
            data-testid="pill-remove-icon"
            aria-label="remove "
          />
        }
      />
    </div>
  );
};
