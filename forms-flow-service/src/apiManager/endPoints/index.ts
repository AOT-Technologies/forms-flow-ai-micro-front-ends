import {
  WEB_BASE_URL,
  MT_ADMIN_BASE_URL,
  MT_ADMIN_BASE_URL_VERSION,
} from "../../constants/constants";

const API = {
  GET_TENANT_DATA: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/tenant`,
  FORMIO_ROLES: `${WEB_BASE_URL}/formio/roles`,
  GET_FEATURE_USAGE: `${MT_ADMIN_BASE_URL}/${MT_ADMIN_BASE_URL_VERSION}/features/<feature_key>/usage`,
};
export default API;
