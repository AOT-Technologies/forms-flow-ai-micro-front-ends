/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";

export const fetchdashboards = (callback, errorHandler) => {
    RequestService.httpGETRequest(API.GET_DASHBOARDS)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("No dashboards found!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data?.message);
        } else {
          errorHandler("Failed to fetch dashboards!");
        }
      });
};

export const fetchGroups = (callback, errorHandler) => {
    RequestService.httpGETRequest(API.GET_GROUPS)
      .then((res) => {
        if (res.data) {
          callback(res.data);
        } else {
          errorHandler("No groups found!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data?.message)
        } else {
          errorHandler("Failed to fetch groups!")
        }
      });
};

export const updateAuthorization = (data, callback, errorHandler) => {
    RequestService.httpPOSTRequest(API.DASHBOARD_AUTHORIZATION, data)
      .then((res) => {
        if (res.data) {
          callback();
        } else {
        errorHandler("Update failed!")
        }
      })
      .catch((error) => {
        errorHandler(error?.message)
      });
};

export const fetchAuthorizations = (callback, errorHandler) => {
    RequestService.httpGETRequest(API.DASHBOARD_AUTHORIZATION)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("No dashboard authorizations found!")
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error?.response?.data?.message)
        } else {
          errorHandler("Network error!")
        }
      });
};
