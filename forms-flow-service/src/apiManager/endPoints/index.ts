import {
  WEB_BASE_URL,
  MT_ADMIN_BASE_URL,
  MT_ADMIN_BASE_URL_VERSION,
} from "../../constants/constants";

const API = {
  GET_TENANT_DATA: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant`,
  FORMIO_ROLES: `${WEB_BASE_URL}/formio/roles`,
};
export default API;

