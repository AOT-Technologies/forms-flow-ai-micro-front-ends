/**
 * Usage tracking: shared configuration and pure calculation helpers.
 *
 * Everything the usage components need to decide - the percentage, the colour band, the days
 * until the next reset, the CTA wording - lives here, so the progress bar, the summary card
 * and the home banner can never disagree with each other. forms-flow-web and
 * forms-flow-admin are separate repos whose only shared code is this package, which is why
 * the thresholds and plan limits must be defined here rather than per app.
 *
 * No date library: forms-flow-components has none, so this uses native Date, matching the
 * existing quota countdown in forms-flow-web's AiFormBuilderModal.
 */

/* ------------------------------------------------------------------ configuration */

export interface UsageData {
  /** Display label for the current plan, e.g. "Go" or "Professional" */
  plan: string;
  /** Submissions consumed in the current billing cycle */
  usedSubmissions: number;
  /** Submissions included in the current plan */
  maxSubmissions: number;
  /** Date the tenant was created - anchors the fallback billing cycle */
  tenantJoinDate?: string;
  /** Actual next reset date when known. Preferred over the synthetic cycle. */
  nextResetDate?: string;
  /** Date of the next invoice. Paid plans only; omit to hide the column. */
  nextBillingDate?: string;
}

/** Shape of the cached `tenantData` record, narrowed to the fields used here. */
export interface TenantRecord {
  created_on?: string;
  expiry_dt?: string;
  trial_expiry_dt?: string;
  subscription_plan?: string;
  subscription_status?: string;
  [key: string]: unknown;
}

/** Fallback billing cycle length, used when the backend gives us no reset date. */
export const BILLING_CYCLE_DAYS = 30;

/** Percentage boundaries driving the progress bar colour and the contextual notices. */
export const USAGE_THRESHOLDS = {
  WARNING: 70,
  CRITICAL: 90,
  LIMIT: 100,
};

/** Plan label treated as the free tier - drives which upgrade CTA is shown. */
export const FREE_PLAN_LABEL = "Go";

/** Paid tier label, as rendered under "Current plan" in the designs. */
export const PRO_PLAN_LABEL = "Professional";

export const PLAN_SUBMISSION_LIMITS: Record<string, number> = {
  [FREE_PLAN_LABEL]: 250,
  [PRO_PLAN_LABEL]: 2500,
};

/** Submission allowance advertised by the upgrade CTA on the free tier. */
export const NEXT_TIER_SUBMISSIONS = PLAN_SUBMISSION_LIMITS[PRO_PLAN_LABEL];

export const PLACEHOLDER_USED_SUBMISSIONS = 10;

/* ------------------------------------------------------------------------- parsing */

export type UsageVariant = "safe" | "warning" | "critical";

/** Minimal shape of the `t` function, so helpers do not depend on react-i18next types. */
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/** Source fields the reset countdown can be derived from. */
type ResetSource = Pick<UsageData, "tenantJoinDate" | "nextResetDate">;

export interface TimeUntilReset {
  /** Whole days remaining. Zero once the reset is less than 24 hours away. */
  days: number;
  /** Total whole hours remaining. Only meaningful for display when `days` is 0. */
  hours: number;
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/** Values the tenant API uses to mean "unset" - Python `None` reaches us as a string. */
const EMPTY_VALUES = new Set(["", "none", "null", "undefined"]);

const isEmptyValue = (value?: string | null): boolean =>
  !value || EMPTY_VALUES.has(String(value).trim().toLowerCase());

/**
 * Parse a date value as a *local* date.
 *
 * Two formats matter here:
 *  - `"2026-05-18"` - `new Date()` would read this as UTC midnight, which renders as the
 *    previous day in negative-offset timezones, so it is split manually.
 *  - `"2026-08-18 08:34:29.416489"` - the tenant API format: space separated, with
 *    microseconds. Normalised the same way `parseTenantDateTime` does in forms-flow-web.
 */
const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = String(value).trim();
  if (isEmptyValue(trimmed)) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  // "YYYY-MM-DD HH:mm:ss[.ffffff]" -> "YYYY-MM-DDTHH:mm:ss[.fff]"
  const normalised = trimmed
    .replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
    .replace(/(\.\d{3})\d+$/, "$1");

