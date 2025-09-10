import API from "../endpoints";
import { StorageService, RequestService } from "@formsflow/service";
import {
  setAttributeFilterList,
  setBPMUserList,
  serviceActionError,
  setBPMTaskList,
  setBPMTaskCount,
  setBPMTaskLoader,
  setVisibleAttributes,
  setBPMTaskDetailUpdating,
  setBPMFiltersAndCount,
  setLastReqPayload,
} from "../../actions/taskActions";
import { MAX_RESULTS } from "../../constants";
import { replaceUrl } from "../../helper/helper";
import { cloneDeep } from "lodash";
export const fetchUserList = (...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const getReviewerUserListApi = `${API.GET_API_USER_LIST}?permission=manage_tasks`;
  return (dispatch) => {
    RequestService.httpGETRequest(getReviewerUserListApi)
      .then((res) => {
        if (res.data) {
          dispatch(setBPMUserList(res.data));
          done(null, res.data);
        } else {
          dispatch(serviceActionError(res));
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const getUserRoles = () => {
  const url = API.USER_ROLES;
  return RequestService.httpGETRequest(url);
};

const handleTaskError = (dispatch, error) => {
  dispatch(serviceActionError(error));
};

const clearTableData = (dispatch) => {
  dispatch(setBPMTaskList([]));
  dispatch(setBPMTaskCount(0));
}

/**
 * Fetches the task list from the server and updates the redux store with the task list and count.
 * @param {Object} reqData - The request data to be sent to the server.
 * @param {string} taskIdToRemove - The task ID to be removed from the task list.
 * @param {number} pageNo - The current page number.
 * @param {number} maxResults - The maximum number of results to be fetched.
 * @param {function} done - A callback function to be called after the request is completed.
 */


let currentTaskFetchAbortController = null;

export const fetchServiceTaskList = (
  reqData,
  taskIdToRemove,
  pageNo,
  maxResults,
  ...rest
) => {
  const done = rest.length ? rest[0] : () => {};
  // create the firstResult value based on the page number and maxResults
  // firstResult = (pageNo - 1) * maxResults
  const firstResultIndex = getFirstResultIndex(pageNo, maxResults);

  const apiUrlgetTaskList = `${
    API.GET_BPM_TASK_FILTERS
    }?firstResult=${firstResultIndex}&maxResults=${maxResults ?? MAX_RESULTS}`;
  return (dispatch) => {
    //  dispatch(setBPMTaskLoader(true));
    let abortFlag = 0;
    // implemented for multiples api call prevention
    if (currentTaskFetchAbortController) {
      abortFlag = 1;
      currentTaskFetchAbortController.abort();
    }

    currentTaskFetchAbortController = new AbortController();
    const signal = currentTaskFetchAbortController.signal;

    dispatch(setLastReqPayload(reqData));
    // [TBD: need to fix properly ]if name is available in reqData, we need to set it to the name property of reqData
    // this will cause an issue like if the name will come may be two times one form task name and one form form component key
    const clonedReqData = cloneDeep(reqData);
    let criteria = clonedReqData?.criteria ?? {};
    let taskName = null;
    const updatedVariables = criteria.processVariables?.filter(
      (variable) => {
        // Only move task name (isFormVariable: false) to nameLike, keep form variables (isFormVariable: true) in processVariables
        if( variable.name === "name" && !variable.isFormVariable) {
          taskName = variable;
          return false; // Remove from processVariables
        }
        return true; // Keep all other variables including form variables with name "name"
      }
    );

    // Clean up process variables by removing the isFormVariable metadata before sending to API
    const cleanedVariables = updatedVariables?.map(variable => {
      const { isFormVariable, ...cleanVariable } = variable;
      return cleanVariable;
    });

    clonedReqData["criteria"] = {
      ...criteria,
      processVariables: cleanedVariables,
    };

    if (taskName) {
      clonedReqData.criteria["nameLike"] = taskName.value;
    }
    //-----------------------------------
    RequestService.httpPOSTRequestWithHAL(
      apiUrlgetTaskList,
      clonedReqData,
      StorageService.get(StorageService.User.AUTH_TOKEN),
      true,
      signal
    )
      .then((res) => {
        if (res.data) {
          let responseData = res.data;
          const _embedded = responseData[0]?._embedded; // data._embedded.task is where the task list is.
          if (!_embedded?.task || !responseData?.[0]?.count) {
            // Display error if the necessary values are unavailable.
            // handleTaskError(dispatch, res);
            // Clear table data if the response has count as 0 or if response has empty tasks
            clearTableData(dispatch);
          } else {
            const taskListFromResponse = _embedded["task"]; // Gets the task array
            const taskCount = {
              count: responseData[0]?.count,
            };
            let taskData = taskListFromResponse;
            if (taskIdToRemove) {
              //if the list has the task with taskIdToRemove remove that task and decrement
              if (
                taskListFromResponse.find((task) => task.id === taskIdToRemove)
              ) {
                taskData = taskListFromResponse.filter(
                  (task) => task.id !== taskIdToRemove
                );
                taskCount["count"]--; // Count has to be decreased since one task id is removed.
              }
            }
            dispatch(setBPMTaskCount(taskCount.count));
            dispatch(setBPMTaskList(taskData));
            if(taskData){
              abortFlag = 1;
            }
            dispatch(setVisibleAttributes(responseData[1]));
            done(null, taskData);
          }
        } else {
          clearTableData(dispatch);
        }
      })
      .catch((error) => {
        handleTaskError(dispatch, error);
        done(error);
      })
      .finally(() => {
        //the abort flag will determine the final call and make the loader false.
        if (abortFlag == 1) {
          dispatch(setBPMTaskLoader(false));
        }
      })
  };
};

export const fetchBPMTaskCount = (
  data,
  callback = (err: any, data: any) => {}
) => {
  return (dispatch) => {
    //  dispatch(setBPMTaskLoader(true));
    RequestService.httpPOSTRequest(`${API.GET_BPM_TASK_FILTERS}/count`, data)
      .then((res) => {
        dispatch(setBPMFiltersAndCount(res.data));
        callback(null, res.data);
      })
      .catch((err) => {
        callback(err, null);
      })
      .finally(() => {
        dispatch(setBPMTaskLoader(false));
      });
  };
};

export const getFirstResultIndex = (activePage, limit) => {
  const limits = limit ?? MAX_RESULTS;
  return activePage * limits - limits;
};

export const fetchFilterList = () =>
  RequestService.httpGETRequest(`${API.GET_FILTERS}/user`);

export const fetchAttributeFilterList = (filterId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const getAttributeFiltersAPI = replaceUrl(
    API.GET_ATTRIBUTE_FILTERS,
    "<filter_id>",
    filterId
  );
  return (dispatch) => {
    RequestService.httpGETRequest(getAttributeFiltersAPI)
      .then((res) => {
        if (res.data) {
          dispatch(setAttributeFilterList(res.data.attributeFilters));
          done(null, res.data);
        } else {
          dispatch(serviceActionError(res));
        }
      })
      .catch((error) => {
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const createFilter = (data) => {
  return RequestService.httpPOSTRequest(`${API.GET_FILTERS}`, data);
};

export const deleteFilter = (id) => {
  return RequestService.httpDELETERequest(`${API.GET_FILTERS}/${id}`);
};

/**
 *
 * @param updatedVariables - array of objects containing variable details to be updated
 * @param selectedFilterId - id of the filter to be updated
 * @returns
 */
export const updateFilter = (
  updatedVariables: any,
  selectedFilterId: number
) => {
  return RequestService.httpPUTRequest(
    `${API.GET_FILTERS}/${selectedFilterId}`,
    updatedVariables
  );
};

export const updateDefaultFilter = (defaultFilter) => {
  return RequestService.httpPOSTRequest(API.UPDATE_DEFAULT_FILTER, {
    defaultFilter,
  });
};

export const fetchTaskVariables = (formId) => {
  let url = `${API.FORM_PROCESSES}/${formId}`;
  return RequestService.httpGETRequest(url);
};

export const executeRule = (submissionData, mapperId) => { 
  const url = replaceUrl(API.BUNDLE_EXECUTE_RULE,"<mapper_id>", mapperId);
  return RequestService.httpPOSTRequest(url, submissionData);
};

export const fetchAllForms = () => {
  //activeForms means published forms only : status = Active
  return RequestService.httpGETRequest(`${API.FORM}?activeForms=true`);
};

export const fetchFormById = (id) => {
  let formioToken = sessionStorage.getItem("formioToken");
  let token = formioToken ? { "x-jwt-token": formioToken } : {};
  return RequestService.httpGETRequest(
    `${API.GET_FORM_BY_ID}/${id}`,
    {},
    "",
    false,
    {
      ...token,
    }
  );
};

export const fetchBundleSubmissionData = (bundleId,submissionId,formId) => {
  let formioToken = sessionStorage.getItem("formioToken");
  let token = formioToken ? { "x-jwt-token": formioToken } : {};
  return RequestService.httpGETRequest(`${API.GET_FORM_BY_ID}/${bundleId}/submission/${submissionId}?formId=${formId}`, {}, "", false, {
    ...token
  });

};

export const getBundleCustomSubmissionData = (bundleId, submissionId, selectedFormId) =>{
  const submissionUrl = replaceUrl(API.CUSTOM_SUBMISSION, "<form_id>", bundleId);
  return  RequestService.
  httpGETRequest(`${submissionUrl}/${submissionId}?formId=${selectedFormId}`, {});
};


export const claimBPMTask = (taskId, user, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const apiUrlClaimTask = replaceUrl(API.CLAIM_BPM_TASK, "<task_id>", taskId);
  return (dispatch) => {
    RequestService.httpPOSTRequest(apiUrlClaimTask, { userId: user })
      .then((res) => {
        done(null, res.data);
      })
      .catch((error) => {
        console.log("Error", error);
        dispatch(serviceActionError(error));
        dispatch(setBPMTaskDetailUpdating(false));
        done(error);
      });
  };
};

export const unClaimBPMTask = (taskId, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const apiUrlUnClaimTask = replaceUrl(
    API.UNCLAIM_BPM_TASK,
    "<task_id>",
    taskId
  );
  return (dispatch) => {
    RequestService.httpPOSTRequest(apiUrlUnClaimTask)
      .then((res) => {
        // if (res.status === 204) {
        //TODO REMOVE
        done(null, res.data);
        // }
      })
      .catch((error) => {
        console.log("Error", error);
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const updateAssigneeBPMTask = (taskId, user, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const apiUrlClaimTask = replaceUrl(
    API.UPDATE_ASSIGNEE_BPM_TASK,
    "<task_id>",
    taskId
  );
  return (dispatch) => {
    RequestService.httpPOSTRequest(apiUrlClaimTask, { userId: user })
      .then((res) => {
        done(null, res.data);
      })
      .catch((error) => {
        console.log("Error", error);
        dispatch(serviceActionError(error));
        dispatch(setBPMTaskDetailUpdating(false));
        done(error);
      });
  };
};

/**
 * Saves filter preference with optional filter type and parent filter ID parameters
 * @param {object} data - The filter preference data to save
 * @param {string} filterType - Optional filter type (e.g., 'ATTRIBUTE')
 * @param {string|number|null} parentFilterId - Optional parent filter ID
 * @returns {Promise} - The HTTP request promise
 */
export const saveFilterPreference = (data, filterType = null, parentFilterId = null) => {
  let url = API.SAVE_FILTER_PREFERENCE;
  const params = [];

  if (filterType) {
    params.push(`filterType=${filterType}`);
  }

  if (parentFilterId !== null) {
    params.push(`parentFilterId=${parentFilterId}`);
  }

  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }

  return RequestService.httpPOSTRequest(url, data);
};
