import ACTION_CONSTANTS from "../constants/actionConstants";

export const setAnalyzeSubmissionSort = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.UPDATE_SUBMISSION_SORT_PARAMS,
      payload: data,
    });
  };
  
  export const setAnalyzeSubmissionPage = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.UPDATE_SUBMISSION_PAGE,
      payload: data,
    });
  };

  