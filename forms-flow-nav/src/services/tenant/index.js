import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

/**
 * Handles ES_TENANT event subscription logic
 * Updates tenant state and saves tenantData/tenantKey to localStorage
 * @param {Object} data - Event data containing tenantData and/or tenantId
 * @param {Function} setTenant - State setter function for tenant
 */
export const handleTenantSubscription = (data, setTenant) => {
  if (data) {
    setTenant(data);
    // Always update tenantData with the latest data from the API response
    if (data.tenantData) {
      StorageService.save("tenantData", JSON.stringify(data.tenantData));
    }
    // Also update tenantKey if tenantId is provided
    if (data.tenantId) {
      StorageService.save("tenantKey", data.tenantId);
    }
  }
};

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
