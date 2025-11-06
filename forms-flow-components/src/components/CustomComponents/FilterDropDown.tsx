import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, memo } from "react";
import { Dropdown } from "react-bootstrap";
import { DownArrowIcon, EditIconforFilter, UpArrowIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";
import { CustomSearch } from "./Search";

/**
 * Filter item interface for FilterDropDown component
 */
export interface FilterItemType {
  /** Content to display (can include icons and labels) */
  content: React.ReactNode;
  /** Callback function when item is clicked */
  onClick: (type?: string) => void;
  /** Type identifier for the item */
  type?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Additional CSS class names */
  className?: string;
  /** Category for grouping (used in Task Filter) */
  category?: "my" | "shared" | "action" | "none";
  /** Called when edit icon is clicked for an item (my/shared) */
  onEdit?: () => void;
}

/**
 * Filter dropdown variant type
 */
export type FilterDropdownVariant = "task" | "field";

/**
 * Props for `FilterDropDown` component.
 * Specialized dropdown for task and field filters with categorization and search.
 */
export interface FilterDropDownProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange"> {
  /** Array of filter items to display */
  items: FilterItemType[];
  /** Label to display on the button */
  label: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Whether to show search functionality */
  searchable?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** Callback when search term changes */
  onSearch?: (searchTerm: string) => void;
  /** HTML id attribute for the dropdown */
  id?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Visual variant of the dropdown ('task' or 'field') */
  variant?: FilterDropdownVariant;
  /** Whether to categorize items (for task filter) */
  categorize?: boolean;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (
  ...classes: (string | false | null | undefined)[]
): string => classes.filter(Boolean).join(" ");

/**
 * FilterDropDown: Specialized dropdown component for task and field filters.
 *
 * Usage:
 * <FilterDropDown
 *   items={filterItems}
 *   label="All Tasks (10)"
 *   searchable={true}
 *   variant="task"
 *   categorize={true}
 *   extraActionIcon={<PencilIcon />}
 *   extraActionOnClick={() => console.log('Edit')}
 * />
 */
const FilterDropDownComponent = forwardRef<HTMLDivElement, FilterDropDownProps>(
  (
    {
      items = [],
      label,
      disabled = false,
      searchable = false,
      searchPlaceholder = "Search",
      onSearch,
      id = "",
      dataTestId = "",
      ariaLabel = "",
      className = "",
      variant = "task",
      categorize = false,
      ...restProps
    },
    ref
  ) => {
    // State management
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Refs for DOM manipulation
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Handle search term change
    const handleSearchChange = useCallback(
      (value: string) => {
        setSearchTerm(value);
        onSearch?.(value);
      },
      [onSearch]
    );

    // Clear search when dropdown closes
    useEffect(() => {
      if (!isOpen) {
        setSearchTerm("");
        onSearch?.("");
      }
    }, [isOpen, onSearch]);

    // Memoized toggle handler
    const handleToggle = useCallback(
      (nextShow: boolean) => {
        if (!disabled) {
          setIsOpen(nextShow);
        }
      },
      [disabled]
    );

    // both fucntions will be used later if needed
    // TODO: remove this later if not needed

    // Memoized keyboard event handler for extra action
    // const handleExtraActionKeyDown = useCallback(
    //   (event: React.KeyboardEvent): void => {
    //     if (disabled || !extraActionOnClick) return;

    //     if (event.key === "Enter" || event.key === " ") {
    //       event.preventDefault();
    //       event.stopPropagation();
    //       extraActionOnClick();
    //     }
    //   },
    //   [disabled, extraActionOnClick]
    // );

    // // Memoized extra action click handler
    // const handleExtraActionClick = useCallback(
    //   (event: React.MouseEvent): void => {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     extraActionOnClick?.();
    //   },
    //   [extraActionOnClick]
    // );


    // Single CSS variable for edit icon color across variants
    const editIconColor = StyleServices.getCSSVariable("--gray-dark");
    // Categorize items for Task Filter
    const categorizedItems = useMemo(() => {
      if (!categorize) return { uncategorized: items };

      const myFilters: FilterItemType[] = [];
      const sharedFilters: FilterItemType[] = [];
      const actionItems: FilterItemType[] = [];
      const noneItems: FilterItemType[] = [];

      for (const item of items) {
        switch (item.category) {
          case "my":
            myFilters.push(item);
            break;
          case "shared":
            sharedFilters.push(item);
            break;
          case "action":
            actionItems.push(item);
            break;
          case "none":
            noneItems.push(item);
            break;
          default:
            // If no category specified, treat as regular item
            myFilters.push(item);
        }
      }

      return { myFilters, sharedFilters, actionItems, noneItems };
    }, [items, categorize]);

    // Render categorized items
    const renderCategorizedItems = useCallback(() => {
      const { myFilters, sharedFilters, actionItems, noneItems } = categorizedItems;

      return (
        <>
          {/* Action items (Create, Reorder, etc.) - at the top */}
          {actionItems && actionItems.length > 0 && (
            <>
              {actionItems.map((item, index) => (
                <Dropdown.Item
                  key={`action-${item.type}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    item.onClick(item.type);
                  }}
                  data-testid={item.dataTestId}
                  aria-label={item.ariaLabel}
                  className={buildClassNames(
                    "filter-dropdown-item",
                    item.className
                  )}
                >
                  <div className="filter-dropdown-item-content">
                    <span className="filter-dropdown-item-label">
                      {item.content}
                    </span>
                  </div>
                </Dropdown.Item>
              ))}
            </>
          )}

          {noneItems && noneItems.length > 0 && (
            <>
              {noneItems.map((item, index) => (
                <Dropdown.Item
                  key={`none-${item.dataTestId}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    item.onClick(item.type);
                  }}
                  data-testid={item.dataTestId}
                  aria-label={item.ariaLabel}
                  className={buildClassNames(
                    "filter-dropdown-item",
                    item.className
                  )}
                  disabled={item.type === "none"}
                >
                  <div className="filter-dropdown-item-content">
                    <span className="filter-dropdown-item-label">
                      {item.content}
                    </span>
                  </div>
                </Dropdown.Item>
              ))}
            </>
          )}

          {/* Divider after action items and none items */}
          {((actionItems && actionItems.length > 0) ||
            (noneItems && noneItems.length > 0)) &&
            ((myFilters && myFilters.length > 0) ||
              (sharedFilters && sharedFilters.length > 0)) && (
              <Dropdown.Divider />
            )}
          
          {/* Search section if only my filters or shared filters are present */}
          
          {searchable && ((myFilters && myFilters.length > 0) ||
              (sharedFilters && sharedFilters.length > 0)) && (
              <div className="filter-dropdown-search">
                <CustomSearch
                  search={searchTerm}
                  setSearch={handleSearchChange}
                  handleSearch={() => {}}
                  placeholder={searchPlaceholder}
                  dataTestId={`${dataTestId}-search`}
                />
              </div>
            )}

          {/* My Filters section */}
          {myFilters && myFilters.length > 0 && (
            <>
              <div className="filter-dropdown-section-header">
                My filters (unique to me)
              </div>
              {myFilters.map((item, index) => (
                <Dropdown.Item
                  key={`my-${item.type}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    item.onClick(item.type);
                  }}
                  data-testid={item.dataTestId}
                  aria-label={item.ariaLabel}
                  className={buildClassNames(
                    "filter-dropdown-item",
                    item.className
                  )}
                >
                  <div className="d-flex align-items-center justify-content-between ">
                    <span className="filter-dropdown-item-label">
                      {item.content}
                    </span>
                    {item.onEdit && (
                      <EditIconforFilter
                        color={editIconColor}
                        aria-label={
                          item.ariaLabel ? `${item.ariaLabel} - edit` : "Edit"
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.onEdit?.();
                        }}
                        data-testid={`${item.dataTestId}-edit`}
                      />
                    )}
                  </div>
                </Dropdown.Item>
              ))}
            </>
          )}

          {/* Divider between My Filters and Shared Filters */}
          {myFilters &&
            myFilters.length > 0 &&
            sharedFilters &&
            sharedFilters.length > 0 && <Dropdown.Divider />}

          {/* Shared Filters section */}
          {sharedFilters && sharedFilters.length > 0 && (
            <>
              <div className="filter-dropdown-section-header">
                Shared filters
              </div>
              {sharedFilters.map((item, index) => (
                <Dropdown.Item
                  key={`shared-${item.type}-${index}`}
                  onClick={(e) => {
                    e.preventDefault();
                    item.onClick(item.type);
                  }}
                  data-testid={item.dataTestId}
                  aria-label={item.ariaLabel}
                  className={buildClassNames(
                    "filter-dropdown-item",
                    item.className
                  )}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="filter-dropdown-item-label">
                      {item.content}
                    </span>
                    {item.onEdit && (
                      <EditIconforFilter
                        color={editIconColor}
                        data-testid={`${item.dataTestId}-edit`}
                        aria-label={
                          item.ariaLabel ? `${item.ariaLabel} - edit` : "Edit"
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.onEdit?.();
                        }}
                      />
                    )}
                  </div>
                </Dropdown.Item>
              ))}
            </>
          )}
        </>
      );
    }, [categorizedItems, variant]);

    // Render uncategorized items
    const renderUncategorizedItems = useCallback(() => {
      const { uncategorized } = categorizedItems;
      
      if (!uncategorized || uncategorized.length === 0) return null;

      return (
        <>
          {uncategorized.map((item, index) => (
            <Dropdown.Item
              key={`item-${item.type}-${index}`}
              onClick={(e) => {
                e.preventDefault();
                item.onClick(item.type);
              }}
              data-testid={item.dataTestId}
              aria-label={item.ariaLabel}
              className={buildClassNames("filter-dropdown-item", item.className)}
            >
              <div className="filter-dropdown-item-content">
                <span className="filter-dropdown-item-label">{item.content}</span>
              </div>
            </Dropdown.Item>
          ))}
        </>
      );
    }, [categorizedItems]);

    // Memoized arrow icon renderer
    const renderArrowIcon = useCallback(() => {
      const iconColor = disabled ? "#c5c5c5" : "#4a4a4a";
      return isOpen ? (
        <UpArrowIcon color="#4a4a4a" />
      ) : (
        <DownArrowIcon color={iconColor} />
      );
    }, [disabled, isOpen]);

    // Memoized container className
    const containerClassName = useMemo(
      () =>
        buildClassNames(
          "filter-dropdown-container",
          `filter-dropdown-container--${variant}`,
          className
        ),
      [className, variant]
    );

    return (
      <div
        ref={(node) => {
          dropdownRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={containerClassName}
        data-testid={dataTestId}
        {...restProps}
      >
        <Dropdown show={isOpen} onToggle={handleToggle}>
          <div className="filter-dropdown-button-group">
            <button
              ref={buttonRef}
              className={buildClassNames(
                "filter-dropdown-button",
                `filter-dropdown-button--${variant}`,
                disabled && "disabled"
              )}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-label={ariaLabel}
              id={id}
              data-testid={`${dataTestId}-button`}
              type="button"
            >
              <span className="filter-dropdown-label" title={label}>
                {label}
              </span>
            </button>

            {/* {extraActionIcon && (
              <button
                className={buildClassNames(
                  "filter-dropdown-extra-action",
                  `filter-dropdown-extra-action--${variant}`,
                  disabled && "disabled"
                )}
                onClick={handleExtraActionClick}
                onKeyDown={handleExtraActionKeyDown}
                disabled={disabled}
                aria-label={extraActionAriaLabel}
                data-testid={`${dataTestId}-extra-action`}
                type="button"
              >
                {extraActionIcon}
              </button>
            )} */}

            <button
              className={buildClassNames(
                "filter-dropdown-toggle",
                `filter-dropdown-toggle--${variant}`,
                disabled && "disabled"
              )}
              onClick={() => !disabled && setIsOpen(!isOpen)}
              disabled={disabled}
              aria-label={`Toggle ${label}`}
              data-testid={`${dataTestId}-toggle`}
              type="button"
            >
              {renderArrowIcon()}
            </button>
          </div>

          <Dropdown.Menu
            className={buildClassNames(
              "filter-dropdown-menu",
              `filter-dropdown-menu--${variant}`
            )}
          >
            <div className="filter-dropdown-items">
              {categorize ? renderCategorizedItems() : renderUncategorizedItems()}
            </div>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    );
  }
);

// Set display name for better debugging
FilterDropDownComponent.displayName = "FilterDropDown";

// Export memoized component for performance optimization
export const FilterDropDown = memo(FilterDropDownComponent);

// Export types for consumers  
export type {
  FilterDropDownProps as FilterDropDownPropsType,
  FilterItemType as FilterDropDownItemType,
};

