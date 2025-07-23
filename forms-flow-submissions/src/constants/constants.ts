export const CUSTOM_SUBMISSION_URL =
  window._env_?.REACT_APP_CUSTOM_SUBMISSION_URL || "";

export const MULTITENANCY_ENABLED =
  String(window._env_?.REACT_APP_MULTI_TENANCY_ENABLED) === "true";

export const CUSTOM_SUBMISSION_ENABLE =
  String(window._env_?.REACT_APP_CUSTOM_SUBMISSION_ENABLED) === "true";
  