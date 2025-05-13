import { WEB_BASE_URL, BPM_URL, BPM_BASE_URL_EXT , API_PROJECT_URL, CUSTOM_SUBMISSION_URL, MT_ADMIN_BASE_URL, MT_ADMIN_BASE_URL_VERSION  } from "./config";
const API = {
    BPM_BASE_URL_SOCKET_IO :`${BPM_URL}/forms-flow-bpm-socket`,
    FORM: `${WEB_BASE_URL}/form`,
    FORM_PROCESSES: `${WEB_BASE_URL}/form/formid`,
    GET_API_USER_LIST: `${WEB_BASE_URL}/user`,
    GET_BPM_PROCESS_LIST: `${BPM_BASE_URL_EXT}/v1/process-definition`,
    USER_ROLES: `${WEB_BASE_URL}/roles`,
    GET_BPM_TASK_FILTERS: `${BPM_BASE_URL_EXT}/v1/task-filters`,
    GET_FILTERS: `${WEB_BASE_URL}/filter`,
    GET_ATTRIBUTE_FILTERS: `${WEB_BASE_URL}/filter/<filter_id>`,
    UPDATE_DEFAULT_FILTER: `${WEB_BASE_URL}/user/default-filter`,
    GET_FORM_BY_ID: `${API_PROJECT_URL}/form`,
    GET_BPM_TASK_DETAIL: `${BPM_BASE_URL_EXT}/v1/task/<task_id>`,
    GET_BPM_TASK_VARIABLES: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/variables`,
    CUSTOM_SUBMISSION: `${CUSTOM_SUBMISSION_URL}/form/<form_id>/submission`,
    GET_TENANT_DATA: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant`,
    FORMIO_ROLES: `${WEB_BASE_URL}/formio/roles`,
    BPM_GROUP: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/identity-links`,
    BPM_FORM_SUBMIT: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/submit-form`,
    GET_FORM_BY_ALIAS:`${API_PROJECT_URL}/<form_path>`,
    CLAIM_BPM_TASK: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/claim`,
    UNCLAIM_BPM_TASK: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/unclaim`,
    UPDATE_ASSIGNEE_BPM_TASK: `${BPM_BASE_URL_EXT}/v1/task/<task_id>/assignee`,

    GET_APPLICATION_HISTORY_API: `${WEB_BASE_URL}/application/<application_id>/history`,
 }

export default API;