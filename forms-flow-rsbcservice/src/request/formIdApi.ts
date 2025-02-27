import { RequestService } from "@formsflow/service";
import API from "../endpoints/index";
import { createRequestHeader } from "./requestHeaders";

export const fetchFormIDs = async (
    payload: any,
    callback: (response: any) => void,
    errorHandler: (error: string) => void
) => {
    const headers = await createRequestHeader();

    RequestService.httpPOSTRequest(API.FORM_ID_ALLOCATION, payload)
        .then((res: any) => {
            if (res.data) {
                callback(res.data);
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