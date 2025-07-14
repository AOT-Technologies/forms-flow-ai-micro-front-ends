import ACTION_CONSTANTS from "../actions/actionConstants";

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
export const setAnalyzeSubmissionLimit = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_SUBMISSION_LIMIT,
    payload: data,
  });
};

export const setAnalyzeSubmissionDateRange = (data) => (dispatch) =>{ 
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_SUBMISSION_DATE_RANGE,
    payload: data,
  })
}

