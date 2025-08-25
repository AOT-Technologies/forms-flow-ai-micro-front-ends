import { RequestService, StorageService } from "@formsflow/service";
import { MULTITENANCY_ENABLED } from "../../constants/constants";
import API from "../endPoints/index"

export interface RoleMapping {
  roleId: string;
  type: string;
}

export type FormioRole = RoleMapping[];

// Define structure of tenant data response
export interface TenantData {
  form?: FormioRole;
  [key: string]: any;
}

// Define structure of API response from httpGETRequest
interface ApiResponse {
  headers: { [key: string]: string | undefined };
  data: TenantData;
}

// Define return type
interface FetchResult {
  success: boolean;
  data?: TenantData;
  error?: any;
}

/**
 * Fetches Formio roles (or tenant data if multitenancy is enabled),
 * saves the token and roles to storage, and returns the result.
 */
export const fetchAndStoreFormioRoles = async (): Promise<FetchResult> => {
  const url = MULTITENANCY_ENABLED ? API.GET_TENANT_DATA : API.FORMIO_ROLES;

  try {
    const response = await RequestService.httpGETRequest(
      url,
      {},
      StorageService.get(StorageService.User.AUTH_TOKEN),
      true
    ) as ApiResponse;
    console.log("response",response);
    const token = response?.headers?.["x-jwt-token"];
    const form = response?.data?.form;

    if (form && token) {
      StorageService.save("formioToken", token);
      localStorage.setItem("roleIds", JSON.stringify(form));
      return { success: true, data: response.data };
    } else {
      return { success: false, data: response.data };
    }
  } catch (error: any) {
    return { success: false, error };
  }
};