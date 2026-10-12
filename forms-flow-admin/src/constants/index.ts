const MULTITENANCY_ENABLED_VARIABLE =
  window._env_?.REACT_APP_MULTI_TENANCY_ENABLED || false;
const KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE =
  window._env_?.REACT_APP_KEYCLOAK_ENABLE_CLIENT_AUTH || false;

/** Supports both string "true" and boolean true from env injection */
const isEnabled = (v: string | false): boolean =>
  v === "true" || (v as unknown) === true;

export const MULTITENANCY_ENABLED = isEnabled(MULTITENANCY_ENABLED_VARIABLE);

// Offline forms (FFF-3): the env keys that allow the organization switches on
// Manage -> Organization. With a key off, its switch is hidden.
export const OFFLINE_ENABLED = isEnabled(
  window._env_?.REACT_APP_OFFLINE_ENABLED || false
);
export const OFFLINE_AUTO_SYNC_ENABLED =
  OFFLINE_ENABLED &&
  isEnabled(window._env_?.REACT_APP_OFFLINE_AUTO_SYNC_ENABLED || false);

export const KEYCLOAK_ENABLE_CLIENT_AUTH = isEnabled(
  KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE
);

export const BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : "/";

export const ADMIN_ROLE = "formsflow-admin";

export const URL_UPGRADE = window._env_?.REACT_APP_URL_UPGRADE || "";
export const URL_CONTACT_SALES =
  window._env_?.REACT_APP_URL_CONTACT_SALES || "";
export const URL_TERMS_AND_CONDITIONS =
  window._env_?.REACT_APP_URL_TERMS_AND_CONDITIONS || "";
export const URL_PRIVACY_POLICY =
  window._env_?.REACT_APP_URL_PRIVACY_POLICY || "";
