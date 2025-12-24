import API from "../endpoints";
import { RequestService } from "@formsflow/service";
import { replaceUrl } from "../../helper/helper";
import axios from "axios";
import { setBPMTaskDetail, setCustomSubmission, serviceActionError, setAppHistoryLoading, setApplicationHistoryList, setTaskAssignee, setTaskDetailsLoading } from "../../actions/taskActions";
import { taskDetailVariableDataFormatter } from "./formatterService";


export const getOnlyTaskDetails = (taskId)=>{
    const apiUrlgetTaskDetail = replaceUrl(
    API.GET_BPM_TASK_DETAIL,
    "<task_id>",
    taskId
  );
  return RequestService.httpGETRequest(apiUrlgetTaskDetail);
}

export const getBPMTaskDetail = (taskId, ...rest) => {
  const done = rest.length ? rest[0] : () => { };
  const apiUrlgetTaskDetail = replaceUrl(
    API.GET_BPM_TASK_DETAIL,
    "<task_id>",
    taskId
  );

  const apiUrlgetTaskVariables = replaceUrl(
    API.GET_BPM_TASK_VARIABLES,
    "<task_id>",
    taskId
  );

  const taskDetailReq = RequestService.httpGETRequest(apiUrlgetTaskDetail);
  const taskDetailsWithVariableReq = RequestService.httpGETRequest(
    apiUrlgetTaskVariables
  );

  return (dispatch) => {
    axios
      .all([taskDetailReq, taskDetailsWithVariableReq])
      .then(
        axios.spread((...responses) => {
          let taskDetails = responses[0]?.data;
          const variablesDetails = responses[1]?.data;
          if (taskDetails) {
            if (variablesDetails) {
              let formId = variablesDetails?.formId?.value;
              let formType = variablesDetails?.formType?.value;
              taskDetails = {
                ...taskDetailVariableDataFormatter(variablesDetails),
                ...taskDetails,
                formId,
                formType,
              };
            }
            dispatch(setBPMTaskDetail(taskDetails));
            dispatch(setTaskAssignee(taskDetails.assignee));
            dispatch(setTaskDetailsLoading(false));
            done(null, taskDetails);

          }
        })
      )
      .catch((error) => {
        done(error);
      });
  };
};

export const getBPMGroups = (taskId, ...rest) => {
  const done = rest.length ? rest[0] : () => { };

  const apiUrlgetGroups = replaceUrl(API.BPM_GROUP, "<task_id>", taskId);

  return (dispatch) => {
    RequestService.httpGETRequest(`${apiUrlgetGroups}?type=candidate`)
      .then((responses) => {
        if (responses?.data) {
          const groups = responses.data;
          done(null, groups);
        } else {
          done(null, []);
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const onBPMTaskFormSubmit = (taskId, formReq, ...rest) => { 
  const done = rest.length ? rest[0] : () => { };
  const apiUrlOnFormSubmit = replaceUrl(
    API.BPM_FORM_SUBMIT,
    "<task_id>",
    taskId
  );
  return (dispatch) => {
    RequestService.httpPOSTRequest(apiUrlOnFormSubmit, formReq)
      .then((res) => {
        done(null, res.data);
      })
      .catch((error) => {
        console.log("Error", error);
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const onBPMTaskFormUpdate = (taskId, formReq, ...rest) => {
  const done = rest.length ? rest[0] : () => { };
  const apiUrlOnTaskUpdate = replaceUrl(
    API.BPM_TASK_UPDATE,
    "<task_id>",
    taskId
  );
  
  return (dispatch) => {
    RequestService.httpPOSTRequest(apiUrlOnTaskUpdate, formReq)
      .then((res) => {
        done(null, res.data);
      })
      .catch((error) => {
        console.log("Error", error);
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const getCustomSubmission = (submissionId, formId, ...rest) => {
  const done = rest.length ? rest[0] : () => { };
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

export const getApplicationHistory = (applicationId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  return (dispatch) => {
    const apiUrlAppHistory = replaceUrl(
      API.GET_APPLICATION_HISTORY_API,
      "<application_id>",
      applicationId
    );

    RequestService.httpGETRequest(apiUrlAppHistory, {} )
      .then((res) => {
        if (res.data) {
          const applications = res.data.applications;
          let data = applications.map((app) => {
            return { ...app };
          });
          dispatch(setApplicationHistoryList(data));
          dispatch(setAppHistoryLoading(false));
          done(null, res.data);
        } else {
          dispatch(serviceActionError(res));
          dispatch(setAppHistoryLoading(false));
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        dispatch(setAppHistoryLoading(false));
        done(error);
      });
  };
};