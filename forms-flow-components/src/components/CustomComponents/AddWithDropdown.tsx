import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import Dropdown from "react-bootstrap/Dropdown";
import { AddIcon } from "../SvgIcons";
import { useDropdownPosition } from "../../customHooks/internal/useDropdownPosition";

/**
 * A single selectable option rendered in the `AddWithDropdown` menu.
 */
export interface AddWithDropdownOption {
  /** Unique id for the option */
  id: string;
  /** Primary label shown for the option */
  name: string;
  /** Optional supporting text shown under the label (e.g. role description) */
  description?: string;
  /** Optional small badge text shown next to the label (e.g. "Custom") */
  badge?: string;
  /** Disables selection of this option and greys it out */
  disabled?: boolean;
}

/**
 * Props for `AddWithDropdown`.
 * Renders a small circular "+" trigger that opens a menu of selectable
 * options — used to add an item (e.g. a role) to a list inline.
 */
export interface AddWithDropdownProps {
  /** Options listed in the dropdown menu */
  options: AddWithDropdownOption[];
  /** Called with the chosen option when the user selects one */
  onSelect: (option: AddWithDropdownOption) => void;
  /** Disables the trigger entirely */
  disabled?: boolean;
  /** Accessible label for the "+" trigger button */
  ariaLabel?: string;
  /** Message shown when `options` is empty */
  emptyMessage?: string;
  /** Test ID prefix for automated testing */
  dataTestId?: string;
  /** Menu alignment relative to the trigger */
  menuAlign?: "start" | "end";
  /** Additional className for the outer wrapper */
  className?: string;
  /** Called right before the menu opens (e.g. to refresh `options` for the current row) */
  onOpen?: () => void;
}

const buildClassNames = (
  ...classes: (string | boolean | undefined)[]
): string => classes.filter(Boolean).join(" ");

/**
 * AddWithDropdown: a circular "+" button that opens a menu of options to
 * pick from — e.g. adding a role chip to a user row.
 *
 * Usage:
 * <AddWithDropdown
 *   options={availableRoleOptions}
 *   onSelect={(option) => addRole(option)}
 *   dataTestId="user-role-add"
 *   ariaLabel="Add role"
 * />
 */
export const AddWithDropdown: React.FC<AddWithDropdownProps> = ({
  options = [],
  onSelect,
  disabled = false,
  ariaLabel = "Add",
  emptyMessage = "No options found",
  dataTestId = "add-with-dropdown",
  menuAlign = "start",
  className = "",
  onOpen,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useDropdownPosition(open, containerRef);

  useEffect(() => {
    setIsMounted(typeof document !== "undefined");
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = useCallback(
    (nextOpen: boolean) => {
      if (!disabled) {
        if (nextOpen) {
          onOpen?.();
        }
        setOpen(nextOpen);
      }
    },
    [disabled, onOpen]
  );

  const handleSelect = useCallback(
    (option: AddWithDropdownOption) => {
      if (option.disabled) return;
      onSelect(option);
      setOpen(false);
    },
    [onSelect]
  );

  const containerClassName = useMemo(
    () => buildClassNames("add-with-dropdown", className),
    [className]
  );
  const menuWidth = 256;
  const menuEndAlignedLeft = position
    ? position.left + position.width - menuWidth
    : 0;
  const menuLeft =
    menuAlign === "end" ? menuEndAlignedLeft : position?.left ?? 0;

  return (
    <div ref={containerRef} className={containerClassName} data-testid={dataTestId}>
      <Dropdown show={open} onToggle={handleToggle}>
        <Dropdown.Toggle
          as="button"
          type="button"
          disabled={disabled}
          className="add-with-dropdown-trigger"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          data-testid={`${dataTestId}-trigger`}
        >
          <AddIcon />
        </Dropdown.Toggle>
      </Dropdown>

      {isMounted && open && position &&
        createPortal(
          <div
            className="add-with-dropdown add-with-dropdown-portal"
            style={{
              position: "absolute",
              top: position.top,
              left: menuLeft,
              zIndex: 2000,
              width: `${menuWidth}px`,
              maxWidth: "calc(100vw - 1rem)",
            }}
          >
            <div
              ref={menuRef}
              className={buildClassNames(
                "add-with-dropdown-menu",
                menuAlign === "end" && "dropdown-menu-end"
              )}
              role="listbox"
              data-testid={`${dataTestId}-menu`}
            >
              {options.length > 0 ? (
                options.map((option) => (
                  <div
                    key={option.id}
                    role="option"
                    aria-selected={false}
                    aria-disabled={option.disabled}
                    onClick={() => handleSelect(option)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(option);
                      }
                    }}
                    tabIndex={option.disabled ? -1 : 0}
                    className={buildClassNames(
                      "add-with-dropdown-item",
                      option.disabled && "disabled"
                    )}
                    data-testid={`${dataTestId}-option-${option.id}`}
                  >
                    <div className="add-with-dropdown-item-header">
                      <span className="add-with-dropdown-item-name">
                        {option.name}
                      </span>
                      {option.badge && (
                        <span className="add-with-dropdown-item-badge">
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <div className="add-with-dropdown-item-description">
                        {option.description}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div
                  className="add-with-dropdown-empty"
                  data-testid={`${dataTestId}-empty`}
                >
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
