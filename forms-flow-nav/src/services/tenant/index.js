import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

export const fetchTenantDetails = (callback) => {
  RequestService.httpGETRequest(API.GET_TENANT_DATA)
    .then((res) => {
      // Ensure we have the response data
      if (res && res.data) {
        let tenant = {
          tenantId : res.data.key,
          tenantData: res.data
        }
        
        // Save tenantData to localStorage with the complete API response structure
        StorageService.save("tenantData", JSON.stringify(res.data));
        
        // Also save tenantKey for easy access
        if (res.data.key) {
          StorageService.save("tenantKey", res.data.key);
        }
        
        callback(tenant);
      } else {
        console.error("Invalid tenant data response:", res);
      }
    })
    .catch((err) => {
      console.error("Error fetching tenant details:", err);
    });
};
