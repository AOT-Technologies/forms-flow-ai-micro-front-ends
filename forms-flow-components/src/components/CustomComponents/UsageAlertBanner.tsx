import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { V8CustomButton } from "./CustomButton";
import { CloseIcon, CircleAlertIcon } from "../SvgIcons";
import {
  formatResetLabel,
  getUsagePercentage,
  getUsageVariant,
  isOverLimit,
} from "../../helper/usageTracking";

/**
 * UsageAlertBanner is the submission-usage strip shown on the home page.
 * Usage:
 * <UsageAlertBanner usedSubmissions={720} maxSubmissions={1000} tenantJoinDate="2026-05-18" />
 */

export interface UsageAlertBannerProps {
  /** Submissions consumed in the current billing cycle */
  usedSubmissions: number;
  /** Submissions included in the current plan */
  maxSubmissions: number;
  /** Date the tenant was created - anchors the fallback reset countdown */
  tenantJoinDate?: string;
  /** Actual next reset date when known. Preferred over the synthetic cycle. */
  nextResetDate?: string;
  /** Upgrade CTA handler. Omit to render the button as a no-op. */
  onUpgrade?: () => void;
  /**
   * Render the upgrade CTA. Set false for viewers who can see usage but may not act on it
   * (e.g. tenant admins, where upgrading is reserved for the owner).
   */
  showUpgrade?: boolean;
  /** Allow the user to hide the banner for the session. Ignored once over the limit. */
  dismissible?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

// The design draws the strip icon at 20px with a 1.75 stroke. The glyph geometry is defined
// in a 16-unit viewBox, so the stroke is scaled down by 16/20 to render at 1.75.
const STRIP_ICON_STROKE_WIDTH = 1.4;

export const UsageAlertBanner: React.FC<UsageAlertBannerProps> = ({
  usedSubmissions,
  maxSubmissions,
  tenantJoinDate,
  nextResetDate,
  onUpgrade,
  showUpgrade = true,
  dismissible = true,
  className = "",
  dataTestId = "usage-alert-banner",
}) => {
  const { t } = useTranslation();
  // Session-only: dismissal is intentionally not persisted.
  const [isDismissed, setIsDismissed] = useState(false);

  if (!Number.isFinite(maxSubmissions) || maxSubmissions <= 0) return null;
  if (isDismissed) return null;

  const percentage = getUsagePercentage(usedSubmissions, maxSubmissions);
  const roundedPercentage = Math.round(percentage);
  const variant = getUsageVariant(percentage);
  const overLimit = isOverLimit(percentage);
  const resetLabel = formatResetLabel({ tenantJoinDate, nextResetDate }, t);
  const canDismiss = dismissible && !overLimit;

  const limitReachedText = t("You’ve reached your form submissions limit!");
  const resetsInText = resetLabel
    ? t("Your limit resets in {{resetLabel}}", { resetLabel })
    : "";

  // Single canonical sentence for assistive tech; the visible text is split into runs so the
  // percentage (or the headline) can carry its own weight and colour, as designed.
  const accessibleMessage = overLimit
    ? [limitReachedText, resetsInText].filter(Boolean).join(" ")
    : t("You’ve used {{percentage}}% of your form submission limit", {
        percentage: roundedPercentage,
      });

  return (
    <div
      className={buildClassNames(
        "ff-usage-banner",
        `ff-usage-banner--${overLimit ? "over-limit" : variant}`,
        className
      )}
      role="status"
      aria-live="polite"
      data-testid={dataTestId}
    >
      <div className="ff-usage-banner__content">
        <span className="ff-usage-banner__icon" aria-hidden="true">
          <CircleAlertIcon color="currentColor" strokeWidth={STRIP_ICON_STROKE_WIDTH} />
        </span>

        <span className="ff-usage-banner__message" aria-label={accessibleMessage}>
          {overLimit ? (
            <span aria-hidden="true">
              <span className="ff-usage-banner__headline">{limitReachedText}</span>
              {resetsInText ? ` ${resetsInText}` : ""}
            </span>
          ) : (
            <span aria-hidden="true">
              {`${t("You’ve used")} `}
              <span
                className={`ff-usage-banner__percentage ff-usage-banner__percentage--${variant}`}
                data-testid={`${dataTestId}-percentage`}
              >
                {`${roundedPercentage}%`}
              </span>
              {` ${t("of your form submission limit")}`}
            </span>
          )}
        </span>
      </div>

      {(showUpgrade || canDismiss) && (
        <div className="ff-usage-banner__actions">
          {showUpgrade && (
            <V8CustomButton
              variant="secondary"
              label="Upgrade"
              onClick={onUpgrade}
              className={`ff-usage-banner__cta ff-usage-banner__cta--${
                overLimit ? "over-limit" : variant
              }`}
              dataTestId={`${dataTestId}-upgrade`}
            />
          )}

          {canDismiss && (
            <button
              type="button"
              className="ff-usage-banner__dismiss"
              onClick={() => setIsDismissed(true)}
              aria-label={t("Dismiss")}
              data-testid={`${dataTestId}-dismiss`}
            >
              <CloseIcon color="currentColor" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UsageAlertBanner;
