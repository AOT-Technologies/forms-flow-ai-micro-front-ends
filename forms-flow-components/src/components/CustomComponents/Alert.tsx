import React, { FC, useEffect, useState } from "react";

interface AlertProps {
  message: string;
  variant?: "passive" | "focus" | "error" | "warning";
  dataTestId?: string;
  rightContent?: React.ReactNode;
  isShowing?: boolean; // ✅ single prop
}

export const Alert: FC<AlertProps> = ({
  message,
  variant = "focus",
  dataTestId = "app-alert",
  rightContent,
  isShowing = false,
}) => {
  const [shouldRender, setShouldRender] = useState(isShowing);

  useEffect(() => {
    if (isShowing) {
      setShouldRender(true); // Mount immediately
    } else {
      // Delay unmount until animation ends
      const timer = setTimeout(() => setShouldRender(false), 300); // Match CSS duration
      return () => clearTimeout(timer);
    }
  }, [isShowing]);

  if (!shouldRender) return null;

  return (
    <div
      className={`custom-alert custom-alert-${variant} ${
        isShowing ? "entering" : "leaving"
      }`}
      role="alert"
      data-testid={dataTestId}
    >
      <div className="custom-alert-left">
        <span className="custom-alert-text">{message}</span>
      </div>

      <div className="custom-alert-right">{rightContent}</div>
    </div>
  );
};
