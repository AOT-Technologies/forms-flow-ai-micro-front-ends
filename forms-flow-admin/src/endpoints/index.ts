import { WEB_BASE_URL, MT_ADMIN_BASE_URL, MT_ADMIN_BASE_URL_VERSION } from "./config";

const API = {
    GET_DASHBOARDS: `${WEB_BASE_URL}/dashboards`,
    GET_GROUPS: `${WEB_BASE_URL}/groups`,
    GET_ROLES: `${WEB_BASE_URL}/roles`,
    GET_USERS: `${WEB_BASE_URL}/user`,
    DASHBOARD_AUTHORIZATION: `${WEB_BASE_URL}/authorizations/dashboard`,
    USER_ROLE_GROUP_PERMISSION: `${WEB_BASE_URL}/user/<user_id>/permission/groups/<group_id>`,
    ADD_USER: `${WEB_BASE_URL}/user/add-user`,
    INVITE_USER: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenants/<tenant_key>/invite-user`,
    BILLING_PRICING_SESSION: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenants/<tenant_key>/billing/pricing-session`,
    BILLING_PORTAL_SESSION: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenants/<tenant_key>/billing/portal-session`,
    BILLING_RESOLVE_CUSTOMER: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenants/billing/resolve-customer`,
    BILLING_RETURN: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenants/billing/return`,
    GET_PERMISSIONS:`${WEB_BASE_URL}/roles/permissions`,
}

export default API;