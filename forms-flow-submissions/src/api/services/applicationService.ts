
import { RequestService, StorageService } from "@formsflow/service";
import API from "../endpoints";
import { replaceUrl } from "../../helper/helper";
import {setApplicationDetail, setCustomSubmission, setApplicationHistoryList, setUpdateHistoryLoader, serviceActionError } from "../../actions/applicationActions"


export const getApplicationById = (applicationId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};

  const apiUrlgetApplication = replaceUrl(
    API.GET_APPLICATION,
    "<application_id>",
    applicationId
  );

  return (dispatch) => {
    RequestService.httpGETRequest(apiUrlgetApplication)
      .then((res) => {
        console.log("Application API response:", res);

        // If the API nests the result under "application", extract it
        const application = res.data?.application || res.data;

        if (application && Object.keys(application).length) {
          dispatch(setApplicationDetail(application));
          done(null, application);
        } else {
          dispatch(setApplicationDetail({}));
          done("No application data found");
        }
      })
      .catch((error) => {
        console.error("Error fetching application details:", error);
        dispatch(setApplicationDetail({}));
        done(error);
      });
  };
};


export const fetchFormById = (id) => {
  const formioToken = localStorage.getItem("formioToken") ?? {};
  console.log("formio token", formioToken);
  let token = formioToken; 
    return RequestService.httpGETRequest(`${API.GET_FORM_BY_ID}/${id}`, {}, "", false, {
    ...token
  });
};

export const getCustomSubmission = (submissionId, formId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const submissionUrl = replaceUrl(API.CUSTOM_SUBMISSION, "<form_id>", formId);

  return (dispatch) => {
    RequestService.httpGETRequest(`${submissionUrl}/${submissionId}`, {})
      .then((res) => {
        if (res.data) {
          dispatch(setCustomSubmission(res.data));
        } else {
          dispatch(setCustomSubmission({}));
        }
      })
      .catch((err) => {
        done(err, null);
      });
  };
};

export const fetchApplicationAuditHistoryList = (applicationId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  return (dispatch) => {
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
        if (res.data) {
          const applications = res.data.applications;
          let data = applications.map((app) => {
            return { ...app };
          });
          dispatch(setApplicationHistoryList(data));
          dispatch(setUpdateHistoryLoader(false));
          done(null, res.data);
        } else {
          dispatch(serviceActionError(res));
          dispatch(setUpdateHistoryLoader(false));
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        dispatch(setUpdateHistoryLoader(false));
        done(error);
      });
  };
};

