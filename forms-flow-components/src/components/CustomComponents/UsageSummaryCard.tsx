import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { UsageProgressBar } from "./UsageProgressBar";
import { V8CustomButton } from "./CustomButton";
import { CircleAlertIcon } from "../SvgIcons";
import {
  BILLING_CYCLE_DAYS,
  formatBillingDate,
  formatResetLabel,
  getUsageCtaLabel,
  getUsagePercentage,
  getUsageVariant,
  isOverLimit,
} from "../../helper/usageTracking";

/**
 * UsageSummaryCard is the full submission-usage panel used on the organization page.
 *
 * Usage:
 * <UsageSummaryCard plan="Go" usedSubmissions={720} maxSubmissions={1000} tenantJoinDate="2026-05-18" />
 */

export interface UsageSummaryCardProps {
  /** Display label for the current plan, e.g. "Go" or "Professional" */
  plan: string;
  /** Submissions consumed in the current billing cycle */
  usedSubmissions: number;
  /** Submissions included in the current plan */
  maxSubmissions: number;
  /** Date the tenant was created - anchors the fallback reset countdown */
  tenantJoinDate?: string;
  /** Actual next reset date when known. Preferred over the synthetic cycle. */
  nextResetDate?: string;
  /** Date of the next invoice. Supplying it adds the "Next billing" column. */
  nextBillingDate?: string;
  /** Upgrade CTA handler. Omit to render the button as a no-op. */
  onUpgrade?: () => void;
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

export const UsageSummaryCard: React.FC<UsageSummaryCardProps> = ({
  plan,
  usedSubmissions,
  maxSubmissions,
  tenantJoinDate,
  nextResetDate,
  nextBillingDate,
  onUpgrade,
  className = "",
  dataTestId = "usage-summary-card",
}) => {
  const { t } = useTranslation();

  const percentage = getUsagePercentage(usedSubmissions, maxSubmissions);
  const variant = getUsageVariant(percentage);
  const overLimit = isOverLimit(percentage);
  const resetLabel = formatResetLabel({ tenantJoinDate, nextResetDate }, t);
  const billingLabel = formatBillingDate(nextBillingDate);

  const notice = useMemo(() => {
    if (overLimit) {
      return {
        title: t("You’ve reached your form submissions limit!"),
        body: t(
          "Submissions will continue to arrive even though you exceed your limit. Consider it a thank you for using formsflow in your business."
        ),
      };
    }

    if (variant === "critical") {
      return {
        title: t("That’s a lot of form submissions!"),
        body: t(
          "Don’t worry, submissions will continue to arrive even if you exceed your limit. Consider it a thank you for using formsflow in your business."
        ),
      };
    }

    return null;
  }, [overLimit, variant, t]);

  // Over the limit the pill sits on a tinted card, so it gets its own treatment rather
  // than reusing the critical one.
  const ctaVariant = overLimit ? "over-limit" : variant;

  return (
    <div
      className={buildClassNames(
        "ff-usage-card",
        overLimit && "ff-usage-card--over-limit",
        className
      )}
      data-testid={dataTestId}
      data-usage-variant={overLimit ? "over-limit" : variant}
    >
      <div className="ff-usage-card__header">
        <div className="ff-usage-card__summary">
          <span className="ff-usage-card__label">{t("Total form submissions")}</span>
          <span className="ff-usage-card__count">
            <span className="ff-usage-card__count-used">
              {usedSubmissions.toLocaleString()}
            </span>
            <span className="ff-usage-card__count-max">
              {`/ ${maxSubmissions.toLocaleString()}`}
            </span>
          </span>
        </div>

        <V8CustomButton
          variant="secondary"
          label={getUsageCtaLabel(plan, percentage, t)}
          onClick={onUpgrade}
          className={`ff-usage-card__cta ff-usage-card__cta--${ctaVariant}`}
          dataTestId={`${dataTestId}-cta`}
        />
      </div>

      <UsageProgressBar
        plan={plan}
        usedSubmissions={usedSubmissions}
        maxSubmissions={maxSubmissions}
        className="ff-usage-card__bar"
        dataTestId={`${dataTestId}-bar`}
      />

      <dl className="ff-usage-card__stats">
        <div className="ff-usage-card__stat">
          <dt className="ff-usage-card__stat-label">{t("Used")}</dt>
          <dd
            className={`ff-usage-card__stat-value ff-usage-card__stat-value--${variant}`}
            data-testid={`${dataTestId}-percentage`}
          >
            {`${Math.round(percentage)}%`}
          </dd>
        </div>

        {resetLabel && (
          <div className="ff-usage-card__stat">
            <dt className="ff-usage-card__stat-label">{t("Resets in")}</dt>
            <dd className="ff-usage-card__stat-value">
              {resetLabel}
              <span
                className="ff-usage-card__stat-info"
                title={t(
                  "Your submission count resets at the start of every {{days}}-day billing cycle.",
                  { days: BILLING_CYCLE_DAYS }
                )}
              >
                <CircleAlertIcon color="currentColor" />
              </span>
            </dd>
          </div>
        )}

        <div className="ff-usage-card__stat">
          <dt className="ff-usage-card__stat-label">{t("Current plan")}</dt>
          <dd className="ff-usage-card__stat-value">{plan}</dd>
        </div>

        {billingLabel && (
          <div className="ff-usage-card__stat">
            <dt className="ff-usage-card__stat-label">{t("Next billing")}</dt>
            <dd className="ff-usage-card__stat-value">{billingLabel}</dd>
          </div>
        )}
      </dl>

      {notice && (
        <div
          className={`ff-usage-card__notice ff-usage-card__notice--${
            overLimit ? "critical" : "warning"
          }`}
          role="status"
          aria-live="polite"
          data-testid={`${dataTestId}-notice`}
        >
          <span className="ff-usage-card__notice-title">{notice.title}</span>
          <span className="ff-usage-card__notice-body">{notice.body}</span>
        </div>
      )}
    </div>
  );
};

export default UsageSummaryCard;
