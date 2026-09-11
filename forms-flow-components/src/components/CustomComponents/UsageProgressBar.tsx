import React from "react";
import { useTranslation } from "react-i18next";
import { getUsagePercentage, getUsageVariant } from "../../helper/usageTracking";

/**
 * UsageProgressBar renders submission consumption as a coloured bar.
 *
 * The colour band is derived internally from used/max - there is deliberately no colour prop,
 * so a parent can never put the bar out of step with the numbers next to it.
 * 0-69% green, 70-89% yellow, 90%+ red.
 *
 * Usage:
 * <UsageProgressBar usedSubmissions={720} maxSubmissions={1000} plan="Go" />
 */

export interface UsageProgressBarProps {
  /** Submissions consumed in the current billing cycle */
  usedSubmissions: number;
  /** Submissions included in the current plan */
  maxSubmissions: number;
  /** Plan label, used only to build the accessible name */
  plan?: string;
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

export const UsageProgressBar: React.FC<UsageProgressBarProps> = ({
  usedSubmissions,
  maxSubmissions,
  plan,
  className = "",
  dataTestId = "usage-progress-bar",
}) => {
  const { t } = useTranslation();

  if (!Number.isFinite(maxSubmissions) || maxSubmissions <= 0) return null;

  const percentage = getUsagePercentage(usedSubmissions, maxSubmissions);
  const variant = getUsageVariant(percentage);
  // Clamped separately from the displayed figure so going over the limit fills the bar
  // instead of overflowing the card.
  const fillWidth = Math.min(100, Math.max(0, percentage));

  const ariaLabel = plan
    ? t("{{plan}} plan form submission usage", { plan })
    : t("Form submission usage");

  return (
    <div
      className={buildClassNames("ff-usage-bar", className)}
      data-testid={dataTestId}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      style={{ "--ff-usage-fill": `${fillWidth}%` } as React.CSSProperties}
    >
      <div
        className={`ff-usage-bar__fill ff-usage-bar__fill--${variant}`}
        aria-hidden="true"
      />
    </div>
  );
};

export default UsageProgressBar;
