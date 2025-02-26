import { RequestService } from "@formsflow/service";
import API from "../endpoints/index";
import { createRequestHeader } from "./requestHeaders";

export const fetchFormIDs = async (
    payload: any, // Data payload for the POST request
    callback: (response: any) => void, // Callback for success response
    errorHandler: (error: string) => void // Callback for handling errors
) => {
    const headers = await createRequestHeader(); // Generate headers

    RequestService.httpPOSTRequest(API.FORM_ID_ALLOCATION, payload)
        .then((res: any) => {
            if (res.data) {
                callback(res.data); // Call success callback with response data
            } else {
                errorHandler(`No response received from ${API.FORM_ID_ALLOCATION}`);
            }
        })
        .catch((error: any) => {
            const errorMessage =
                error?.response?.data?.message || `Failed to fetch form IDs`;
            errorHandler(errorMessage);
        });
};