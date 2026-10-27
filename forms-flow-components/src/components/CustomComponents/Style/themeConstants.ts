export type FontKey = "serif" | "sans" | "heavy-sans" | "mono" | "slab";
export type ButtonShape = "square" | "rounded";
export type BrandingLogo = "none" | "formsflow";

export interface StyleConfig {
  background: string;
  accent: string;
  buttons: string;
  buttonShape: ButtonShape;
  headerFont: FontKey;
  bodyFont: FontKey;
  brandingLogo: BrandingLogo;
}

export const FONT_MAP: Record<FontKey, string> = {
  serif: 'Georgia, "Times New Roman", Times, serif',
  sans: '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  "heavy-sans": '"Arial Black", "Impact", Gadget, sans-serif',
  mono: '"Courier New", Courier, monospace',
  slab: 'Rockwell, "Courier Bold", Courier, Georgia, Times, "Times New Roman", serif',
};

export const BUTTON_RADIUS_MAP: Record<ButtonShape, string> = {
  square: "4px",
  rounded: "20px",
};

export const DEFAULT_STYLE: StyleConfig = {
  background: "#FFFFFF",
  accent: "#4A4A4A",
  buttons: "#0087D9",
  buttonShape: "square",
  headerFont: "sans",
  bodyFont: "sans",
  brandingLogo: "formsflow",
};

/**
 * formsflow.ai brand mark (icon only) — inlined as raw SVG markup so it can be
 * dropped into either a React tree (via dangerouslySetInnerHTML) or a plain
 * DOM node (via innerHTML) without depending on any bundler asset pipeline.
 */
/* eslint-disable max-len */
export const FORMSFLOW_LOGO_ICON_SVG = `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M30 40.1199L36.6667 46.7866L50 33.4532" stroke="#1529C4" stroke-width="6.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.99951 40.12C9.99951 48.0765 13.1602 55.7071 18.7863 61.3332C24.4124 66.9593 32.043 70.12 39.9995 70.12C48.3863 70.0884 56.4363 66.8159 62.4662 60.9867L69.9995 53.4533M69.9995 53.4533H53.3328M69.9995 53.4533V70.12" stroke="#1B34FB" stroke-width="6.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M69.9995 40.12C69.9995 32.1635 66.8388 24.5329 61.2127 18.9068C55.5866 13.2807 47.956 10.12 39.9995 10.12C31.6127 10.1515 23.5627 13.4241 17.5328 19.2533L9.99951 26.7867M9.99951 26.7867V10.12M9.99951 26.7867H26.6662" stroke="#1B34FB" stroke-width="6.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
/* eslint-enable max-len */

export const THEMED_FORM_CLASS = "ff-themed-form";
const STYLE_TAG_ID = "ff-form-theme-overrides";
export const BRANDING_LOGO_CLASS = "ff-theme-branding-logo";
export const FORMSFLOW_WEBSITE_URL = "https://formsflow.ai/";

// Colour values on a StyleConfig originate from the style-templates API and
// are interpolated directly into a raw <style> tag below -- an unvalidated
// value containing e.g. `;} body{display:none}` would be arbitrary CSS
// injection. Restrict to what the ColorPicker UI can ever actually produce
// (3- or 6-digit hex) and fall back to the safe default otherwise.
const SAFE_COLOR_REGEX = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/;
const sanitizeColor = (value: string | undefined, fallback: string): string =>
  value && SAFE_COLOR_REGEX.test(value) ? value : fallback;

// FONT_MAP/BUTTON_RADIUS_MAP are plain objects, so a `[key]` lookup with an
// untrusted key (headerFont/buttonShape come off the style-templates API with
// no runtime validation) can resolve an inherited Object.prototype member
// (e.g. "constructor", "toString") instead of `undefined` -- `||` only saves
// you when the result is falsy, and a resolved function is truthy. That
// value is then interpolated straight into the stylesheet below, same class
// of bug sanitizeColor exists to prevent. hasOwnProperty confines the lookup
// to the map's own declared keys.
const safeFont = (key: string): string =>
  Object.prototype.hasOwnProperty.call(FONT_MAP, key)
    ? FONT_MAP[key as FontKey]
    : FONT_MAP.sans;
const safeButtonRadius = (key: string): string =>
  Object.prototype.hasOwnProperty.call(BUTTON_RADIUS_MAP, key)
    ? BUTTON_RADIUS_MAP[key as ButtonShape]
    : BUTTON_RADIUS_MAP.square;

export const buildScopedCSS = (style: StyleConfig): string => {
  const bg = sanitizeColor(style.background, DEFAULT_STYLE.background);
  const accent = sanitizeColor(style.accent, DEFAULT_STYLE.accent);
  const btnBg = sanitizeColor(style.buttons, DEFAULT_STYLE.buttons);
  const radius = safeButtonRadius(style.buttonShape);
  const hFont = safeFont(style.headerFont);
  const bFont = safeFont(style.bodyFont);
  const s = `.${THEMED_FORM_CLASS}`;
  return `
