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

export const setDefaultSubmissionFilter = (data) => (dispatch) =>{ 
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_DEFAULT_SUBMISSION_FILTER,
    payload: data,
  })
}

export const setSelectedSubmisionFilter = (data) => (dispatch) =>{
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_SELECTED_SUBMISSION_FILTER,
    payload: data,
  })
}

export const setSubmissionFilterList = (data) => (dispatch) =>{ 
  dispatch({
    type: ACTION_CONSTANTS.SUBMISSION_FILTER_LIST,
    payload: data,
  })
}

export const setSearchFieldValues = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_SEARCH_FIELD_VALUES,
    payload: data,
  })
}

export const clearSearchFieldValues = () => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.CLEAR_SEARCH_FIELD_VALUES,
  })
}
