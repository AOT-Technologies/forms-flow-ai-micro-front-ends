/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";
import { AiPermissionsPayload } from "../../components/organization/AiPermissionsSection";

export const updateAiPermissions = (
  tenantKey: string,
  data: AiPermissionsPayload,
  callback: (data?: unknown) => void,
  errorHandler: (message?: string) => void
) => {
  RequestService.httpPUTRequest(
    API.AI_PERMISSIONS.replace("<tenant_key>", tenantKey),
    data
  )
    .then((res) => {
      callback(res?.data);
    })
    .catch((error) => {
      if (error?.response?.data) {
        errorHandler(error.response.data?.message);
      } else {
        errorHandler("Failed to update AI permissions!");
      }
    });
};
