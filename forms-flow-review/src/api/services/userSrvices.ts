import { fetchAndStoreFormioRoles } from "@formsflow/service";
import { setAccessForForm, setRoleIds } from "../../actions/roleActions";
import { MULTITENANCY_ENABLED } from "../../constants/index";
import { setTenantData } from "../../actions/tenantActions";

export const getFormioRoleIds = (...rest) => {
  const done = rest.length ? rest[0] : () => { };
  return (dispatch) => {
  fetchAndStoreFormioRoles() 
      .then((res) => {
        if (res?.data?.form && res.success) {


          const form = res.data.form;
          dispatch(setRoleIds(form));
          dispatch(setAccessForForm(form));
          if (MULTITENANCY_ENABLED) {
            dispatch(setTenantData(res.data));
          }
          done(null, form);
        } else {
          if (MULTITENANCY_ENABLED) {
            dispatch(setTenantData({}));
          }
          done(res.error, null);
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
