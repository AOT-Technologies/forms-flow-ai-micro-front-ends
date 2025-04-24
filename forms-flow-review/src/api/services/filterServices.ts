import API from "../endpoints";
import { StorageService, RequestService } from "@formsflow/service";
import { setBPMUserList, serviceActionError, setBPMTaskList, setBPMTaskCount, setBPMTaskLoader, setVisibleAttributes, setDefaultFilter, setBPMFilterList, setBPMFilterLoader } from "../../actions/taskActions";
import { MAX_RESULTS } from "../../constants";

export const fetchUserList = (...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const getReviewerUserListApi = `${API.GET_API_USER_LIST}?permission=manage_tasks`;
  return (dispatch) => {
      RequestService.httpGETRequest(
        getReviewerUserListApi
      )
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
  dispatch(setBPMTaskList([]));
  dispatch(setBPMTaskCount(0));
  dispatch(serviceActionError(error));
  dispatch(setBPMTaskLoader(false));
};


  export const fetchServiceTaskList = (reqData, taskIdToRemove, firstResult, maxResults, ...rest) => {
  const done = rest.length ? rest[0] : () => {};
    const apiUrlgetTaskList =
        `${API.GET_BPM_TASK_FILTERS}?firstResult=${firstResult}&maxResults=${maxResults || MAX_RESULTS}`;

  return (dispatch) => {
    RequestService.httpPOSTRequestWithHAL(
      apiUrlgetTaskList,
      reqData,
      StorageService.get(StorageService.User.AUTH_TOKEN)
    )
      .then((res) => {
        if (res.data) {
          let responseData = res.data;
          const _embedded = responseData[0]?._embedded; // data._embedded.task is where the task list is.
          if (!_embedded?.task || !responseData?.[0]?.count) {
            // Display error if the necessary values are unavailable.
            handleTaskError(dispatch, res);
            }
             else {
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
            dispatch(setVisibleAttributes(responseData[1]));
            dispatch(setBPMTaskLoader(false));
            done(null, taskData);
          }
        } else {
          handleTaskError(dispatch, res);
        }
      })
      .catch((error) => {
        handleTaskError(dispatch, error);
        done(error);
      });
  };
};

  
export const fetchBPMTaskCount = (data) => {
  return RequestService.httpPOSTRequest(
    `${API.GET_BPM_TASK_FILTERS}/count`,
    data
  );
};

export const getFirstResultIndex = (activePage) => {
    return (activePage * MAX_RESULTS) - MAX_RESULTS;
};


export const fetchFilterList = (...rest) => {
  const done = rest.length ? rest[0] : () => {};
  const getTaskFiltersAPI = `${API.GET_FILTERS}/user`;
  return (dispatch) => {
    RequestService.httpGETRequest(getTaskFiltersAPI)
      .then((res) => {
        if (res.data) {
          dispatch(setDefaultFilter(res.data.defaultFilter));
          dispatch(setBPMFilterList(res.data.filters));
          done(null, res.data);
        } else {
          dispatch(setBPMFilterLoader(false));
          dispatch(serviceActionError(res));
        }
      })
      .catch((error) => {
        dispatch(setBPMFilterLoader(false));
        dispatch(serviceActionError(error));
        done(error);
      });
  };
};

export const saveFilters = (data) => {
  return RequestService.httpPOSTRequest(`${API.GET_FILTERS}`, data);
};

export const editFilters = (data, id) => {
  return RequestService.httpPUTRequest(`${API.GET_FILTERS}/${id}`, data);
};

export const updateDefaultFilter = (defaultFilter) => {
    return RequestService.httpPOSTRequest(
      API.UPDATE_DEFAULT_FILTER,
      {defaultFilter}
    );
  }

  export const fetchTaskVariables = (formId) =>{
  let url = `${API.FORM_PROCESSES}/${formId}`;
  return RequestService.httpGETRequest(url);
};

  export const fetchAllForms = ()=>{
  //activeForms means published forms only : status = Active
  return RequestService.httpGETRequest(`${API.FORM}?activeForms=true`);
};


export const fetchFormById = (id) => {
  let formioToken = sessionStorage.getItem("formioToken");
  let token = formioToken ? { "x-jwt-token": formioToken } : {};
  return RequestService.httpGETRequest(`${API.GET_FORM_BY_ID}/${id}`, {}, "", false, {
    ...token
  });

};

