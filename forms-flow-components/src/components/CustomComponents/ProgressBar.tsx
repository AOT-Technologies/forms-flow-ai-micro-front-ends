import React, { forwardRef, memo, useMemo } from "react";

/**
 * CustomProgressBar is a reusable, accessible progress bar for forms-flow apps.
 * 
 * Usage:
 * <CustomProgressBar progress={75} color="primary" />
 * <CustomProgressBar progress={50} color="error" />
 * <CustomProgressBar progress={100} />
 */

type ProgressColor = "passive" | "error" | "warning";

interface CustomProgressBarProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children'> {
  /** Current progress value (0-100) - controls the width of the progress bar */
  progress: number;
  /** Color variant for the progress bar */
  color?: ProgressColor;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Minimum width of the progress bar container */
  minWidth?: string;
  /** Height of the progress bar */
  height?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced CustomProgressBar component with improved accessibility, performance, and maintainability
 */
const CustomProgressBarComponent = forwardRef<HTMLDivElement, CustomProgressBarProps>(({
  progress,
  color,
  ariaLabel = "Progress",
  dataTestId,
  className = "",
  minWidth = "200px",
  height = "20px",
  ...restProps
}, ref) => {
  
  // Memoized color calculation for better performance
  const progressColor = useMemo(() => {
    // Special case: 50% progress always shows orange
    if (progress === 50) {
      return "var(--orange-100, #fd7e14)";
    }
    
    // Map color prop to CSS variables with fallbacks
    const colorMap: Record<string, string> = {
      passive: "var(--gray-dark, #6c757d)",
      error: "var(--orange-100, #fd7e14)",
      warning: "var(--red-100, #dc3545)",
      default: "var(--primary-dark, #0d6efd)",
    };
    
    return color ? colorMap[color] || colorMap.default : colorMap.default;
  }, [progress, color]);

  // Memoized container styles
  const containerStyle = useMemo(() => ({
    width: '100%',
    minWidth,
  }), [minWidth]);

  // Memoized progress bar styles
  const progressBarStyle = useMemo(() => ({
    width: `${Math.min(100, Math.max(0, progress))}%`, // Clamp between 0-100
    backgroundColor: progressColor,
    transition: 'width 0.3s ease',
  }), [progress, progressColor]);

  // Memoized track styles
  const trackStyle = useMemo(() => ({
    height,
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
  }), [height]);

  // Build className string
  const progressClassName = buildClassNames(
    "custom-progress-bar",
    color && `custom-progress-bar--${color}`,
    className
  );

  return (
    <div 
      ref={ref}
      className={progressClassName}
      style={containerStyle}
      data-testid={dataTestId}
      {...restProps}
    >
      <div 
        className="progress" 
        style={trackStyle}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div 
          className="progress-bar" 
          style={progressBarStyle}
          aria-hidden="true"
        />
      </div>
    </div>
  );
});

// Set display name for better debugging
CustomProgressBarComponent.displayName = "CustomProgressBar";

// Export memoized component for performance optimization
export const CustomProgressBar = memo(CustomProgressBarComponent);

// Export types for consumers
export type { CustomProgressBarProps, ProgressColor };