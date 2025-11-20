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
  /** Category key for grouping */
  category?: string;
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
  /** Optional mapping from category key to display label */
  categoryLabels?: Record<string, string>;
  /** Optional ordering of categories (excluding "action" and "none") */
  categoryOrder?: string[];
  /** Make action items (e.g., Add additional fields) sticky at the top */
  stickyActions?: boolean;
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
      categoryLabels,
      categoryOrder,
      stickyActions = false,
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
    // Categorize items
    const categorizedItems = useMemo(() => {
      if (!categorize) return { uncategorized: items };

      const actionItems: FilterItemType[] = [];
      const noneItems: FilterItemType[] = [];
      const byCategory: Record<string, FilterItemType[]> = {};

      for (const item of items) {
        const cat = item.category || "none";
        if (cat === "action") {
          actionItems.push(item);
          continue;
        }
        if (cat === "none") {
          noneItems.push(item);
          continue;
        }
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(item);
      }

      return { byCategory, actionItems, noneItems };
    }, [items, categorize]);

    // Render categorized items
    const renderCategorizedItems = useCallback(() => {
      const { byCategory, actionItems, noneItems } = categorizedItems as {
        byCategory: Record<string, FilterItemType[]>;
        actionItems: FilterItemType[];
        noneItems: FilterItemType[];
      };

      const hasContentBelow =
        (Object.keys(byCategory || {}).length > 0) ||
        (noneItems && noneItems.length > 0);

      const header = (
        <>
          {actionItems && actionItems.length > 0 && (
            <div
              className={buildClassNames(
                "filter-dropdown-actions",
                stickyActions && "sticky-actions"
              )}
            >
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
              {hasContentBelow && <Dropdown.Divider />}
            </div>
          )}
        </>
      );

      const body = (
        <>
          {/* Search section when there are grouped or none items */}
          {searchable && hasContentBelow && (
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

          {/* Render dynamic category sections */}
          {(() => {
            const categoryKeys = Object.keys(byCategory || {});
            if (categoryKeys.length === 0) return null;

            // Determine iteration order
            const orderedKeys = categoryOrder && categoryOrder.length
              ? categoryOrder.filter((k) => categoryKeys.includes(k)).concat(
                  categoryKeys.filter((k) => !categoryOrder.includes(k))
                )
              : categoryKeys;

            return (
              <>
                {orderedKeys.map((catKey, idx) => {
                  const list = byCategory[catKey] || [];
                  if (!list.length) return null;
                  const header = categoryLabels?.[catKey] ?? catKey;
                  return (
                    <React.Fragment key={`cat-${catKey}`}>
                      <div className="filter-dropdown-section-header">
                        {header}
                      </div>
                      {list.map((item, index) => (
                        <Dropdown.Item
                          key={`${catKey}-${item.type}-${index}`}
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
                      {idx < orderedKeys.length - 1 && <Dropdown.Divider />}
                    </React.Fragment>
                  );
                })}
              </>
            );
          })()}
        </>
      );

      if (!stickyActions) {
        return (
          <>
            {header}
            {body}
          </>
        );
      }

      return (
        <>
          {header}
          <div className="filter-dropdown-scroll">
            {body}
          </div>
        </>
      );
    }, [categorizedItems, variant, categoryLabels, categoryOrder, searchable, searchTerm, handleSearchChange, searchPlaceholder, dataTestId, editIconColor]);

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

