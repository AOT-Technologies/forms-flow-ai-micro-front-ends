//import Keycloak from "keycloak-js";
import { Translation } from "react-i18next";
//application details
export const APPLICATION_NAME =
  (window._env_ && window._env_.REACT_APP_APPLICATION_NAME) ||
  "formsflow.ai";
//language details
export const LANGUAGE =
  (window._env_ && window._env_.REACT_APP_LANGUAGE) ||
  "en";
//Language list by user
export const USER_LANGUAGE_LIST =(window._env_ && window._env_?.USER_LANGUAGE_LIST) || "" ;
//custom url
export const WEB_BASE_CUSTOM_URL =
  (window._env_ && window._env_.REACT_APP_WEB_BASE_CUSTOM_URL) ||
  "";

export const CUSTOM_SUBMISSION_URL =
  (window._env_ && window._env_.REACT_APP_CUSTOM_SUBMISSION_URL) ||
  "";
const CUSTOM_SUBMISSION_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_CUSTOM_SUBMISSION_ENABLED) ||
  "";
export const CUSTOM_SUBMISSION_ENABLE =
  CUSTOM_SUBMISSION_ENABLED_VARIABLE === "true" ||
    CUSTOM_SUBMISSION_ENABLED_VARIABLE === true
    ? true
    : false;
//keycloak
export const Keycloak_Client =
  (window._env_ && window._env_.REACT_APP_KEYCLOAK_CLIENT) ||
  "forms-flow-web";

const MULTITENANCY_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_MULTI_TENANCY_ENABLED) ||
  false;
export const PUBLIC_WORKFLOW_ENABLED =
  (window._env_ && window._env_.REACT_APP_PUBLIC_WORKFLOW_ENABLED) === "true" 
    ? true
    : false;

export const MULTITENANCY_ENABLED =
  MULTITENANCY_ENABLED_VARIABLE === "true" ||
    MULTITENANCY_ENABLED_VARIABLE === true
    ? true
    : false;

export const BASE_ROUTE = MULTITENANCY_ENABLED ? "/tenant/:tenantId/" : "/";

export const Keycloak_Tenant_Client = "forms-flow-web";

export const KEYCLOAK_REALM =
  (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL_REALM) ||
  "forms-flow-ai";
export const KEYCLOAK_URL =
  (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL);


  export const ENABLE_FORMS_MODULE =
  window._env_?.REACT_APP_ENABLE_FORMS_MODULE === "false" ||
  window._env_?.REACT_APP_ENABLE_FORMS_MODULE === false
    ? false
    : true;

export const ENABLE_TASKS_MODULE =
  window._env_?.REACT_APP_ENABLE_TASKS_MODULE === "false" ||
  window._env_?.REACT_APP_ENABLE_TASKS_MODULE === false
    ? false
    : true;

export const ENABLE_DASHBOARDS_MODULE =
  window._env_?.REACT_APP_ENABLE_DASHBOARDS_MODULE === "false" ||
  window._env_?.REACT_APP_ENABLE_DASHBOARDS_MODULE === false
    ? false
    : true;

export const ENABLE_PROCESSES_MODULE =
  window._env_?.REACT_APP_ENABLE_PROCESSES_MODULE === "false" ||
  window._env_?.REACT_APP_ENABLE_PROCESSES_MODULE === false
    ? false
    : true;

export const ENABLE_APPLICATIONS_MODULE =
  window._env_?.REACT_APP_ENABLE_APPLICATIONS_MODULE === "false" ||
  window._env_?.REACT_APP_ENABLE_APPLICATIONS_MODULE === false
    ? false
    : true;

export const KEYCLOAK_URL_HTTP_RELATIVE_PATH =
    (window._env_ && window._env_.REACT_APP_KEYCLOAK_URL_HTTP_RELATIVE_PATH) || '/auth';
  
export const KEYCLOAK_AUTH_URL = `${KEYCLOAK_URL}${KEYCLOAK_URL_HTTP_RELATIVE_PATH}`;

export const CLIENT = "formsflow-client";
export const STAFF_DESIGNER = "formsflow-designer";
export const STAFF_REVIEWER = "formsflow-reviewer";
export const ANONYMOUS_USER = "anonymous";
export const ADMIN_ROLE = "formsflow-admin";

const INTEGRATION_ENABLED_VARIABLE =
  (window._env_ && window._env_.REACT_APP_ENABLE_INTEGRATION_PREMIUM) || false;

export const ENABLE_INTEGRATION_PREMIUM = INTEGRATION_ENABLED_VARIABLE === "true" ||
INTEGRATION_ENABLED_VARIABLE === true
  ? true
  : false;

export const OPERATIONS = {
  insert: {
    action: "insert",
    buttonType: "primary button_font",
    icon: "pencil",
    permissionsResolver: function permissionsResolver() {
      return true;
    },
    title: <Translation>{(t) => t("Submit New")}</Translation>,
  },
  submission: {
    action: "submission",
    buttonType: "outline-primary button_font",
    icon: "list-alt",
    permissionsResolver: function permissionsResolver() {
      return true;
    },
    title: <Translation>{(t) => t("View Submissions")}</Translation>,
  },
  edit: {
    action: "edit",
    buttonType: "secondary button_font",
    icon: "edit",
    permissionsResolver: function permissionsResolver() {
      return true;
    },

    title: <Translation>{(t) => t("Edit Form")}</Translation>,
  },
  viewForm: {
    action: "viewForm",
    buttonType: "outline-primary button_font",
    icon: "pencil-square-o",
    permissionsResolver: function permissionsResolver() {
      return true;
    },

    title: <Translation>{(t) => t("View/Edit Form")}</Translation>,
  },
  delete: {
    action: "delete",
    buttonType: " delete_button",
    icon: "trash",
    permissionsResolver: function permissionsResolver() {
      return true;
    },
  },
  view: {
    action: "viewSubmission",
    buttonType: "primary",
    icon: "list",
    permissionsResolver: function permissionsResolver() {
      return true;
    },

    title: <Translation>{(t) => t("View")}</Translation>,
  },
  editSubmission: {
    action: "edit",
    buttonType: "secondary",
    icon: "edit",
    permissionsResolver: function permissionsResolver() {
      return true;
    },

    title: <Translation>{(t) => t("Edit")}</Translation>,
  },
  deleteSubmission: {
    action: "delete",
    buttonType: "danger",
    icon: "trash",
    permissionsResolver: function permissionsResolver() {
      return true;
    },

    title: <Translation>{(t) => t("Delete")}</Translation>,
  },
};

export const PageSizes = [5, 10, 25, 50, 100, "all"];

// draft config
const DRAFT_POLLING_RATE_FROM_ENV = window._env_?.REACT_APP_DRAFT_POLLING_RATE;

export const DRAFT_POLLING_RATE = DRAFT_POLLING_RATE_FROM_ENV
  ? Number(DRAFT_POLLING_RATE_FROM_ENV)
  : null;
const DRAFT_ENABLED_VARIABLE = window._env_?.REACT_APP_DRAFT_ENABLED ||false;
export const DRAFT_ENABLED =
  DRAFT_ENABLED_VARIABLE === "true" || DRAFT_ENABLED_VARIABLE === true
    ? true
    : false;

// This is to check if the application is running in enterprise mode or not
export const IS_ENTERPRISE = window._env_?.REACT_APP_IS_ENTERPRISE || false;


export const USER_NAME_DISPLAY_CLAIM =
    window._env_?.REACT_APP_USER_NAME_DISPLAY_CLAIM;