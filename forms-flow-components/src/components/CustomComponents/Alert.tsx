import React, { forwardRef, memo, useState, useEffect } from "react";

/**
 * Alert is a reusable, accessible alert component for forms-flow apps.
 * 
 * Usage:
 * <Alert message="Success message" variant="focus" isShowing={true} />
 * <Alert message="Error occurred" variant="error" rightContent={<Button />} />
 * <Alert message="Warning" variant="warning" isShowing={true} />
 */

// Alert variants enum
export enum AlertVariant {
  PASSIVE = "passive",
  FOCUS = "focus", 
  ERROR = "error",
  WARNING = "warning",
}

/**
 * Props for the Alert component
 */
interface AlertProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children'> {
  /** Alert message text to display */
  message: string;
  /** Alert visual style variant */
  variant?: AlertVariant;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Additional content to display on the right side */
  rightContent?: React.ReactNode;
  /** Controls whether the alert is visible */
  isShowing?: boolean;
  /** Automatically close the alert after timeout */
  autoClose?: boolean;
  /** Timeout in milliseconds for auto-close (default: 5000ms) */
  displayTime?: number;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced Alert component with improved accessibility, performance, and maintainability
 */
const AlertComponent = forwardRef<HTMLDivElement, AlertProps>(({
  message,
  variant = AlertVariant.FOCUS,
  dataTestId = "app-alert",
  rightContent,
  isShowing = false,
  autoClose = false,
  displayTime = 5000,
  className = "",
  ...restProps
}, ref) => {
  // Internal state to manage visibility when autoClose is enabled
  const [isVisible, setIsVisible] = useState(isShowing);

  // Handle auto-close functionality
  useEffect(() => {
    if (autoClose && isShowing) {
      // Reset visibility when isShowing becomes true
      setIsVisible(true);
      
      // Set timeout to hide the alert
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, displayTime);

      // Cleanup timer on unmount or when dependencies change
      return () => {
        clearTimeout(timer);
      };
    } else {
      // If autoClose is false, sync with isShowing prop
      setIsVisible(isShowing);
    }
  }, [autoClose, isShowing, displayTime]);

  // If alert is not showing, render nothing
  if (!isVisible) return null;
  
  // Build className string
  const alertClassName = buildClassNames(
    "custom-alert",
    `custom-alert-${variant}`,
    isVisible && "entering",
    !isVisible && "leaving",
    className
  );
  
  return (
    <div
      ref={ref}
      className={alertClassName}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={dataTestId}
      {...restProps}
    >
      {/* Left section: message area */}
      <div
        className="custom-alert-left"
        data-testid={`${dataTestId}-left`}
        aria-label="alert-message"
      >
        <span className="custom-alert-text">{message}</span>
      </div>

      {/* Right section: actions or extra content */}
      {rightContent && (
        <div
          className="custom-alert-right"
          data-testid={`${dataTestId}-right`}
          aria-label="alert-action"
        >
          {rightContent}
        </div>
      )}
    </div>
  );
});

// Set display name for better debugging
AlertComponent.displayName = "Alert";

// Export memoized component for performance optimization
export const Alert = memo(AlertComponent);

// Export types for consumers
export type { AlertProps };
