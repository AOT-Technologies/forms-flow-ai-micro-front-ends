import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

export const fetchPermissions = (callback, errorHandler) => {
  RequestService.httpGETRequest(
    API.GET_PERMISSIONS,
    null,
    StorageService.get(StorageService.User.AUTH_TOKEN)
  )
    .then((res) => {
      if (res.data) {
        callback(res.data);
      } else {
        errorHandler("No Permissions found!");
      }
    })
    .catch((error) => {
      if (error?.response?.data) {
        errorHandler(error.response.data?.message);
      } else {
        errorHandler("Failed to fetch permissions!");
      }
    });
};
