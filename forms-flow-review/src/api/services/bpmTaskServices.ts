import API from "../endpoints";
import { RequestService } from "@formsflow/service";
import { replaceUrl } from "../../helper/helper";
import axios from "axios";
import { setBPMTaskDetail, setCustomSubmission, serviceActionError } from "../../actions/taskActions";
import { taskDetailVariableDataFormatter } from "./formatterService";

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
          if (responses[0]?.data) {
            let taskDetail = responses[0].data;
            if (responses[1]?.data) {
              let formId = responses[1].data.formId.value
              let taskDetailUpdates = responses[1]?.data;
              taskDetail = {
                ...taskDetailVariableDataFormatter(taskDetailUpdates),
                ...taskDetail,
                ...formId,
              };
            }
            dispatch(setBPMTaskDetail(taskDetail));
            done(null, taskDetail);
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