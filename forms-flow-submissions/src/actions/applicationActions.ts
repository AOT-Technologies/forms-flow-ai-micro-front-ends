import ACTION_CONSTANTS from "../actions/actionConstants";


export const setApplicationDetail = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.APPLICATION_DETAIL,
    payload: data,
  });
};


export const setCustomSubmission = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.CUSTOM_SUBMISSION,
    payload: data,
  });
};

export const setApplicationHistoryList = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.LIST_APPLICATION_HISTORY,
    payload: data,
  });
};

export const setUpdateHistoryLoader = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.IS_HISTORY_LOADING,
    payload: data,
  });
};

export const serviceActionError = (data) => (dispatch) => {
  //TODO update to a common file
  dispatch({
    type: ACTION_CONSTANTS.ERROR,
    payload: "Error Handling API",
  });
};

export const setUserRole = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.SET_USER_ROLES,
    payload: data,
  });
};

export const setApplicationDetailLoading = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.SET_APP_DETAILS_LOADING,
    payload: data,
  });
};



