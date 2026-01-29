import { WEB_BASE_URL, MT_ADMIN_BASE_URL, MT_ADMIN_BASE_URL_VERSION } from "./config";

const API = {
    LANG_UPDATE: `${WEB_BASE_URL}/user/locale`,
    GET_TENANT_DATA: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant`,
    INTEGRATION_ENABLE_DETAILS: `${WEB_BASE_URL}/integrations/embed/display`,
    USER_PROFILE_UPDATE: `${WEB_BASE_URL}/user/<user_id>/profile`
}

export default API;