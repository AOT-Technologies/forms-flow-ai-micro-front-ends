export type FontKey = "serif" | "sans" | "heavy-sans" | "mono" | "slab";
export type ButtonShape = "square" | "rounded";

export interface StyleConfig {
  background: string;
  accent: string;
  buttons: string;
  buttonShape: ButtonShape;
  headerFont: FontKey;
  bodyFont: FontKey;
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
};

export const THEMED_FORM_CLASS = "ff-themed-form";
const STYLE_TAG_ID = "ff-form-theme-overrides";

export const buildScopedCSS = (style: StyleConfig): string => {
  const bg = style.background || DEFAULT_STYLE.background;
  const accent = style.accent || DEFAULT_STYLE.accent;
  const btnBg = style.buttons || DEFAULT_STYLE.buttons;
  const radius = BUTTON_RADIUS_MAP[style.buttonShape] || BUTTON_RADIUS_MAP.square;
  const hFont = FONT_MAP[style.headerFont] || FONT_MAP.sans;
  const bFont = FONT_MAP[style.bodyFont] || FONT_MAP.sans;
  const s = `.${THEMED_FORM_CLASS}`;
  return `
${s} * { font-family: ${bFont}; }
${s} [data-component="form"],
${s} .tab-content, ${s} .tab-pane { background-color: transparent !important; }
${s} .card, ${s} .card-body, ${s} .card-header, ${s} .card-footer,
${s} .formio-component-panel > .card { background-color: ${bg} !important; }
${s} h1, ${s} h2, ${s} h3, ${s} h4, ${s} h5, ${s} h6,
${s} .card-title, ${s} .panel-title, ${s} legend {
  font-family: ${hFont} !important; color: ${accent} !important; }
${s} label, ${s} .col-form-label, ${s} .control-label,
${s} .form-check-label, ${s} .formio-component label { color: ${accent} !important; }
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
