/* istanbul ignore file */
import { RequestService } from "@formsflow/service";

import API from "../../endpoints/index";
import { AiPermissionsPayload } from "../../components/organization/AiPermissionsSection";

// Turns governed content on or off for the tenant (REV 4.4 / 4.6).
export const updateGovernedContentSetting = (
  tenantKey: string,
  enabled: boolean
): Promise<unknown> =>
  RequestService.httpPUTRequest(
    API.GOVERNED_CONTENT_SETTING.replace("<tenant_key>", tenantKey),
    { enabled }
  );

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
