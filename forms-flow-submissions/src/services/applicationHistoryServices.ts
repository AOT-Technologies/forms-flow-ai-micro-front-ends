import API from "../api/endpoints";
import {
  setApplicationHistoryList,
  serviceActionError,
  setUpdateHistoryLoader,
} from "../actions/applicationHistoryActions";
import { StorageService, RequestService } from "@formsflow/service";
import { replaceUrl } from "../helper/helper";

export const fetchApplicationAuditHistoryList = (applicationId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};

  return (dispatch) => {
    dispatch(setUpdateHistoryLoader(true));

    const apiUrlAppHistory = replaceUrl(
      API.GET_APPLICATION_HISTORY_API,
      "<application_id>",
      applicationId
    );

    RequestService.httpGETRequest(
      apiUrlAppHistory,
      {},
      StorageService.get(StorageService.User.AUTH_TOKEN),
      true
    )
      .then((res) => {
        if (res.data?.applications) {
          dispatch(setApplicationHistoryList(res.data.applications));
          done(null, res.data);
        } else {
          dispatch(serviceActionError(res));
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        done(error);
      })
      .finally(() => {
        dispatch(setUpdateHistoryLoader(false));
      });
  };
};
