import { WEB_BASE_URL, BPM_URL, BPM_BASE_URL_EXT , API_PROJECT_URL} from "./config";

const API = {
    BPM_BASE_URL_SOCKET_IO :`${BPM_URL}/forms-flow-bpm-socket`,
    FORM: `${WEB_BASE_URL}/form`,
    FORM_PROCESSES: `${WEB_BASE_URL}/form/formid`,
    GET_API_USER_LIST: `${WEB_BASE_URL}/user`,
    GET_BPM_PROCESS_LIST: `${BPM_BASE_URL_EXT}/v1/process-definition`,
    USER_ROLES: `${WEB_BASE_URL}/roles`,
    GET_BPM_TASK_FILTERS: `${BPM_BASE_URL_EXT}/v1/task-filters`,
    GET_FILTERS: `${WEB_BASE_URL}/filter`,
    UPDATE_DEFAULT_FILTER: `${WEB_BASE_URL}/user/default-filter`,
    GET_FORM_BY_ID: `${API_PROJECT_URL}/form`,
 }

export default API;