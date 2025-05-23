import RequestService from "./requestService";
import { API } from "../constants/constants";

export const getUpdatedJwtToken = async (): Promise<any> => {
  try {
    const response = await RequestService.httpGETRequest(
      API.FORMIO_ROLES,
      null,
      null
    );
    if (response) {
      return response;
    } else {
      console.log(`No user roles found!`);
      return null;
    }
  } catch (error: any) {
    if (error?.response?.data) {
      console.log(error.response.data?.message);
    } else {
      console.log(`Failed to fetch user roles!`);
    }
    throw error;
  }
};
