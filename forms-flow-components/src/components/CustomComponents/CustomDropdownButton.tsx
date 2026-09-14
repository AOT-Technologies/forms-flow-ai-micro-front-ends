import React, {
  useState,
  useCallback,
  useMemo,
  forwardRef,
  memo,
  useEffect,
  useRef,
} from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import { ChevronIcon } from "../SvgIcons/index";

/**
 * Module-level registry to track the currently open dropdown's close function.
 * Only one dropdown should be open at a time across all instances.
 */
let currentOpenDropdown: (() => void) | null = null;

/**
 * Dropdown item descriptor for `V8CustomDropdownButton`.
 */
export interface DropdownItemConfig {
  /** Text label or translation key for the item */
  label: string;
  /** Value associated with this item */
  value?: string;
  /** Called when this item is clicked */
  onClick?: () => void;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Custom class for this item */
  className?: string;
}

/**
 * Props for `V8CustomDropdownButton` component.
 * Optimized, accessible dropdown button with separate label and dropdown actions.
 */
export interface V8CustomDropdownButtonProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onClick"> {
  /** Button label text */
  label?: string;
  /** Array of dropdown menu items */
  dropdownItems: DropdownItemConfig[];
  /** Visual style variant */
  variant?: "primary" | "secondary";
  /** Disables the entire dropdown button */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Dropdown menu alignment */
  menuPosition?: "left" | "right";
  /** Called when the label is clicked (separate from dropdown) */
  onLabelClick?: () => void;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (
  ...classes: (string | boolean | undefined)[]
): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * V8CustomDropdownButton: Accessible, memoized dropdown button with separate label and dropdown actions.
 *
 * Usage:
 * <V8CustomDropdownButton
 *   label="Actions"
 *   dropdownItems={[
 *     { label: 'Edit', value: 'edit', onClick: handleEdit },
 *     { label: 'Delete', value: 'delete', onClick: handleDelete }
 *   ]}
 *   onLabelClick={handlePrimaryAction}
 *   variant="primary"
 * />
 */
const V8CustomDropdownButtonComponent = forwardRef<
  HTMLDivElement,
  V8CustomDropdownButtonProps
