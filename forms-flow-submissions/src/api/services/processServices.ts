
import { replaceUrl } from "../../helper/helper";
import { StorageService, RequestService } from "@formsflow/service";
import API from "../endpoints";
import {setProcessActivityData, setProcessActivityLoadError} from "../../actions/processActions"

export const getProcessActivities = (process_instance_id, ...rest) => {
  const done = rest.length ? rest[0] : () => { };
  const apiUrlProcessActivities = replaceUrl(
    API.PROCESS_ACTIVITIES,
    "<process_instance_id>",
    process_instance_id
  );
  return (dispatch) => {
    RequestService.httpGETRequest(
      apiUrlProcessActivities,
      {},
      StorageService.get(StorageService.User.AUTH_TOKEN),
      true
    )
      .then((res) => {
        if (res.data) {
          dispatch(setProcessActivityData(res.data.childActivityInstances));
          dispatch(setProcessActivityLoadError(false));
        } else {
          dispatch(setProcessActivityData(null));
          dispatch(setProcessActivityLoadError(true));
        }
        done(null, res.data);
      })
      .catch((error) => {
        done(error);
        dispatch(setProcessActivityData(null));
        dispatch(setProcessActivityLoadError(true));
      });
  };
};

export const getProcessDetails = ({processKey, tenant_key = null, mapperId = null}) => {
  const api = API.GET_PROCESS_XML;
  let url = replaceUrl(api, "<process_key>", processKey);

  const params = [];
  if (tenant_key) params.push(`tenantId=${tenant_key}`);
  if (mapperId) params.push(`mapperId=${mapperId}`);

  if (params.length) {
    url += `?${params.join("&")}`;
  }

  return RequestService.httpGETRequest(url);
};