${s} * { font-family: ${bFont}; }
${s} [data-component="form"],
${s} .tab-content, ${s} .tab-pane { background-color: transparent !important; }
${s} .card, ${s} .card-body, ${s} .card-footer,
${s} .formio-component-panel > .card { background-color: #fff !important; }
${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6, ${s} legend {
  font-family: ${hFont} !important; }
${s} .card-header, ${s} .card-title, ${s} .panel-title {
  font-family: ${hFont} !important;
  background-color: ${accent} !important;
  color: #fff !important; }
${s} .form-control, ${s} input[type="text"], ${s} input[type="email"],
${s} input[type="number"], ${s} input[type="tel"], ${s} input[type="date"],
${s} input[type="url"], ${s} input[type="password"],
${s} textarea, ${s} select { font-family: ${bFont}; }
${s} .formio-form {
  background-color: ${bg} !important;
  padding: 24px 28px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  margin: 12px 0 24px; }
${s} .formio-component-button button, ${s} .btn-primary, ${s} .btn-default,
${s} button[type="submit"], ${s} [ref="button"],
${s} .btn.btn-wizard-nav-submit, ${s} .btn.btn-wizard-nav-next,
${s} .btn.btn-wizard-nav-back, ${s} .btn.btn-wizard-nav-cancel {
  background-color: ${btnBg} !important; border-color: ${btnBg} !important;
  border-radius: ${radius} !important; font-family: ${bFont} !important;
  color: #fff !important; }
${s} .${BRANDING_LOGO_CLASS} {
  display: flex; align-items: center; justify-content: center; flex-wrap: nowrap;
  gap: 4px; width: max-content; min-width: 183px; height: 30px;
  margin: 16px auto 0; padding: 0 14px; border-radius: 18px;
  border: 1px solid var(--ff-color-gray-medium, #D1D2D3); background: #FFF;
  box-sizing: border-box; text-decoration: none; cursor: pointer; }
${s} .${BRANDING_LOGO_CLASS} svg { width: 16px; height: 16px; flex-shrink: 0; }
${s} .${BRANDING_LOGO_CLASS}__label {
  white-space: nowrap; flex-shrink: 0;
  color: var(--ff-color-secondary-dark, #525254); text-align: center;
  font-family: "Figtree", sans-serif; font-size: 13.125px; font-style: normal;
  font-weight: 400; line-height: 18.75px; }
${s} .${BRANDING_LOGO_CLASS}__brand {
  white-space: nowrap; flex-shrink: 0;
  color: var(--color-bootstrap-primary, #3248F4); text-align: center;
  font-family: "Figtree", sans-serif; font-size: 13.125px; font-style: normal;
  font-weight: 500; line-height: 18.75px; }
`.trim();
};

export const injectFormThemeStyles = (style: StyleConfig): void => {
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = buildScopedCSS(style);
};

export const removeFormThemeStyles = (): void => {
  document.getElementById(STYLE_TAG_ID)?.remove();
};

// Branding logo footer — appended as an actual DOM node inside `.formio-form`
// (CSS vars alone can't render a logo). Idempotent: skipped if already
// present, removed if turned off.
export const applyBrandingLogo = (
  style: Pick<StyleConfig, "brandingLogo">
): void => {
  document
    .querySelectorAll(`.${THEMED_FORM_CLASS} .formio-form`)
    .forEach((formEl) => {
      const existing = formEl.querySelector(`.${BRANDING_LOGO_CLASS}`);
      if (style.brandingLogo === "formsflow") {
        if (existing) return;
        const badge = document.createElement("a");
        badge.className = BRANDING_LOGO_CLASS;
        badge.href = FORMSFLOW_WEBSITE_URL;
        badge.target = "_blank";
        badge.rel = "noopener noreferrer";
        // Inline font-family (with !important) because buildScopedCSS's own
        // `.ff-themed-form *` rule (same specificity, later in source order)
        // would otherwise override the Figtree set on __label/__brand above.
        badge.innerHTML = `${FORMSFLOW_LOGO_ICON_SVG}<span class="${BRANDING_LOGO_CLASS}__label" style="font-family:'Figtree',sans-serif !important;">Created by</span><span class="${BRANDING_LOGO_CLASS}__brand" style="font-family:'Figtree',sans-serif !important;">formsflow.ai</span>`;
        formEl.appendChild(badge);
      } else if (existing) {
        existing.remove();
      }
    });
};
