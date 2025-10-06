import React, { useCallback, useMemo, forwardRef, memo, useState, useEffect } from "react";
import { SwitchTickIcon, SwitchCrossIcon } from "../SvgIcons";
import { StyleServices } from "@formsflow/service";

/**
 * Switch is a reusable, accessible toggle switch for forms-flow apps.
 * 
 * Usage:
 * <Switch checked={true} onChange={handleChange} label="Enable notifications" />
 * <Switch type="primary" withIcon={true} onChange={handleChange} />
 * <Switch type="binary" checked={false} onChange={handleChange} />
 */

type SwitchVariant = "default" | "primary" | "binary";

/**
 * Props for the Switch component
 */
interface SwitchProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children' | 'onChange'> {
  /** Whether the switch is checked/on */
  checked?: boolean;
  /** Disables the switch */
  disabled?: boolean;
  /** Shows icon inside the switch */
  withIcon?: boolean;
  /** Callback when switch state changes */
  onChange?: (checked: boolean) => void;
  /** HTML id attribute for the switch */
  id?: string;
  /** Additional CSS classes */
  className?: string;
  /** Label text for the switch */
  label?: string;
  /** Switch visual style variant */
  type?: SwitchVariant;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced Switch component with improved accessibility, performance, and maintainability
 */
const SwitchComponent = forwardRef<HTMLDivElement, SwitchProps>(({
  checked = false,
  disabled = false,
  withIcon = false,
  onChange,
  id,
  className = "",
  label,
  type = "default",
  ...restProps
}, ref) => {
  
  // Internal state for controlled/uncontrolled behavior
  const [isChecked, setIsChecked] = useState(checked);
  
  // Sync internal state with prop changes
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);
  
  // Memoized color variables for better performance
  const colors = useMemo(() => ({
    success: StyleServices.getCSSVariable('--ff-success'), // #00C49A
    primaryLight: StyleServices.getCSSVariable('--ff-primary-light'), // #B8ABFF
    danger: StyleServices.getCSSVariable('--ff-danger'), // #E57373
    grayLight: StyleServices.getCSSVariable('--ff-gray-light'), // #E5E5E5
  }), []);

  // Memoized icon rendering for better performance
  const renderIcon = useCallback(() => {
    if (!withIcon) return null;

    let fillColor = colors.success;

    if (isChecked) {
      if (type === 'primary') fillColor = colors.primaryLight;
      return (
        <span className="custom-switch-icon" aria-hidden="true">
          <SwitchTickIcon fillColor={fillColor} />
        </span>
      );
    } else {
      if (type === 'binary') fillColor = colors.danger;
      else fillColor = colors.grayLight;
      return (
        <span className="custom-switch-icon" aria-hidden="true">
          <SwitchCrossIcon fillColor={fillColor} />
        </span>
      );
    }
  }, [isChecked, type, withIcon, colors]);

  // Memoized click handler for better performance
  const handleToggle = useCallback(() => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  }, [disabled, onChange, isChecked]);

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  }, [disabled, handleToggle]);

  // Memoized focus handlers
  const handleFocus = useCallback(() => {
    // Focus handling can be added here if needed
  }, []);

  const handleBlur = useCallback(() => {
    // Blur handling can be added here if needed
  }, []);

  // Memoized switch className
  const switchClassName = useMemo(() => {
    return buildClassNames(
      "custom-switch",
      isChecked && type === 'primary' && "custom-switch-on-primary",
      isChecked && type !== 'primary' && "custom-switch-on",
      !isChecked && type === 'binary' && "custom-switch-off-binary",
      !isChecked && type !== 'binary' && "custom-switch-off",
      disabled && "custom-switch-disabled"
    );
  }, [isChecked, type, disabled]);

  // Memoized wrapper className
  const wrapperClassName = useMemo(() => {
    return buildClassNames(
      "custom-switch-wrapper",
      className
    );
  }, [className]);

  // Generate secure random ID using crypto API
  const generateSecureId = useCallback(() => {
    try {
      // Client side - use crypto API
      const crypto = globalThis.crypto || globalThis.msCrypto;
      if (crypto && crypto.getRandomValues) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(36);
      }
    } catch (error) {
      console.warn('Crypto API not available, falling back to timestamp');
    }
    // Fallback to timestamp-based ID
    return Date.now().toString(36);
  }, []);

  // Computed values
  const effectiveId = id || `switch-${generateSecureId()}`;
  const labelId = `${effectiveId}-label`;
  const isInteractionDisabled = disabled;

  return (
    <div
      ref={ref}
      className={wrapperClassName}
      {...restProps}
    >
      {label && (
        <label 
          htmlFor={effectiveId} 
          id={labelId}
          className="custom-switch-label"
        >
          {label}
        </label>
      )}
      <button
        type="button"
        id={effectiveId}
        role="switch"
        aria-checked={isChecked}
        aria-disabled={isInteractionDisabled}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? 'Toggle switch' : undefined}
        tabIndex={isInteractionDisabled ? -1 : 0}
        className={switchClassName}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isInteractionDisabled}
      >
        <span className="custom-switch-slider">
          {renderIcon()}
        </span>
      </button>
    </div>
  );
});

// Set display name for better debugging
SwitchComponent.displayName = "Switch";

// Export memoized component for performance optimization
export const Switch = memo(SwitchComponent);

// Export types for consumers
export type { SwitchProps, SwitchVariant };