  const parsed = new Date(normalised);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Returns the value only if it parses to a real date, else undefined. */
const usableDateString = (value?: string | null): string | undefined =>
  parseDate(value) ? String(value) : undefined;

/* ----------------------------------------------------------------------- calculation */

/**
 * Percentage of the allowance consumed. Not clamped - callers that need a bar width clamp it
 * themselves, while the displayed figure is allowed to exceed 100%.
 */
export const getUsagePercentage = (used: number, max: number): number => {
  if (!Number.isFinite(used) || !Number.isFinite(max) || max <= 0) return 0;
  return (Math.max(0, used) / max) * 100;
};

/**
 * Colour band for a usage percentage.
 * 0-69 safe (green), 70-89 warning (yellow), 90+ critical (red).
 */
export const getUsageVariant = (percentage: number): UsageVariant => {
  if (percentage >= USAGE_THRESHOLDS.CRITICAL) return "critical";
  if (percentage >= USAGE_THRESHOLDS.WARNING) return "warning";
  return "safe";
};

export const isOverLimit = (percentage: number): boolean =>
  percentage >= USAGE_THRESHOLDS.LIMIT;

/**
 * Start of the next billing cycle.
 *
 * Prefers a real `nextResetDate` when it is still in the future. Otherwise falls back to
 * treating each cycle as BILLING_CYCLE_DAYS long, anchored on the tenant join date - which
 * also rolls an expired trial date forward instead of showing a stuck "0 days".
 * Uses `setDate` so DST transitions do not drift the result.
 */
export const getNextResetDate = (
  source?: ResetSource | null,
  now: Date = new Date()
): Date | null => {
  const explicit = parseDate(source?.nextResetDate);
  if (explicit && explicit.getTime() > now.getTime()) return explicit;

  const cycleStart = parseDate(source?.tenantJoinDate);
  if (!cycleStart) return explicit;

  const anchor = startOfDay(cycleStart);
  const elapsedDays = Math.floor(
    (startOfDay(now).getTime() - anchor.getTime()) / MS_PER_DAY
  );
  const cyclesCompleted = elapsedDays > 0 ? Math.floor(elapsedDays / BILLING_CYCLE_DAYS) : 0;

  const nextReset = new Date(anchor);
  nextReset.setDate(nextReset.getDate() + (cyclesCompleted + 1) * BILLING_CYCLE_DAYS);
  return nextReset;
};

export const getTimeUntilReset = (
  source?: ResetSource | null,
  now: Date = new Date()
): TimeUntilReset | null => {
  const nextReset = getNextResetDate(source, now);
  if (!nextReset) return null;

  const remaining = nextReset.getTime() - now.getTime();
  if (remaining <= 0) return { days: 0, hours: 0 };

  return {
    days: Math.floor(remaining / MS_PER_DAY),
    hours: Math.floor(remaining / MS_PER_HOUR),
  };
};

/**
 * Human readable countdown, e.g. "23 days", "1 day", "4 hours", "Less than an hour".
 * Returns an empty string when there is no usable date to count from.
 */
export const formatResetLabel = (
  source: ResetSource | null | undefined,
  t: TranslateFn,
  now: Date = new Date()
): string => {
  const remaining = getTimeUntilReset(source, now);
  if (!remaining) return "";

  if (remaining.days >= 1) {
    return remaining.days === 1
      ? t("1 day")
      : t("{{days}} days", { days: remaining.days });
  }

  if (remaining.hours >= 1) {
    return remaining.hours === 1
      ? t("1 hour")
      : t("{{hours}} hours", { hours: remaining.hours });
  }

  return t("Less than an hour");
};

const withOrdinalSuffix = (day: number): string => {
  const lastTwo = day % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return `${day}th`;

  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

/** Formats a billing date the way the design shows it, e.g. "28th July". */
export const formatBillingDate = (value?: string | Date | null): string => {
  const date = parseDate(value);
  if (!date) return "";
  return `${withOrdinalSuffix(date.getDate())} ${date.toLocaleString(undefined, {
    month: "long",
  })}`;
};

/**
 * Upgrade CTA wording. Paid plans are pointed at Enterprise; the free tier is pointed at the
 * next tier, with the wording sharpening once the tenant is close to the limit.
 */
export const getUsageCtaLabel = (
  plan: string,
  percentage: number,
  t: TranslateFn
): string => {
  if (plan !== FREE_PLAN_LABEL) return t("Discover Enterprise");

  if (percentage >= USAGE_THRESHOLDS.WARNING) {
    return t("Upgrade to {{limit}} submissions", { limit: NEXT_TIER_SUBMISSIONS });
  }

  return t("Upgrade to Professional Plan");
};

/* --------------------------------------------------------------------------- mapping */

/** `subscription_status` is the only status value the app already relies on elsewhere. */
const isActiveSubscription = (status?: string): boolean =>
  !isEmptyValue(status) && String(status).trim().toLowerCase() === "active";

/**
 * Derives usage data from the cached `tenantData` record.
 *
 * Pure and separate from the hook so it can be unit tested, and so backend integration
 * touches only this function - neither consuming app changes.
 *
 * `usedSubmissions` has no source in `tenantData`; pass it in once an API provides it.
 */
export const mapTenantDataToUsage = (
  tenant?: TenantRecord | null,
  usedSubmissions: number = PLACEHOLDER_USED_SUBMISSIONS
): UsageData => {
  const isPaid = isActiveSubscription(tenant?.subscription_status);
  const plan = isPaid ? PRO_PLAN_LABEL : FREE_PLAN_LABEL;

  // The tenant record carries the trial/subscription end date, which is the real reset point.
  const resetDate =
    usableDateString(tenant?.expiry_dt) ?? usableDateString(tenant?.trial_expiry_dt);

  return {
    plan,
    usedSubmissions,
    maxSubmissions:
      PLAN_SUBMISSION_LIMITS[plan] ?? PLAN_SUBMISSION_LIMITS[FREE_PLAN_LABEL],
    tenantJoinDate: usableDateString(tenant?.created_on),
    nextResetDate: resetDate,
    // Trials have an expiry but no invoice, so the column is paid-plans only.
    nextBillingDate: isPaid ? resetDate : undefined,
  };
};
