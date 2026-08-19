/* istanbul ignore file */
import { RequestService } from "@formsflow/service";
import { WEB_BASE_URL } from "../../endpoints/config";
import { StyleConfig } from "@formsflow/components";

const STYLE_ENDPOINT = `${WEB_BASE_URL}/style`;
const TEMPLATES_ENDPOINT = `${WEB_BASE_URL}/style-templates`;
const templateUrl = (id: number) => `${TEMPLATES_ENDPOINT}/${id}`;
const globalUrl = (id: number) => `${TEMPLATES_ENDPOINT}/${id}/global`;
const clearGlobalUrl = () => `${TEMPLATES_ENDPOINT}/global`;

export interface StyleTemplate {
  id: number;
  name: string;
  tenant: string | null;
  isGlobal: boolean;
  styleData: StyleConfig;
  createdBy: string;
  created: string;
  modified: string | null;
}

// ── Global style (legacy single-style endpoint) ───────────────────────────────

export const fetchTenantStyle = (): Promise<StyleConfig | null> =>
  RequestService.httpGETRequest(STYLE_ENDPOINT)
    .then((res: any) => res?.data?.styleData ?? null)
    .catch(() => null);

export const saveTenantStyle = (style: StyleConfig): Promise<void> =>
  RequestService.httpPUTRequest(STYLE_ENDPOINT, { styleData: style })
    .then(() => undefined);

// ── Named style templates ─────────────────────────────────────────────────────

// Backend expects API format: backgroundColor/accentColor/buttonColor
// StyleConfig uses frontend format: background/accent/buttons
const toApiStyle = (config: StyleConfig) => ({
  backgroundColor: config.background,
  accentColor:     config.accent,
  buttonColor:     config.buttons,
  buttonShape:     config.buttonShape,
  headerFont:      config.headerFont,
  bodyFont:        config.bodyFont,
  brandingLogo:    config.brandingLogo,
});

// API response uses backgroundColor etc; convert back to StyleConfig for the UI
const fromApiStyle = (data: any): StyleConfig => ({
  background:   data.backgroundColor ?? data.background  ?? "",
  accent:       data.accentColor     ?? data.accent      ?? "",
  buttons:      data.buttonColor     ?? data.buttons     ?? "",
  buttonShape:  data.buttonShape     ?? "square",
  headerFont:   data.headerFont      ?? "sans",
  bodyFont:     data.bodyFont        ?? "sans",
  brandingLogo: data.brandingLogo    ?? "none",
});

const normalizeTemplate = (t: any): StyleTemplate => ({
  id:        t.id,
  name:      t.name,
  tenant:    t.tenant ?? null,
  isGlobal:  t.isGlobal || false,
  styleData: fromApiStyle(t.styleData || {}),
  createdBy: t.createdBy,
  created:   t.created,
  modified:  t.modified,
});

export const fetchStyleTemplates = (): Promise<StyleTemplate[]> =>
  RequestService.httpGETRequest(TEMPLATES_ENDPOINT)
    .then((res: any) => (res?.data ?? []).map(normalizeTemplate))
    .catch(() => []);

// Note: global status is never sent on create/update -- it's set exclusively
// via setStyleTemplateAsGlobal/clearGlobalStyleTemplate, one action at a time.
export const createStyleTemplate = (
  name: string,
  styleData: StyleConfig
): Promise<StyleTemplate> =>
  RequestService.httpPOSTRequest(TEMPLATES_ENDPOINT, {
    name,
    styleData: toApiStyle(styleData),
  }).then((res: any) => normalizeTemplate(res.data));

export const updateStyleTemplate = (
  id: number,
  name: string,
  styleData: StyleConfig
): Promise<StyleTemplate> =>
  RequestService.httpPUTRequest(templateUrl(id), {
    name,
    styleData: toApiStyle(styleData),
  }).then((res: any) => normalizeTemplate(res.data));

export const deleteStyleTemplate = (id: number): Promise<void> =>
  RequestService.httpDELETERequest(templateUrl(id))
    .then(() => undefined);

// Make this template the tenant's global (currently-applied) theme.
export const setStyleTemplateAsGlobal = (id: number): Promise<StyleTemplate> =>
  RequestService.httpPUTRequest(globalUrl(id), {})
    .then((res: any) => normalizeTemplate(res.data));

// Clear the tenant's global theme -- i.e. "Default" (no theme) is now active.
export const clearGlobalStyleTemplate = (): Promise<void> =>
  RequestService.httpDELETERequest(clearGlobalUrl())
    .then(() => undefined);
