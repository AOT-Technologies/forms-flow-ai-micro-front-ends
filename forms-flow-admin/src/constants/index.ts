const MULTITENANCY_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_MULTI_TENANCY_ENABLED) || false;
const KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE =
  (window._env_ && window._env_.REACT_APP_KEYCLOAK_ENABLE_CLIENT_AUTH) || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
  MULTITENANCY_ENABLED_VARIABLE === true
    ? true
    : false;

export const KEYCLOAK_ENABLE_CLIENT_AUTH =
  KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE === "true" ||
  KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE === true
    ? true
    : false;
const baseRoute = window._env_ && window._env_.REACT_APP_BASE_ROUTE;
export const APP_BASE_ROUTE = baseRoute ? "/" + baseRoute : "";
export const BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : `${APP_BASE_ROUTE}/`;

export const ADMIN_ROLE = "formsflow-admin";

export const DEFAULT_ROLES = [
  "/camunda-admin",
  "/formsflow",
  "/formsflow/formsflow-designer",
  "/formsflow/formsflow-reviewer",
  "/formsflow/formsflow-client",
  "/formsflow-admin"
];
