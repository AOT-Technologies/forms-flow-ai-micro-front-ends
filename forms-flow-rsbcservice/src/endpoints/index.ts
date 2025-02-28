import { RSBC_API_URL } from "./config";

const API = {
  GET_STATIC_DATA: `${RSBC_API_URL}/api/v1/static/<resource_name>`,
  GET_USER_DATA: `${RSBC_API_URL}/api/v1/admin/users`,
  GET_USER_ROLES_DATA: `${RSBC_API_URL}/api/v1/admin/users`,
  FORM_ID_ALLOCATION: `${RSBC_API_URL}/api/v1/forms`,
};

export default API;
