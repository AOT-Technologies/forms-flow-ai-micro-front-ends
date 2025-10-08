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
  /** Optional navigation path - if omitted, item is not clickable */
  path?: string;
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
  return item.path ? `breadcrumb-${item.path}` : `breadcrumb-${item.label}-${index}`;
};

/**
 * Enhanced BreadCrumbs component with improved accessibility, performance, and maintainability
 */
const BreadCrumbsComponent: React.FC<BreadCrumbsProps> = ({
  items,
  variant = BreadcrumbVariant.DEFAULT,
  underline = false,
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
      {items.map((item, index) => {
        const isLastItem = index === items.length - 1;
        const isClickable = !isLastItem && Boolean(item.path);
        
        return (
          <Breadcrumb.Item
            key={generateItemKey(item, index)}
            href={isClickable ? item.path : undefined}
            active={isLastItem}
            data-testid={`${dataTestId}-item-${index}`}
            aria-label={`Navigate to ${item.label}`}
            aria-current={isLastItem ? "page" : undefined}
          >
            {item.label}
          </Breadcrumb.Item>
        );
      })}
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
