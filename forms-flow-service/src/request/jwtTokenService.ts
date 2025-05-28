import RequestService from "./requestService";
import { API } from "../constants/constants";

export const getUpdatedJwtToken = async (): Promise<any> => {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await RequestService.httpGETRequest(
        API.FORMIO_ROLES,
        null,
        null
      );
      if (response) {
        return response;
      } else {
        console.warn(`Attempt ${attempt}: No user roles found!`);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ?? "Unknown error";
      console.warn(`Attempt ${attempt} failed: ${errorMessage}`);

      // If it's the last attempt, throw the error
      if (attempt === MAX_RETRIES) {
        console.error("Max retries reached. Giving up.");
        throw error;
      }

      // a small delay before retrying
      await new Promise((res) => setTimeout(res, 500));
    }
  }
  return null; // Just in case all retries fail without throwing
};

