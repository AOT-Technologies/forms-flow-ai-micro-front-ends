const MULTITENANCY_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_MULTI_TENANCY_ENABLED) || false;
const KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE =
  (window._env_ && window._env_.REACT_APP_KEYCLOAK_ENABLE_CLIENT_AUTH) || false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true
    ? true
    : false;

export const CUSTOM_SUBMISSION_URL =
  (window._env_ && window._env_.REACT_APP_CUSTOM_SUBMISSION_URL) || "";

const CUSTOM_SUBMISSION_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_CUSTOM_SUBMISSION_ENABLED) ||
  process.env.REACT_APP_CUSTOM_SUBMISSION_ENABLED ||
  "";

export const CUSTOM_SUBMISSION_ENABLE =
  CUSTOM_SUBMISSION_ENABLED_VARIABLE === "true" ||
    CUSTOM_SUBMISSION_ENABLED_VARIABLE === true
    ? true
    : false;

export const KEYCLOAK_ENABLE_CLIENT_AUTH =
  KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE === "true" ||
  KEYCLOAK_ENABLE_CLIENT_AUTH_VARIABLE === true
    ? true
    : false;

export const BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : "/";
export const MAX_RESULTS = 15;

export const TASK_FILTER_LIST_DEFAULT_PARAM = {
  activeKey: "created", 
  name: { sortOrder: "asc" },
  assignee: { sortOrder: "asc" },
};


export const WEBSOCKET_ENCRYPT_KEY = `${
  window._env_?.REACT_APP_WEBSOCKET_ENCRYPT_KEY
}`;


export const ACCESSIBLE_FOR_ALL_GROUPS = 'Everybody';
export const PRIVATE_ONLY_YOU = 'Nobody(Keep it private)';
export const SPECIFIC_USER_OR_GROUP = 'Specific role';
export const CUSTOM_EVENT_TYPE = {
  RELOAD_TASKS: "reloadTasks",
  RELOAD_CURRENT_TASK: "reloadCurrentTask",
  CUSTOM_SUBMIT_DONE: "customSubmitDone",
  ACTION_COMPLETE: "actionComplete",
  CANCEL_SUBMISSION: "cancelSubmission",
};
