import React, { FC } from "react";

interface AlertProps {
  message: string;
  variant?: "passive" | "focus" | "error" | "warning";
  dataTestId?: string; // Main test id for the container
  rightContent?: React.ReactNode;
  isShowing?: boolean;
}

export const Alert: FC<AlertProps> = ({
  message,
  variant = "focus",
  dataTestId = "app-alert",
  rightContent,
  isShowing = false,
}) => {

  // If alert is not showing, render nothing
  if (!isShowing) return null;

  return (
    <div
      // Main alert container
      className={`custom-alert custom-alert-${variant} ${
        isShowing ? "entering" : "leaving"
      }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={dataTestId}
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
};
