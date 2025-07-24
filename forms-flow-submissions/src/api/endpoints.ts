import { GRAPHQL_API, WEB_BASE_URL, PROJECT_URL, CUSTOM_SUBMISSION_URL, BPM_BASE_URL_EXT, } from "./config";
const API = {
      GRAPHQL_API: GRAPHQL_API,
      GET_APPLICATION: `${WEB_BASE_URL}/application/<application_id>`,
      GET_FORM_BY_ID: `${PROJECT_URL}/form`,
      CUSTOM_SUBMISSION: `${CUSTOM_SUBMISSION_URL}/form/<form_id>/submission`,
      GET_APPLICATION_HISTORY_API: `${WEB_BASE_URL}/application/<application_id>/history`,
      PROCESS_ACTIVITIES: `${BPM_BASE_URL_EXT}/v1/process-instance/<process_instance_id>/activity-instances`,
      GET_PROCESS_XML: `${WEB_BASE_URL}/process/key/<process_key>`,
      FORM: `${WEB_BASE_URL}/form`,
      FORM_PROCESSES: `${WEB_BASE_URL}/form/formid`
 }

export default API;