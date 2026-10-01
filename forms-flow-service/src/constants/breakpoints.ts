/**
 * Breakpoint and container tokens — v8.3 responsiveness (R2.1/R2.2).
 *
 * R2.2 requires the tier to reach three consumers from one source:
 *   1. SCSS variables + respond-from()/respond-below() — forms-flow-theme
 *      `scss/v8-scss/_mixins.scss`
 *   2. CSS custom properties — `--breakpoint-*` / `--container-*`, emitted from
 *      that same map in `_theme.scss`
 *   3. this JS/TS export
 *
 * forms-flow-theme ships CSS only and has no JS entry point, so consumer (3)
 * lives here, in the package every micro-frontend already imports. The values
 * below are mirrored from the SCSS maps, and `breakpoints.test.ts` parses
 * `_mixins.scss` and fails if the two ever drift.
 *
 * Thresholds are anchored to the Figma frame widths. Container widths follow
 * `(168px column + 16px gutter) x columns - 16px` and are for layout maths only
 * — they are never valid as a media-query threshold.
 */

export type BreakpointTier =
  | "mobile"
  | "tablet"
  | "desktop-sm"
  | "desktop-md"
  | "desktop-lg"
  | "desktop-xl"
  | "desktop-2xl";

/** Media-query thresholds, in px. */
export const BREAKPOINTS: Readonly<Record<BreakpointTier, number>> =
  Object.freeze({
    mobile: 402,
    tablet: 744,
    "desktop-sm": 1024,
    "desktop-md": 1280,
    "desktop-lg": 1440,
    "desktop-xl": 1600,
    "desktop-2xl": 1920,
  });

/** Canvas container widths, in px. Layout maths only — never a threshold. */
export const CONTAINERS: Readonly<Record<BreakpointTier, number>> =
  Object.freeze({
    mobile: 352, // 2 columns
    tablet: 536, // 3 columns
    "desktop-sm": 720, // 4 columns
    "desktop-md": 1088, // 6 columns
    "desktop-lg": 1088, // 6 columns
    "desktop-xl": 1456, // 8 columns
    "desktop-2xl": 1456, // 8 columns — terminal tier; the canvas centres beyond this
  });

/** Tiers in ascending threshold order. */
export const BREAKPOINT_TIERS = Object.keys(BREAKPOINTS) as BreakpointTier[];

/**
 * Mobile-first media query string for a tier (R2.3: anchor = threshold).
 * Mirrors the SCSS `respond-from()` mixin.
 */
export const mediaFrom = (tier: BreakpointTier): string =>
  `(min-width: ${BREAKPOINTS[tier]}px)`;

/**
 * Shrink-down counterpart, mirroring `respond-below()`. The 0.02px offset keeps
 * mediaBelow(x) and mediaFrom(x) mutually exclusive at exactly the threshold.
 */
export const mediaBelow = (tier: BreakpointTier): string =>
  `(max-width: ${BREAKPOINTS[tier] - 0.02}px)`;

/**
 * The widest tier whose threshold the given width has reached, or null below the
 * smallest tier. Pass an explicit width in non-browser contexts.
 */
export const resolveTier = (width: number): BreakpointTier | null => {
  let match: BreakpointTier | null = null;
  for (const tier of BREAKPOINT_TIERS) {
    if (width >= BREAKPOINTS[tier]) {
      match = tier;
    }
  }
  return match;
};
