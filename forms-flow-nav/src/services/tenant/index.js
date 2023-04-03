import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

export const fetchTenantDetails = (callback) => {
  RequestService.httpGETRequest(API.GET_TENANT_DATA)
    .then((res) => {
      let tenant = {
        tenantId : res.data.key,
        tenantData: res.data
      }
      callback(tenant);
      StorageService.save("TENANT_DATA", JSON.stringify(res.data))
    })
    .catch((err) => console.log(err));
};
