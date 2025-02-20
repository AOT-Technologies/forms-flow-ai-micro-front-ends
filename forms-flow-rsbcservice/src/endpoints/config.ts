declare global {
  interface Window {
    _env_?: any;
  }
}

export const WEB_BASE_URL = window._env_?.REACT_APP_WEB_BASE_URL;

export const RSBC_API_URL = window._env_?.REACT_APP_RSBC_API_URL ?? "http://localhost:5100";

