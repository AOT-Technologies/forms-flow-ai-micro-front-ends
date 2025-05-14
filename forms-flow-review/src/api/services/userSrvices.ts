import API from "../../api/endpoints";
import { StorageService, RequestService } from "@formsflow/service";
import { setAccessForForm, setRoleIds } from "../../actions/roleActions";
import { MULTITENANCY_ENABLED } from "../../constants/index";
import { setTenantData } from "../../actions/tenantActions";

export const getFormioRoleIds = (...rest) => {
  const done = rest.length ? rest[0] : () => { };
  const url = MULTITENANCY_ENABLED ? API.GET_TENANT_DATA : API.FORMIO_ROLES;
  return (dispatch) => {
    RequestService.httpGETRequest(
      url,
      {},
      StorageService.get(StorageService.User.AUTH_TOKEN),
      true
    )
      .then((res) => {
        const token = res.headers["x-jwt-token"];
        if (res?.data?.form && token) {
          StorageService.save("formioToken", token);
          localStorage.setItem("roleIds", JSON.stringify(res.data.form));
          dispatch(setRoleIds(res.data?.form));
          dispatch(setAccessForForm(res.data?.form));
          if (MULTITENANCY_ENABLED) {
            dispatch(setTenantData(res.data));
          }
          done(null, res.data.form);
        } else {
          if (MULTITENANCY_ENABLED) {
            dispatch(setTenantData({}));
          }
          done(res, null);
        }
      })
      .catch((error) => {
        if (MULTITENANCY_ENABLED) {
          dispatch(setTenantData({}));
        }
        done(error, null);
      });
  };
};
