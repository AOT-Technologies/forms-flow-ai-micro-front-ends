declare global {
    interface Window {
      _env_?: any;
    }
  }
  export const GRAPHQL_API =
  window._env_?.REACT_APP_GRAPHQL_API_URL ??
  (typeof process !== "undefined" ? process.env.REACT_APP_GRAPHQL_API_URL : undefined) ??
  "http://localhost:5500/queries";

  export const WEB_BASE_URL = window._env_?.REACT_APP_WEB_BASE_URL