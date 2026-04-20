declare global {
  interface Window {
    _env_?: Record<string, string | undefined>;
  }
}

const env = (globalThis as unknown as Window)._env_;

export const WEB_BASE_URL = env?.REACT_APP_WEB_BASE_URL;
export const KEYCLOAK_URL = env?.REACT_APP_KEYCLOAK_URL;
export const KEYCLOAK_URL_HTTP_RELATIVE_PATH = env?.REACT_APP_KEYCLOAK_URL_HTTP_RELATIVE_PATH ?? '/auth';
export const KEYCLOAK_URL_AUTH = `${KEYCLOAK_URL ?? ""}${KEYCLOAK_URL_HTTP_RELATIVE_PATH}`;

export const KEYCLOAK_URL_REALM = env?.REACT_APP_KEYCLOAK_URL_REALM;
export const KEYCLOAK_CLIENT = env?.REACT_APP_KEYCLOAK_CLIENT;
export const MT_ADMIN_BASE_URL = env?.REACT_APP_MT_ADMIN_BASE_URL;
export const API_PROJECT_URL = env?.REACT_APP_API_PROJECT_URL;
export const MT_ADMIN_BASE_URL_VERSION = env?.REACT_APP_MT_ADMIN_BASE_URL_VERSION ?? "v1";
export const WEB_BASE_CUSTOM_URL = env?.REACT_APP_WEB_BASE_CUSTOM_URL ?? ""; 