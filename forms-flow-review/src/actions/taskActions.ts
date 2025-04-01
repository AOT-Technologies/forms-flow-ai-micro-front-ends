import ACTION_CONSTANTS from "./actionConstants";

export const setTasks = (data: any) => ({
    type: ACTION_CONSTANTS.SET_TASKS,
    payload: data,
  })

  export const setBPMUserList = (data: any) => ({
 
      type: ACTION_CONSTANTS.BPM_USER_LIST,
      payload: data,
  });

  export const setUserGroups = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_GROUPS,
      payload: data,
    });
  };

  export const setUserDetails = (data) => (dispatch) => {
    localStorage.setItem("UserDetails", JSON.stringify(data));
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_DETAILS,
      payload: data,
    });
  };

  export const serviceActionError = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.ERROR,
      payload: "Error Handling API",
    });
  };

  export const setProcessStatusLoading = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_PROCESS_STATUS_LOADING,
      payload: data,
    });
  };

  export const setUserRole = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_ROLES,
      payload: data,
    });
  };

  export const setBPMTaskList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_LIST_TASKS,
      payload: data,
    });
  };

  export const setBPMTaskCount = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_TASKS_COUNT,
      payload: data,
    });
  };

  export const setBPMTaskLoader = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_BPM_TASK_LOADING,
      payload: data,
    });
  };


  export const setVisibleAttributes = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_VISSIBLE_ATTRIBUTES, 
      payload: data,
    });
  };

  export const setDefaultFilter = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.DEFAULT_FILTER,
      payload: data,
    });
  };
  export const setBPMFilterList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_FILTER_LIST,
      payload: data,
    });
  };

  export const setBPMFilterLoader = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_BPM_FILTERS_LOADING,
      payload: data,
    });
  };


  
  