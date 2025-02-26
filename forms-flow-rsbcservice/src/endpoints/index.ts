import { RSBC_API_URL } from "./config";

const API = {
  GET_STATIC_DATA: `${RSBC_API_URL}/api/v1/static/<resource_name>`,
  GET_USER_DATA: `${RSBC_API_URL}/api/v1/users/<user_id>`,
  GET_USER_ROLES: `${RSBC_API_URL}/api/v1/user_roles`,
};

export default API;
