import { GRAPHQL_API, WEB_BASE_URL} from "./config";
const API = {
      GRAPHQL_API: GRAPHQL_API,
      FORM: `${WEB_BASE_URL}/form`,
      FORM_PROCESSES: `${WEB_BASE_URL}/form/formid`,
      CREATE_OR_UPDATE_FILTER: `${WEB_BASE_URL}/submissions-filter`,
      UPDATE_DEFAULT_FILTER: `${WEB_BASE_URL}/user/default-filter`

 }

export default API;
