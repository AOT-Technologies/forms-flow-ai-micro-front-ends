/* istanbul ignore file */
import { RequestService } from "@formsflow/service";
import API from "../../endpoints/index";
import { KEYCLOAK_ENABLE_CLIENT_AUTH } from "../../constants";

export const fetchRoles = (callback, errorHandler) => {
    RequestService.httpGETRequest(API.GET_ROLES)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("No Roles found!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data?.message);
        } else {
          errorHandler("Failed to fetch roles!");
        }
      });
};
export const CreateRole = (payload, callback, errorHandler) => {
    RequestService.httpPOSTRequest(API.GET_ROLES, payload)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("Failed to post data!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data?.message);
        } else {
          errorHandler("Faied to post data!");
        }
      });
};
export const DeleteRole = (payload, callback, errorHandler) => {
  const roleIdentifier = KEYCLOAK_ENABLE_CLIENT_AUTH ? payload.name : payload.id;
    RequestService.httpDELETERequest(`${API.GET_ROLES}/${roleIdentifier}`)
      .then((res) => {
        if (res.data) {
          callback(res.data)
        } else {
          errorHandler("Failed to delete role!");
        }
      })
      .catch((error) => {
        if (error?.response?.data) {
          errorHandler(error.response.data?.message);
        } else {
          errorHandler("Faied to delete role!");
        }
      });
};

export const UpdateRole = (payload, callback, errorHandler) => {
  const roleIdentifier = KEYCLOAK_ENABLE_CLIENT_AUTH ? payload.name : payload.id;
  RequestService.httpPUTRequest(`${API.GET_ROLES}/${roleIdentifier}`, payload)
    .then((res) => {
      if (res.data) {
        callback(res.data)
      } else {
        errorHandler("Failed to update data!");
      }
    })
    .catch((error) => {
      if (error?.response?.data) {
        errorHandler(error.response.data?.message);
      } else {
        errorHandler("Faied to update data!");
      }
    });
};