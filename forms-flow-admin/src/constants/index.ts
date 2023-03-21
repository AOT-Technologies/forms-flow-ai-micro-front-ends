const MULTITENANCY_ENABLED_VARIABLE = (window._env_ && window._env_.REACT_APP_MULTI_TENANCY_ENABLED) || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true
    ? true
    : false;

export const BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : "/";

export const ADMIN_ROLE = "formsflow-admin";