declare global {
    interface Window {
      _env_?: any;
    }
  }
export const WEB_BASE_URL = (window._env_ && window._env_.REACT_APP_WEB_BASE_URL) 
export const KEYCLOAK_URL = (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL) 
export const KEYCLOAK_URL_HTTP_RELATIVE_PATH = (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL_HTTP_RELATIVE_PATH) || '/auth';
export const KEYCLOAK_URL_AUTH = `${KEYCLOAK_URL}${KEYCLOAK_URL_HTTP_RELATIVE_PATH}`;

export const KEYCLOAK_URL_REALM = (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL_REALM) 
export const KEYCLOAK_CLIENT = (window._env_ && window._env_.REACT_APP_KEYCLOAK_CLIENT) 
export const MT_ADMIN_BASE_URL = (window._env_ && window._env_.REACT_APP_MT_ADMIN_BASE_URL) 
export const API_PROJECT_URL = (window._env_ && window._env_.REACT_APP_API_PROJECT_URL) 
export const MT_ADMIN_BASE_URL_VERSION = (window._env_ && window._env_.REACT_APP_MT_ADMIN_BASE_URL_VERSION) 
export const WEB_BASE_CUSTOM_URL = (window._env_ && window._env_.REACT_APP_WEB_BASE_CUSTOM_URL) || "" 