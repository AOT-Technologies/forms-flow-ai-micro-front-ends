export const DATE_FORMAT =
  (window as any)._env_ && (window as any)._env_.REACT_APP_DATE_FORMAT || "DD-MM-YYYY";

export const TIME_FORMAT =
(window as any)._env_ && (window as any)._env_.REACT_APP_TIME_FORMAT || "hh:mm:ss A";

const MULTITENANCY_ENABLED_VARIABLE =
  ((window as any)._env_ && (window as any)._env_.REACT_APP_MULTI_TENANCY_ENABLED) || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true
    ? true
    : false;