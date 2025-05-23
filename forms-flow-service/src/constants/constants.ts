export const DATE_FORMAT =
  (window as any)._env_ && (window as any)._env_.REACT_APP_DATE_FORMAT || "YYYY-MM-DD";

export const TIME_FORMAT =
(window as any)._env_ && (window as any)._env_.REACT_APP_TIME_FORMAT || "HH:mm:ss";

const baseRoute = (window as any)._env_ && (window as any)._env_.REACT_APP_BASE_ROUTE;
export const APP_BASE_ROUTE = baseRoute ? "/" + baseRoute : "";

const MULTITENANCY_ENABLED_VARIABLE = (window as any)._env_?.REACT_APP_MULTI_TENANCY_ENABLED || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true

//application details
export const APPLICATION_NAME =
  (window as any)._env_?.REACT_APP_APPLICATION_NAME ?? "formsflow.ai";

// Used in encyrpting and decrypting the token from local storage.
export const TOKEN_ENCRYPTION_KEY = (window as any)._env_
  ?.REACT_APP_TOKEN_ENCRYPTION_KEY;

//default value for FORMIO_JWT_EXPIRE
export const DEFAULT_FORMIO_JWT_EXPIRE = 240;

// Used for jwt token refresh.
export const FORMIO_JWT_EXPIRE =
  (window as any)._env_?.REACT_APP_FORMIO_JWT_EXPIRE ??
  DEFAULT_FORMIO_JWT_EXPIRE;

export const WEB_BASE_URL =
  (window as any)._env_?.REACT_APP_WEB_BASE_URL ?? "http://localhost:5000";
export const API = {
  FORMIO_ROLES: `${WEB_BASE_URL}/formio/roles`,
};
