import { RequestService } from "@formsflow/service";
import API from "../endpoints/index";
import { createRequestHeader } from "./requestHeaders";

export const getUserData = async (
  userId: string,
  callback: any,
  errorHandler: any
) => {
  const url = API.GET_USER_DATA.replace("<user_id>", userId);
  const headers = await createRequestHeader();
  RequestService.httpGETRequest(url, null, null, true, headers)
    .then((res: any) => {
      if (res.data) {
        callback(res.data);
      } else {
        errorHandler(`No user data with ${userId} userId is found!`);
      }
    })
    .catch((error: any) => {
      if (error?.response?.data) {
        errorHandler(error.response.data?.message);
      } else {
        errorHandler(`Failed to fetch user data with ${userId} userId!`);
      }
    });
};
