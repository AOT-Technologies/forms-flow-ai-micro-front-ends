import React, { useEffect, useMemo } from "react";
import { ProgressBar } from "react-bootstrap";
import { StyleServices } from "@formsflow/service";

interface CustomProgressBarProps {
  // Current progress value (0–100) → controls the width of the progress bar
  progress: number; 
  // Color type: passive=gray, error=orange, warning=red, default=primary; progress=50 → orange
  color?: "passive" | "error" | "warning";
}

export const CustomProgressBar: React.FC<CustomProgressBarProps> = ({
  progress,
  color,
}) => {
  // Map color prop to CSS variable
  const colorMap: Record<string, string> = {
    passive: "var(--gray-dark)",
    error: "var(--orange-100)",
    warning: "var(--red-100)",
    default: "var(--primary-dark)",
  };

  // Decide final color based on props and progress
  const cssVar = useMemo(() => {
    if (progress === 50) {
      return "var(--orange-100)"; // override at 50%
    }
    return color ? colorMap[color] || colorMap.default : colorMap.default;
  }, [progress, color]);

  // Only update CSS variable when cssVar changes
  useEffect(() => {
    StyleServices?.setCSSVariable("--progress-bar-bg-color", cssVar);
  }, [cssVar]);

  return <ProgressBar now={progress} aria-label="upload-status" max={100} />;
};
