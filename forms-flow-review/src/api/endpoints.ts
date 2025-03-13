import { WEB_BASE_URL } from "./config";

const API = {
    SAMPLE:`${WEB_BASE_URL}/sample`,
    BPM_BASE_URL_SOCKET_IO :`${window._env_?.REACT_APP_BPM_URL}/forms-flow-bpm-socket`
}

export default API;