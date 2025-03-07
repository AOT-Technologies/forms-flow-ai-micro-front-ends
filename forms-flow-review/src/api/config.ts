declare global {
    interface Window {
      _env_?: any;
    }
  }
export const WEB_BASE_URL = (window._env_ && window._env_.REACT_APP_WEB_BASE_URL) 
export const KEYCLOAK_URL = (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL) 
export const KEYCLOAK_URL_AUTH = `${KEYCLOAK_URL}/auth`
export const KEYCLOAK_URL_REALM = (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL_REALM) 
export const KEYCLOAK_CLIENT = (window._env_ && window._env_.REACT_APP_KEYCLOAK_CLIENT) 