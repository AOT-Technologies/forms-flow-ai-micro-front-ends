import ACTION_CONSTANTS from "./actionConstants"

export const setProcessActivityData = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.PROCESS_ACTIVITIES,
    payload: data,
  });
};
export const setProcessActivityLoadError = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.IS_PROCESS_ACTIVITY_LOAD_ERROR,
    payload: data,
  });
};