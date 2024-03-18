import { WEB_BASE_URL } from "./config";

const API = {
    GET_DASHBOARDS: `${WEB_BASE_URL}/dashboards`,
    GET_GROUPS: `${WEB_BASE_URL}/groups`,
    GET_ROLES: `${WEB_BASE_URL}/roles`,
    GET_USERS: `${WEB_BASE_URL}/user`,
    DASHBOARD_AUTHORIZATION: `${WEB_BASE_URL}/authorizations/dashboard`,
    USER_ROLE_GROUP_PERMISSION: `${WEB_BASE_URL}/user/<user_id>/permission/groups/<group_id>`,
    ADD_USER: `${WEB_BASE_URL}/user/add-tenant-user`,
}

export default API;