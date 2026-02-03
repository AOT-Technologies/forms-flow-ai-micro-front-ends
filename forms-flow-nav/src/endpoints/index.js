import { WEB_BASE_URL, MT_ADMIN_BASE_URL, MT_ADMIN_BASE_URL_VERSION } from "./config";

const API = {
    LANG_UPDATE: `${WEB_BASE_URL}/user/locale`,
    RESET_PASSWORD: (userId) => `${WEB_BASE_URL}/user/${userId}/reset-password`,
    GET_TENANT_DATA: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant`,
    INTEGRATION_ENABLE_DETAILS: `${WEB_BASE_URL}/integrations/embed/display`,
    USER_LOGIN_DETAILS: (userId) => `${WEB_BASE_URL}/user/${userId}/login-details`,
}

export default API;