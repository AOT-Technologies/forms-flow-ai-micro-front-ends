import { RequestService } from "@formsflow/service";
import API from "../endpoints/index";
import { createRequestHeader } from "./requestHeaders";

export const getUserRoles = async (
  keycloak:any,
  callback: any,
  errorHandler: any
) => {
  const url = API.GET_ROLES;
  const headers = await createRequestHeader({"Authorization":"Bearer "+keycloak.token});
  RequestService.httpGETRequest(url, null, null, true, headers)
    .then((res: any) => {
      if (res.data) {
        callback(res.data);
      } else {
        errorHandler(`No user roles found!`);
      }
    })
    .catch((error: any) => {
      if (error?.response?.data) {
        errorHandler(error.response.data?.message);
      } else {
        errorHandler(`Failed to fetch user roles!`);
      }
    });
};
