import { StorageService } from "@formsflow/service";
import { FORM_GOVERNANCE_ENABLED, MULTITENANCY_ENABLED } from "../../constants";

// Whether governed content is on for the tenant (REV 4). Nothing is on unless
// REACT_APP_ENABLE_FORM_GOVERNANCE is set. Then the tenant record carries it as
// details.governed_content, off until an admin turns it on. Single-tenant
// deployments have no tenant record, so the env alone decides there.

export const GOVERNED_CONTENT_SETTING = "governed_content";

/** Tenant flags may arrive as booleans or as "true"/"false" strings. */
const isTruthyFlag = (flag: unknown): boolean =>
  flag === true || flag === "true";

export const isGovernedContentOn = (
  tenantData?: Record<string, any> | null
): boolean => {
  if (!FORM_GOVERNANCE_ENABLED) return false;
  if (!MULTITENANCY_ENABLED) return true;
  const source = { ...tenantData, ...tenantData?.details };
  return isTruthyFlag(source[GOVERNED_CONTENT_SETTING]);
};

/** Reads the setting from the tenant record cached by the Organization tab and home page. */
export const readCachedGovernedContentOn = (): boolean => {
  try {
    const cached = StorageService.get("tenantData");
    return isGovernedContentOn(cached ? JSON.parse(cached) : null);
  } catch (error) {
    console.error("Error parsing tenantData:", error);
    return isGovernedContentOn(null);
  }
};
