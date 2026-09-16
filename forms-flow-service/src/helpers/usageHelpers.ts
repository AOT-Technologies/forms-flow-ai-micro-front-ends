/**
 * Usage metering: shared configuration and pure calculation helpers.
 *
 * The percentage, the colour band, the reset countdown and the CTA wording live here so the
 * summary card in forms-flow-admin and the alert banner in forms-flow-web cannot disagree.
 * The components themselves live in their hosts; only the logic is shared.
 *
 * The allowance is not defined here - `used`, `total`, the plan name and the reset date come
 * from the admin API. What remains is presentation: thresholds, plan labels and CTA copy.
 *
 * Free of React and of I/O: `formatResetLabel` and `getUsageCtaLabel` take a translate
 * function from the caller rather than importing i18n. Native Date, no date library.
 */

/* ------------------------------------------------------------------ configuration */

export interface UsageData {
  /** Display label for the current plan, e.g. "Go" or "Professional" */
  plan: string;
  /** Submissions consumed in the current billing cycle */
  usedSubmissions: number;
  /** Submissions included in the current plan */
  maxSubmissions: number;
  /** The day the allowance resets, as reported by the API. */
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

/**
 * Submission allowance advertised by the upgrade CTA on the free tier.
 *
 * Marketing copy, not a limit: the allowance actually enforced arrives as `total` from the
 * usage API. Kept as a constant only because the CTA has to name a number before the user
 * has upgraded to the plan that carries it.
 */
export const NEXT_TIER_SUBMISSIONS = 2500;

/** Feature key metered for form submissions; matches `features.key` in the admin database. */
export const SUBMISSION_FEATURE_KEY = "submission";


/* ------------------------------------------------------------------------- parsing */

export type UsageVariant = "safe" | "warning" | "critical";

/** Minimal shape of the `t` function, so helpers do not depend on react-i18next types. */
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/** Source fields the reset countdown can be derived from. */
type ResetSource = Pick<UsageData, "nextResetDate">;

interface TimeUntilReset {
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
const getNextResetDate = (source?: ResetSource | null): Date | null =>
  parseDate(source?.nextResetDate);

const getTimeUntilReset = (
  source?: ResetSource | null,
  now: Date = new Date()
): TimeUntilReset | null => {
  const nextReset = getNextResetDate(source);
  if (!nextReset) return null;

  const remaining = nextReset.getTime() - now.getTime();
  if (remaining <= 0) return null;

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

/* ----------------------------------------------------------------- response adaptation */

/**
 * The parts of the admin API's usage response this package reads.
 *
 * Declared structurally rather than imported from @formsflow/service, so nothing
 * presentational depends on the HTTP layer. The authoritative shape is
 * ``FeatureUsageResponse`` there; this is the subset the card and banner need.
 */
export interface UsageResponseFields {
  used: number;
  total?: number | null;
  plan?: string | null;
  resets_on?: string | null;
}

/**
 * Normalise a backend plan name to the label the designs use.
 *
 * The admin database stores what Stripe reports - "Professional Plan" for the paid tier,
 * "Go" for the seeded free tier - while the UI writes "Professional". Anything unrecognised
 * is passed through as-is, so an Enterprise or negotiated plan shows its own name instead of
 * being mislabelled as the tier below it.
 */
const normalisePlanLabel = (plan?: string | null): string => {
  const named = isEmptyValue(plan) ? "" : String(plan).trim();
  if (!named) return FREE_PLAN_LABEL;

  const lower = named.toLowerCase();
  if (lower.startsWith(FREE_PLAN_LABEL.toLowerCase())) return FREE_PLAN_LABEL;
  if (lower.startsWith(PRO_PLAN_LABEL.toLowerCase())) return PRO_PLAN_LABEL;
  return named;
};

/**
 * Turn a usage response into component props, the one place that conversion happens.
 *
 * Returns null - so the caller renders nothing - when there is no usable allowance to draw a
 * bar against: no response at all, or `total` absent because the feature is unlimited or the
 * plan has no configured limit. A missing number is better than a misleading one.
 *
 * `tenant` supplies only the next invoice date, which is billing information rather than
 * usage and so still comes from the cached tenant record.
 */
export const mapUsageResponse = (
  usage?: UsageResponseFields | null,
  tenant?: TenantRecord | null
): UsageData | null => {
  if (!usage) return null;

  const usedSubmissions = Number(usage.used);
  if (!Number.isFinite(usedSubmissions) || usedSubmissions < 0) return null;

  const maxSubmissions = Number(usage.total);
  if (!Number.isFinite(maxSubmissions) || maxSubmissions <= 0) return null;

  return {
    plan: normalisePlanLabel(usage.plan),
    usedSubmissions,
    maxSubmissions,
    nextResetDate: usableDateString(usage.resets_on),
    nextBillingDate: isActiveSubscription(tenant?.subscription_status)
      ? usableDateString(tenant?.expiry_dt)
      : undefined,
  };
};
