import { useEffect, useLayoutEffect, useState } from "react";
import { RequestService } from "@formsflow/service";
import { WEB_BASE_URL } from "../endpoints/config";

// ─── Constants (mirror of forms-flow-web ThemeService) ───────────────────────

const FONT_MAP: Record<string, string> = {
  serif: 'Georgia, "Times New Roman", Times, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  "heavy-sans": '"Arial Black", "Impact", Gadget, sans-serif',
  mono: '"Courier New", Courier, monospace',
  slab: 'Rockwell, "Courier Bold", Courier, Georgia, Times, "Times New Roman", serif',
};

const BUTTON_RADIUS_MAP: Record<string, string> = {
  square: "4px",
  rounded: "20px",
};

const DEFAULT_STYLE = {
  background: "#FFFFFF",
  accent: "#4A4A4A",
  buttons: "#0087D9",
  buttonShape: "square",
  headerFont: "sans",
  bodyFont: "sans",
};

export const THEMED_FORM_CLASS = "ff-themed-form";
const STYLE_TAG_ID = "ff-form-theme-overrides";
const CACHE_PREFIX = "ff_form_style_";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiStyleToConfig = (style: Record<string, any>) => ({
  background:  style.backgroundColor ?? DEFAULT_STYLE.background,
  accent:      style.accentColor     ?? DEFAULT_STYLE.accent,
  buttons:     style.buttonColor     ?? DEFAULT_STYLE.buttons,
  buttonShape: style.buttonShape     ?? DEFAULT_STYLE.buttonShape,
  headerFont:  style.headerFont      ?? DEFAULT_STYLE.headerFont,
  bodyFont:    style.bodyFont        ?? DEFAULT_STYLE.bodyFont,
});

const readFromCache = (formId: string) => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${formId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version && parsed.style) return apiStyleToConfig(parsed.style);
    return null;
  } catch {
    return null;
  }
};

const buildScopedCSS = (style: typeof DEFAULT_STYLE): string => {
  const bg     = style.background  || DEFAULT_STYLE.background;
  const accent = style.accent      || DEFAULT_STYLE.accent;
  const btnBg  = style.buttons     || DEFAULT_STYLE.buttons;
  const radius = BUTTON_RADIUS_MAP[style.buttonShape] || BUTTON_RADIUS_MAP.square;
  const hFont  = FONT_MAP[style.headerFont] || FONT_MAP.sans;
  const bFont  = FONT_MAP[style.bodyFont]   || FONT_MAP.sans;
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useFormTheme = (formId: string | undefined) => {
  const initialStyle = formId ? (readFromCache(formId) ?? { ...DEFAULT_STYLE }) : { ...DEFAULT_STYLE };
  const [styleConfig, setStyleConfig] = useState(initialStyle);

  useEffect(() => {
    if (!formId) return;

    // If cache produced a different formId now (e.g. step changed), re-read
    const cached = readFromCache(formId);
    if (cached) setStyleConfig(cached);

    RequestService.httpGETRequest(`${WEB_BASE_URL}/form/${formId}/style`)
      .then((res: any) => {
        const styleData = res?.data?.styleData;
        if (styleData) setStyleConfig(apiStyleToConfig(styleData));
      })
      .catch((err: any) => {
        if (err?.response?.status === 404 && !cached) {
          setStyleConfig({ ...DEFAULT_STYLE });
        }
      });
  }, [formId]);

  // useLayoutEffect — inject before browser paints to avoid background flash
  useLayoutEffect(() => {
    let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = STYLE_TAG_ID;
      document.head.appendChild(tag);
    }
    tag.textContent = buildScopedCSS(styleConfig);
  }, [styleConfig]);

  useEffect(() => {
    return () => { document.getElementById(STYLE_TAG_ID)?.remove(); };
  }, []);

  return { themeClass: THEMED_FORM_CLASS };
};