>(
  (
    {
      label = "Edit",
      dropdownItems,
      variant = "primary",
      disabled = false,
      className = "",
      dataTestId = "v8-dropdown",
      ariaLabel = "Custom dropdown",
      menuPosition = "left",
      onLabelClick,
      ...restProps
    },
    ref
  ) => {
    // State management
    const [open, setOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string | null>(null);

    // Memoized dropdown items to prevent unnecessary re-renders
    const memoizedDropdownItems = useMemo(() => dropdownItems, [dropdownItems]);

    // Stable close function stored in ref (created once, reused)
    const closeRef = useRef<() => void>(() => setOpen(false));

    // Timer used to debounce mouse-leave close so moving the pointer across
    // the visual gap between the toggle and the absolutely-positioned menu
    // (which momentarily isn't over any descendant element) doesn't close
    // the menu before the pointer reaches it.
    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearCloseTimeout = useCallback(() => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }, []);

    // Clear any pending close timer on unmount
    useEffect(() => clearCloseTimeout, [clearCloseTimeout]);

    // Ensure only one dropdown is open at a time
    useEffect(() => {
      if (open) {
        // Close any previously open dropdown
        if (currentOpenDropdown && currentOpenDropdown !== closeRef.current) {
          currentOpenDropdown();
        }
        // Register this dropdown as the currently open one
        currentOpenDropdown = closeRef.current;
      } else {
        // Unregister if this was the open dropdown
        if (currentOpenDropdown === closeRef.current) {
          currentOpenDropdown = null;
        }
      }

      // Cleanup on unmount
      return () => {
        if (currentOpenDropdown === closeRef.current) {
          currentOpenDropdown = null;
        }
      };
    }, [open]);

    // Memoized click handlers for better performance
    const handleItemClick = useCallback(
      (item: DropdownItemConfig) => {
        clearCloseTimeout();
        setSelectedValue(item.value || item.label);
        item.onClick?.();
        setOpen(false); // Close dropdown after selection
      },
      [clearCloseTimeout]
    );

    const handleLabelClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onLabelClick) {
          onLabelClick();
        }
      },
      [disabled, onLabelClick]
    );

    const handleDropdownIconHover = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          clearCloseTimeout();
          setOpen(true);
        }
      },
      [disabled, clearCloseTimeout]
    );

    // Cancel any pending close when the pointer re-enters the dropdown
    // (toggle or menu) before the debounce timer fires.
    const handleDropdownMouseEnter = useCallback(() => {
      clearCloseTimeout();
    }, [clearCloseTimeout]);

    const handleDropdownMouseLeave = useCallback(() => {
      if (!disabled) {
        clearCloseTimeout();
        closeTimeoutRef.current = setTimeout(() => {
          setOpen(false);
        }, 200);
      }
    }, [disabled, clearCloseTimeout]);

    const handleDropdownIconKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }
      },
      [disabled]
    );

    // Memoized dropdown toggle handler
    // React Bootstrap handles click-outside closing automatically
    const handleDropdownToggle = useCallback(
      (isOpen: boolean) => {
        if (!disabled) {
          clearCloseTimeout();
          setOpen(isOpen);
        }
      },
      [disabled, clearCloseTimeout]
    );

    // Memoized container className
    const containerClassName = useMemo(
      () =>
        buildClassNames(
          "v8-custom-dropdown",
          `menu-${menuPosition}`,
          className
        ),
      [menuPosition, className]
    );

    // Memoized toggle button className
    const toggleClassName = useMemo(
      () => buildClassNames("v8-dropdown-toggle", open && "open"),
      [open]
    );

    // Filter out props that conflict with Dropdown component
    const { onSelect, ...dropdownProps } = restProps;

    return (
      <Dropdown
        as={ButtonGroup}
        show={open}
        onToggle={handleDropdownToggle}
        onMouseEnter={handleDropdownMouseEnter}
        onMouseLeave={handleDropdownMouseLeave}
        className={containerClassName}
        ref={ref}
        {...(dataTestId ? { "data-testid": dataTestId } : {})}
        {...dropdownProps}
      >
        <Dropdown.Toggle
          variant={variant}
          disabled={disabled}
          className={toggleClassName}
          aria-haspopup="listbox"
          aria-expanded={open}
          {...(ariaLabel ? { "aria-label": ariaLabel } : {})}
          {...(dataTestId ? { "data-testid": `${dataTestId}-toggle` } : {})}
        >
          {/* Label section - triggers separate action */}
          <div
            className="label-div"
            onClick={handleLabelClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleLabelClick(e as any);
              }
            }}
            data-testid={`${dataTestId}-label`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`${label} action`}
          >
            <span className="dropdown-label">{label}</span>
          </div>

          {/* Visual divider */}
          <span className="v8-dropdown-divider" aria-hidden="true" />

          {/* Dropdown icon section - toggles menu */}
          <div
            className="dropdown-icon"
            onMouseEnter={handleDropdownIconHover}
            onKeyDown={handleDropdownIconKeyDown}
            data-testid={`${dataTestId}-icon`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Toggle dropdown menu"
          >
            <span className="chevron-icon">
              <ChevronIcon />
            </span>
          </div>
        </Dropdown.Toggle>

        {/* Dropdown menu */}
        <Dropdown.Menu
          className="v8-dropdown-menu"
          role="listbox"
          {...(dataTestId ? { "data-testid": `${dataTestId}-menu` } : {})}
        >
          {memoizedDropdownItems.map((item, index) => {
            const itemKey = item.value || item.label || index;
            const isSelected = selectedValue === (item.value || item.label);

            return (
              <Dropdown.Item
                key={itemKey}
                onClick={() => handleItemClick(item)}
                className={buildClassNames(
                  "v8-dropdown-item",
                  isSelected && "selected",
                  item.className
                )}
                role="option"
                aria-selected={isSelected}
                {...(item.ariaLabel ? { "aria-label": item.ariaLabel } : {})}
                {...(item.dataTestId ? { "data-testid": item.dataTestId } : {})}
              >
                {item.label}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
);

// Set display name for better debugging
V8CustomDropdownButtonComponent.displayName = "V8CustomDropdownButton";

// Export memoized component for performance optimization
export const V8CustomDropdownButton = memo(V8CustomDropdownButtonComponent);
