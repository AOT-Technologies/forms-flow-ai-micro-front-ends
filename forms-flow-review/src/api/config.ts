declare global {
  interface Window {
    _env_?: any;
  }
}
let PROJECT_URL =
  window._env_?.REACT_APP_API_PROJECT_URL ||
  process.env.REACT_APP_API_PROJECT_URL ||
  "http://127.0.0.1:3001";
let API_URL =
  window._env_?.REACT_APP_API_SERVER_URL ||
  process.env.REACT_APP_API_SERVER_URL ||
  "http://127.0.0.1:3001";
export const WEB_BASE_URL = window._env_?.REACT_APP_WEB_BASE_URL
export const API_PROJECT_URL = window._env_?.REACT_APP_API_PROJECT_URL
export const KEYCLOAK_URL = window._env_?.REACT_APP_KEYCLOAK_URL
export const KEYCLOAK_URL_AUTH = `${KEYCLOAK_URL}/auth`
export const KEYCLOAK_URL_REALM = window._env_?.REACT_APP_KEYCLOAK_URL_REALM
export const KEYCLOAK_CLIENT = window._env_?.REACT_APP_KEYCLOAK_CLIENT
export const BPM_URL = window._env_?.REACT_APP_BPM_URL
export const BPM_BASE_URL_EXT = `${window._env_?.REACT_APP_BPM_URL}/engine-rest-ext`
export const CUSTOM_SUBMISSION_URL = window._env_?.REACT_APP_CUSTOM_SUBMISSION_URL
export const MT_ADMIN_BASE_URL = window._env_?.REACT_APP_MT_ADMIN_BASE_URL
export const MT_ADMIN_BASE_URL_VERSION =
  window._env_?.REACT_APP_MT_ADMIN_BASE_URL_VERSION ?? "v1";
export const AppConfig = {
  projectUrl: PROJECT_URL,
  apiUrl: API_URL,
};