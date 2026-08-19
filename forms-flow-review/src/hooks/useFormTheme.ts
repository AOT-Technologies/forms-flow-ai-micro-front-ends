import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { RequestService } from "@formsflow/service";
import { WEB_BASE_URL } from "../api/config";

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
  brandingLogo: "none",
};

/**
 * formsflow.ai brand mark (icon only) — inlined as raw SVG markup so it can be
 * dropped straight into a plain DOM node (via innerHTML) without depending on
 * any bundler asset pipeline.
 */
/* eslint-disable max-len */
const FORMSFLOW_LOGO_ICON_SVG = `<svg viewBox="0 0 27.44 27.44" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.7801 13.72L12.7401 15.68L16.6601 11.76" stroke="#1529C4" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.89998 13.7201C4.89998 16.0593 5.82923 18.3027 7.4833 19.9567C9.13737 21.6108 11.3808 22.5401 13.72 22.5401C16.1857 22.5308 18.5524 21.5687 20.3252 19.8549L22.54 17.6401M22.54 22.5401V17.6401H17.64" stroke="#1B34FB" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M22.54 13.7199C22.54 11.3807 21.6107 9.13729 19.9567 7.48322C18.3026 5.82915 16.0592 4.8999 13.72 4.8999C11.2543 4.90917 8.88757 5.8713 7.11478 7.5851L4.89998 9.7999M9.79998 9.7999H4.89998V4.8999" stroke="#1B34FB" stroke-width="1.96" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
/* eslint-enable max-len */

export const THEMED_FORM_CLASS = "ff-themed-form";
const STYLE_TAG_ID = "ff-form-theme-overrides";
const CACHE_PREFIX = "ff_form_style_";
const BRANDING_LOGO_CLASS = "ff-theme-branding-logo";
const FORMSFLOW_WEBSITE_URL = "https://formsflow.ai/";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const apiStyleToConfig = (style: Record<string, any>) => ({
  background:   style.backgroundColor ?? style.background  ?? DEFAULT_STYLE.background,
  accent:       style.accentColor     ?? style.accent      ?? DEFAULT_STYLE.accent,
  buttons:      style.buttonColor     ?? style.buttons     ?? DEFAULT_STYLE.buttons,
  buttonShape:  style.buttonShape     ?? DEFAULT_STYLE.buttonShape,
  headerFont:   style.headerFont      ?? DEFAULT_STYLE.headerFont,
  bodyFont:     style.bodyFont        ?? DEFAULT_STYLE.bodyFont,
  brandingLogo: style.brandingLogo    ?? DEFAULT_STYLE.brandingLogo,
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

interface StyleTemplateEntry {
  id: number;
  isGlobal: boolean;
  styleConfig: typeof DEFAULT_STYLE;
}

// Tenant-level "Default" theme, editable from Manage -> Style. Its style_data
// is stored in this same internal key format (background/accent/...), unlike
// per-form/template styleData which uses the backgroundColor/accentColor API
// format below -- no key conversion needed here.
const fetchGlobalStyle = async (): Promise<Partial<typeof DEFAULT_STYLE> | null> => {
  try {
    const res = await RequestService.httpGETRequest(`${WEB_BASE_URL}/style`);
    return res?.data?.styleData ?? null;
  } catch {
    return null;
  }
};

const fetchStyleTemplates = async (): Promise<StyleTemplateEntry[]> => {
  try {
    const res = await RequestService.httpGETRequest(`${WEB_BASE_URL}/style-templates`);
    const list = res?.data || [];
    return list.map((tpl: any) => ({
      id: tpl.id,
      isGlobal: !!tpl.isGlobal,
      styleConfig: apiStyleToConfig(tpl.styleData || {}),
    }));
  } catch {
    return [];
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

// ─── Branding logo footer — appended as an actual DOM node inside
// `.formio-form` (CSS vars alone can't render a logo). Idempotent: skipped if
// already present, removed if turned off.

const applyBrandingLogo = (style: typeof DEFAULT_STYLE): void => {
  document.querySelectorAll(`.${THEMED_FORM_CLASS} .formio-form`).forEach((formEl) => {
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useFormTheme = (formId: string | undefined) => {
  const [globalStyle, setGlobalStyle] = useState<Partial<typeof DEFAULT_STYLE> | null>(null);
  const [templates, setTemplates] = useState<StyleTemplateEntry[]>([]);
  const [formTemplateId, setFormTemplateId] = useState<number | null>(null);
  // undefined = not yet resolved (fall back to cache) — null = confirmed no override.
  const [formOverride, setFormOverride] = useState<typeof DEFAULT_STYLE | null | undefined>(
    formId ? readFromCache(formId) ?? undefined : undefined
  );

  // Global (tenant Default) style + named templates — fetched once; every
  // rendered form on this page needs the same list to resolve "which
  // template, if any, applies here".
  useEffect(() => {
    fetchGlobalStyle().then(setGlobalStyle);
    fetchStyleTemplates().then(setTemplates);
  }, []);

  useEffect(() => {
    if (!formId) return;

    const cached = readFromCache(formId);
    if (cached) setFormOverride(cached);

    RequestService.httpGETRequest(`${WEB_BASE_URL}/form/${formId}/style`)
      .then((res: any) => {
        const styleData = res?.data?.styleData;
        if (res?.data?.templateId !== undefined) {
          setFormTemplateId(res.data.templateId ?? null);
        }
        // An empty {} means "template assigned, no direct override" -- only
        // treat it as a real override when it has actual style keys, else it
        // would clobber the assigned/global template's style with defaults.
        const hasOverride = styleData && Object.keys(styleData).length > 0;
        setFormOverride(hasOverride ? apiStyleToConfig(styleData) : null);
      })
      .catch((err: any) => {
        if (err?.response?.status === 404 && !cached) {
          setFormTemplateId(null);
          setFormOverride(null);
        }
      });
  }, [formId]);

  // Resolve: DEFAULT_STYLE -> tenant Default -> assigned/global template -> per-form override.
  const effectiveStyle = useMemo(() => {
    const base = { ...DEFAULT_STYLE, ...globalStyle };
    const template = formTemplateId
      ? templates.find((tpl) => tpl.id === formTemplateId)
      : templates.find((tpl) => tpl.isGlobal) || null;
    const withTemplate = template ? { ...base, ...template.styleConfig } : base;
    return formOverride ? { ...withTemplate, ...formOverride } : withTemplate;
  }, [globalStyle, templates, formTemplateId, formOverride]);

  // useLayoutEffect — inject before browser paints to avoid background flash
  useLayoutEffect(() => {
    let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
    if (!tag) {
      tag = document.createElement("style");
      tag.id = STYLE_TAG_ID;
      document.head.appendChild(tag);
    }
    tag.textContent = buildScopedCSS(effectiveStyle);
  }, [effectiveStyle]);

  useEffect(() => {
    return () => { document.getElementById(STYLE_TAG_ID)?.remove(); };
  }, []);

  // Branding logo: re-applied on style change, and on any DOM mutation
  // anywhere in the document (wizard page navigation, async form load) since
  // Formio recreates the form element rather than mutating it in place.
  // Observing document.body (rather than only pre-existing `.ff-themed-form`
  // containers) matters because the themed wrapper is often rendered behind
  // a loading gate that resolves without `effectiveStyle` itself changing —
  // if we only looked for containers at the moment this effect first ran, a
  // container that mounts later would never get the badge injected at all.
  useLayoutEffect(() => {
    applyBrandingLogo(effectiveStyle);

    const observer = new MutationObserver(() => applyBrandingLogo(effectiveStyle));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [effectiveStyle]);

  return { themeClass: THEMED_FORM_CLASS };
};
