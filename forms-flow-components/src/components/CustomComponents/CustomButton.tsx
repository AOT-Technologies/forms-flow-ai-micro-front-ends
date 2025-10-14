import React, { useCallback, forwardRef, memo } from "react";
import { useTranslation } from "react-i18next";

/**
 * CustomButton is a reusable, accessible button for forms-flow apps.
 * 
 * Usage:
 * <CustomButton variant="primary" label="submit" onClick={...} loading={...} icon={<Icon />} />
 * <CustomButton variant="secondary" label="cancel" onClick={...} />
 * <CustomButton variant="error" label="delete" onClick={...} />
 * <CustomButton variant="warning" label="proceed with caution" onClick={...} />
 * <CustomButton icon={<Icon />} iconOnly ariaLabel="Search" />
 */

type ButtonVariant = "primary" | "secondary" | "error" | "warning";
type ButtonSize = "small" | "medium" | "large"; // Size prop not implemented correctly.CSS missing for this.
type ButtonType = "button" | "submit" | "reset";

interface CustomButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, 'onClick' | 'disabled' | 'type'> {
  /** Button visual style variant */
  variant?: ButtonVariant;
  /** Button size - affects padding and font size */
  size?: ButtonSize;
  /** Button HTML type */
  type?: ButtonType;
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Button text label (translation key) */
  label?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Selected/active state for toggle buttons */
  selected?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Icon element to display */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Icon-only button (hides text label) */
  iconOnly?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading text override */
  loadingText?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced CustomButton component with improved accessibility, performance, and maintainability
 */
const V8CustomButtonComponent = forwardRef<HTMLButtonElement, CustomButtonProps>(({
  label = "",
  variant = "secondary",
  size = "medium",
  type = "button",
  loading = false,
  disabled = false,
  ariaLabel,
  selected = false,
  onClick,
  dataTestId,
  icon,
  className = "",
  iconOnly = false,
  fullWidth = false,
  loadingText,
  name,
  id,
  ...restProps
}, ref) => {
  const { t } = useTranslation();
  
  // Memoized click handler for better performance
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent interaction when disabled or loading
    if (disabled || loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    
    onClick?.(event);
  }, [disabled, loading, onClick]);
  
  // Computed values
  const isInteractionDisabled = disabled || loading;
  const translatedLabel = label ? t(label) : "";
  const effectiveAriaLabel = ariaLabel || translatedLabel || "Button";
  const displayText = loading && loadingText ? t(loadingText) : translatedLabel;
  
  // Build className string
  const buttonClassName = buildClassNames(
    "custom-button",
    `custom-button--${variant}`,
    size !== "medium" && `custom-button--${size}`,
    loading && "is-loading",
    disabled && "is-disabled", 
    selected && "is-selected",
    fullWidth && "w-100",
    iconOnly && "icon-only",
    className
  );
  
  return (
    <button
      ref={ref}
      id={id}
      name={name}
      type={type}
      className={buttonClassName}
      disabled={isInteractionDisabled}
      onClick={handleClick}
      data-testid={dataTestId}
      aria-label={effectiveAriaLabel}
      aria-disabled={isInteractionDisabled}
      aria-pressed={selected ? "true" : "false"}
      aria-busy={loading ? "true" : "false"}
      {...restProps}
    >
      {loading && (
        <span 
          className="button-spinner" 
          aria-hidden="true"
          role="status"
        />
      )}
      
      {!loading && icon && (
        <span className="button-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      
      {!iconOnly && (
        <span className="button-text">
          {displayText}
        </span>
      )}
    </button>
  );
});

// Set display name for better debugging
V8CustomButtonComponent.displayName = "V8CustomButton";

// Export memoized component for performance optimization
export const V8CustomButton = memo(V8CustomButtonComponent);

// Export types for consumers
export type { CustomButtonProps, ButtonVariant, ButtonSize, ButtonType };
