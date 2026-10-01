// NOTE: MULTITENANCY_ENABLED comes from "@formsflow/service" and
// CUSTOM_SUBMISSION_URL from "../api/config" — this module previously carried
// duplicate derivations of both (drift risk).
export const CUSTOM_SUBMISSION_ENABLE =
  String(window._env_?.REACT_APP_CUSTOM_SUBMISSION_ENABLED) === "true";
