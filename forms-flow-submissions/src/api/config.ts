declare global {
    interface Window {
      _env_?: any;
    }
  }
  export const GRAPHQL_API =
  window._env_?.REACT_APP_API_GRAPHQL_URL ??
  (typeof process !== "undefined" ? process.env.REACT_APP_API_GRAPHQL_URL : undefined) ??
  "http://localhost:5500/queries";