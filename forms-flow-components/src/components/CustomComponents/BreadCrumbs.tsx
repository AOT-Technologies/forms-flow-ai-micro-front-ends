import React, { useMemo, memo } from "react";
import { Breadcrumb } from "react-bootstrap";

/**
 * BreadCrumbs is a flexible navigation component that displays the user's location within the application hierarchy.
 * 
 * Usage:
 * <BreadCrumbs items={breadcrumbItems} variant={BreadcrumbVariant.DEFAULT} />
 * <BreadCrumbs items={breadcrumbItems} variant={BreadcrumbVariant.MINIMIZED} underline />
 * <BreadCrumbs items={[{ label: "Home", path: "/" }, { label: "Current Page" }]} />
 */

/**
 * Represents a single breadcrumb item in the navigation trail
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string;
  /** Unique identifier used for tracking which breadcrumb item was clicked */
  id?: string;
}

/**
 * Visual style variants for the breadcrumb component
 */
export enum BreadcrumbVariant {
  /** Default variant - larger, darker text for primary navigation */
  DEFAULT = "default",
  /** Minimized variant - smaller, lighter text for secondary navigation */
  MINIMIZED = "minimized",
}

/**
 * Props for the BreadCrumbs component
 */
interface BreadCrumbsProps extends Omit<React.ComponentPropsWithoutRef<"nav">, 'children'> {
  /** Array of breadcrumb items to display in the navigation trail */
  items: BreadcrumbItem[];
  /** Visual style variant for the breadcrumb */
  variant?: BreadcrumbVariant;
  /** Whether to show underline on all breadcrumb items */
  underline?: boolean;
  /** Callback function invoked when a breadcrumb item is clicked — typically used to handle navigation */
  onBreadcrumbClick?: (item: BreadcrumbItem) => void;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the navigation landmark */
  ariaLabel?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Utility function to generate a unique, stable key for breadcrumb items
 */
const generateItemKey = (item: BreadcrumbItem, index: number): string => {
  // Use path if available for better stability, otherwise use label + index
  return item.id ? `breadcrumb-${item.id}` : `breadcrumb-${item.label}-${index}`;
};

/**
 * Enhanced BreadCrumbs component with improved accessibility, performance, and maintainability
 */
const BreadCrumbsComponent: React.FC<BreadCrumbsProps> = ({
  items,
  variant = BreadcrumbVariant.DEFAULT,
  underline = false,
  onBreadcrumbClick,
  dataTestId = "breadcrumbs",
  className = "",
  ariaLabel = "Breadcrumb navigation",
  ...restProps
}) => {
  
  // Memoized className to prevent unnecessary recalculations
  const breadcrumbClassName = useMemo(() => {
    return buildClassNames(
      "breadcrumb-custom",
      `breadcrumb-${variant}`,
      underline && "breadcrumb-underline",
      className
    );
  }, [variant, underline, className]);
  
  // Memoized check for valid items
  const hasValidItems = useMemo(() => {
    return items && items.length > 0;
  }, [items]);
  
  // Early return if no items provided
  if (!hasValidItems) {
    return null;
  }
  
  return (
    <Breadcrumb
      className={breadcrumbClassName}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      {...restProps}
    >
      {items.map((item, index) => (
        <Breadcrumb.Item
          linkAs="button"
          key={generateItemKey(item, index)}
          active={!underline && index === items.length - 1}
          linkProps={{
            type: "button",
            style: {
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              color: "inherit",
            },
          onClick: () => {
              if (onBreadcrumbClick) {
                onBreadcrumbClick(item);
              }
            },
          }}
          data-testid={`breadcrumb-item-${index}`}
          aria-label={`breadcrumb-${item.label}`}>
          <span className="breadcrumb-item-label" title={item.label}>
            {item.label}
          </span>
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

// Set display name for better debugging
BreadCrumbsComponent.displayName = "BreadCrumbs";

// Export memoized component for performance optimization
export const BreadCrumbs = memo(BreadCrumbsComponent);

// Default export for Storybook compatibility
export default BreadCrumbs;

// Export types for consumers
export type { BreadCrumbsProps };
