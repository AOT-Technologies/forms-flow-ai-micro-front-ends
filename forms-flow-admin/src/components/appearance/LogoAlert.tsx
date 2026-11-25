import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const DISPLAY_MS = 5000;
// Figma 30551:2450: floats over the top-left corner of the preview panel.
const OFFSET_LEFT = 28;
const OFFSET_TOP = -23;

interface LogoAlertProps {
  // A new object for every error, so the same message can show again.
  error: { message: string } | null;
  onDismiss: () => void;
}

// Portaled to <body> so it sits above the live-preview iframe, which also
// floats on <body>.
const LogoAlert: React.FC<LogoAlertProps> = ({ error, onDismiss }) => {
  const { t } = useTranslation();
  const [position, setPosition] = useState<{ top: number; left: number }>();

  useEffect(() => {
    if (!error) return undefined;
    const panel = document.querySelector(".ff-appearance-live");
    const rect = panel?.getBoundingClientRect();
    setPosition(
      rect
        ? { top: rect.top + OFFSET_TOP, left: rect.left + OFFSET_LEFT }
        : { top: 16, left: 16 }
    );
    const timer = window.setTimeout(onDismiss, DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [error, onDismiss]);

  if (!error || !position) return null;

  return createPortal(
    <div
      className="ff-logo-alert"
      style={position}
      role="alert"
      data-testid="appearance-logo-alert"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="8" y2="12" />
        <line x1="12" x2="12.01" y1="16" y2="16" />
      </svg>
      <span>
        {/* Not t("Error:"): i18next reads ":" as a namespace separator. */}
        <span className="ff-logo-alert__label">{`${t("Error")}:`}</span>{" "}
        {error.message}
      </span>
    </div>,
    document.body
  );
};

export default LogoAlert;
