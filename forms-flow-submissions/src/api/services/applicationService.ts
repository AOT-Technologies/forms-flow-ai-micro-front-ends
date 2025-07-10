
import { RequestService, StorageService } from "@formsflow/service";
import API from "../endpoints";
import { replaceUrl } from "../../helper/helper";
import {setApplicationDetail, setCustomSubmission, setApplicationHistoryList, setUpdateHistoryLoader, serviceActionError, setApplicationDetailLoading } from "../../actions/applicationActions"


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
        // If the API nests the result under "application", extract it
        const application = res.data?.application || res.data;

        if (application && Object.keys(application).length) {
          dispatch(setApplicationDetail(application));
          dispatch(setApplicationDetailLoading(false));
          done(null, application);
        } else {
          dispatch(setApplicationDetail({}));
          dispatch(setApplicationDetailLoading(false));
          done("No application data found");
        }
      })
      .catch((error) => {
        console.error("Error fetching application details:", error);
        dispatch(setApplicationDetail({}));
        dispatch(setApplicationDetailLoading(false));
        done(error);
      });
  };
};


export const fetchFormById = (id) => {
  const formioToken = localStorage.getItem("formioToken") ?? {};
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

export const getRoles = () => {
  const allRoles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE) ?? "[]");

  return {
    viewSubmissionHistory: allRoles.includes("submission_view_history"),
    analyze_submissions_view_history: allRoles.includes("analyze_submissions_view_history"),
    analyze_process_view: allRoles.includes("analyze_process_view"),
    // add more as needed
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

