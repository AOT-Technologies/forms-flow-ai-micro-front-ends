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
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  brandingLogo: "none",
};

/**
 * formsflow.ai brand mark (icon only) — inlined as raw SVG markup so it can be
 * dropped into either a React tree (via dangerouslySetInnerHTML) or a plain
 * DOM node (via innerHTML) without depending on any bundler asset pipeline.
 */
/* eslint-disable max-len */
export const FORMSFLOW_LOGO_ICON_SVG = `<svg viewBox="0 0 27.44 27.44" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.7801 13.72L12.7401 15.68L16.6601 11.76" stroke="#1529C4" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.89998 13.7201C4.89998 16.0593 5.82923 18.3027 7.4833 19.9567C9.13737 21.6108 11.3808 22.5401 13.72 22.5401C16.1857 22.5308 18.5524 21.5687 20.3252 19.8549L22.54 17.6401M22.54 22.5401V17.6401H17.64" stroke="#1B34FB" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M22.54 13.7199C22.54 11.3807 21.6107 9.13729 19.9567 7.48322C18.3026 5.82915 16.0592 4.8999 13.72 4.8999C11.2543 4.90917 8.88757 5.8713 7.11478 7.5851L4.89998 9.7999M9.79998 9.7999H4.89998V4.8999" stroke="#1B34FB" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
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

export const buildScopedCSS = (style: StyleConfig): string => {
  const bg = sanitizeColor(style.background, DEFAULT_STYLE.background);
  const accent = sanitizeColor(style.accent, DEFAULT_STYLE.accent);
  const btnBg = sanitizeColor(style.buttons, DEFAULT_STYLE.buttons);
  const radius =
    BUTTON_RADIUS_MAP[style.buttonShape] || BUTTON_RADIUS_MAP.square;
  const hFont = FONT_MAP[style.headerFont] || FONT_MAP.sans;
  const bFont = FONT_MAP[style.bodyFont] || FONT_MAP.sans;
  const s = `.${THEMED_FORM_CLASS}`;
  return `
${s} * { font-family: ${bFont}; }
${s} [data-component="form"],
${s} .tab-content, ${s} .tab-pane { background-color: transparent !important; }
${s} .card, ${s} .card-body, ${s} .card-footer,
${s} .formio-component-panel > .card { background-color: ${bg} !important; }
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
