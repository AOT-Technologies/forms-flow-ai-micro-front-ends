import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  StyleConfig,
  DEFAULT_STYLE,
  THEMED_FORM_CLASS,
  injectFormThemeStyles,
  removeFormThemeStyles,
  applyBrandingLogo,
} from "../components/CustomComponents/Style/themeConstants";

const CACHE_PREFIX = "ff_form_style_";

interface StyleTemplateEntry {
  id: number;
  isGlobal: boolean;
  styleConfig: Partial<StyleConfig>;
}

// Minimal shape of RequestService.httpGETRequest -- passed in by the caller
// rather than imported, since @formsflow/components must not depend on
// @formsflow/service (leaf packages depend on components, never the reverse).
type HttpGetRequest = (url: string) => Promise<{ data?: any } | undefined>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Maps only the keys actually present on the API payload -- filling absent
// keys with DEFAULT_STYLE (rather than leaving them out) would make a
// partial override/template (e.g. only buttonColor set) clobber every OTHER
// inherited field when spread onto the resolved base style.
const apiStyleToConfig = (style: Record<string, any>): Partial<StyleConfig> => {
  const mapped: Partial<StyleConfig> = {
    background: style.backgroundColor ?? style.background,
    accent: style.accentColor ?? style.accent,
    buttons: style.buttonColor ?? style.buttons,
    buttonShape: style.buttonShape,
    headerFont: style.headerFont,
    bodyFont: style.bodyFont,
    brandingLogo: style.brandingLogo,
  };
  return Object.fromEntries(
    Object.entries(mapped).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<StyleConfig>;
};

const readFromCache = (formId: string): Partial<StyleConfig> | null => {
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

// Tenant-level "Default" theme, editable from Manage -> Style. Its style_data
// is stored in this same internal key format (background/accent/...), unlike
// per-form/template styleData which uses the backgroundColor/accentColor API
// format below -- no key conversion needed here.
const fetchGlobalStyle = async (
  httpGetRequest: HttpGetRequest,
  webBaseUrl: string | undefined
): Promise<Partial<StyleConfig> | null> => {
  try {
    const res = await httpGetRequest(`${webBaseUrl}/style`);
    return res?.data?.styleData ?? null;
  } catch {
    return null;
  }
};

const fetchStyleTemplates = async (
  httpGetRequest: HttpGetRequest,
  webBaseUrl: string | undefined
): Promise<StyleTemplateEntry[]> => {
  try {
    const res = await httpGetRequest(`${webBaseUrl}/style-templates`);
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Resolves and applies the effective form theme (tenant default -> assigned/
 * global template -> per-form override) as a scoped stylesheet, plus the
 * optional branding-logo footer badge.
 *
 * `httpGetRequest`/`webBaseUrl` are supplied by the caller (typically
 * `RequestService.httpGETRequest` and the package's own `WEB_BASE_URL`) so
 * this hook stays free of a dependency on @formsflow/service.
 */
export const useFormTheme = (
  formId: string | undefined,
  httpGetRequest: HttpGetRequest,
  webBaseUrl: string | undefined
) => {
  const [globalStyle, setGlobalStyle] = useState<Partial<StyleConfig> | null>(
    null
  );
  const [templates, setTemplates] = useState<StyleTemplateEntry[]>([]);
  const [formTemplateId, setFormTemplateId] = useState<number | null>(null);
  // undefined = not yet resolved (fall back to cache) — null = confirmed no override.
  const [formOverride, setFormOverride] = useState<
    Partial<StyleConfig> | null | undefined
  >(formId ? readFromCache(formId) ?? undefined : undefined);
  // Tracks the most recently requested formId so an in-flight fetch for a
  // form the caller has since navigated away from can recognise itself as
  // stale and skip applying its (possibly out-of-order) response.
  const latestFormIdRef = useRef(formId);

  // Global (tenant Default) style + named templates — fetched once; every
  // rendered form on this page needs the same list to resolve "which
  // template, if any, applies here".
  useEffect(() => {
    fetchGlobalStyle(httpGetRequest, webBaseUrl).then(setGlobalStyle);
    fetchStyleTemplates(httpGetRequest, webBaseUrl).then(setTemplates);
    // httpGetRequest/webBaseUrl are expected to be stable references from the
    // caller (e.g. a module-scope wrapper around RequestService.httpGETRequest
    // and WEB_BASE_URL) -- see callers in review/submissions.
  }, [httpGetRequest, webBaseUrl]);

  useEffect(() => {
    latestFormIdRef.current = formId;

    if (!formId) {
      setFormTemplateId(null);
      setFormOverride(undefined);
      return;
    }

    // Reset to this form's own cached value (or "unresolved") immediately —
    // otherwise the previous form's template/override stays active on
    // screen until this fetch resolves.
    const cached = readFromCache(formId);
    setFormTemplateId(null);
    setFormOverride(cached ?? undefined);

    httpGetRequest(`${webBaseUrl}/form/${formId}/style`)
      .then((res: any) => {
        if (latestFormIdRef.current !== formId) return; // superseded by a newer formId
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
        if (latestFormIdRef.current !== formId) return; // superseded by a newer formId
        if (err?.response?.status === 404 && !cached) {
          setFormTemplateId(null);
          setFormOverride(null);
        }
      });
  }, [formId, httpGetRequest, webBaseUrl]);

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
    injectFormThemeStyles(effectiveStyle);
  }, [effectiveStyle]);

  useEffect(() => {
    return () => removeFormThemeStyles();
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

    const observer = new MutationObserver(() =>
      applyBrandingLogo(effectiveStyle)
    );
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [effectiveStyle]);

  return { themeClass: THEMED_FORM_CLASS };
};
