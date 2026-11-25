/**
 * AI submission assistant: shared visibility rules.
 *
 * The feature is gated at two levels:
 *  - Deployment: REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED. This decides whether any AI
 *    assistant UI exists at all (the admin "AI settings" section, the form designer
 *    "Context" tab).
 *  - Tenant (multi-tenant only): `submission_assistant` on the tenant record, set by the
 *    organization admin. This decides whether the assistant is actually usable (Context tab
 *    content, the assistant on the submission and preview pages). Single-tenant has no
 *    tenant record, so the deployment flag alone decides there.
 *
 * Env values are read at call time so the result follows window._env_ as injected by the host.
 */

const isTruthyFlag = (value: unknown): boolean => value === true || value === "true";

const readEnvFlag = (name: string): boolean =>
  isTruthyFlag((window as any)._env_?.[name]);

/** Shape of the tenant record, narrowed to the fields used here. */
export interface AiAssistantTenantData {
  submission_assistant?: boolean | string;
  details?: { submission_assistant?: boolean | string; [key: string]: unknown } | null;
  [key: string]: unknown;
}

/**
 * Deployment-level gate: the AI assistant env flag is on.
 * Use for the admin AI settings section and the designer Context tab.
 */
export const isAiAssistantFeatureEnabled = (): boolean =>
  readEnvFlag("REACT_APP_SUBMISSION_AI_ASSISTANT_ENABLED");

/**
 * Tenant-level gate: the organization has the submission assistant switched on.
 * The flag may sit on the record itself or under `details`; `details` wins.
 * Always true in single-tenant, where there is no tenant record.
 * Use to decide between the Context tab's zero state and its editable content.
 */
export const isSubmissionAssistantEnabledForTenant = (
  tenantData?: AiAssistantTenantData | null
): boolean => {
  if (!readEnvFlag("REACT_APP_MULTI_TENANCY_ENABLED")) return true;
  return isTruthyFlag(
    tenantData?.details?.submission_assistant ?? tenantData?.submission_assistant
  );
};

/**
 * Both gates: the assistant may be rendered on the submission and preview pages.
 */
export const canShowSubmissionAssistant = (
  tenantData?: AiAssistantTenantData | null
): boolean =>
  isAiAssistantFeatureEnabled() && isSubmissionAssistantEnabledForTenant(tenantData);
