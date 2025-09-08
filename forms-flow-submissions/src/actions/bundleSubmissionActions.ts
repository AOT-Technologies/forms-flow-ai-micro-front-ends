import ACTION_CONSTANTS from "../actions/actionConstants";

export const setBundleSelectedForms = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SUBMISSION_BUNDLE_SELECTED_FORMS,
      payload: data,
    });
  };

  export const setBundleLoading = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SUBMISSION_BUNDLE_LOADING,
      payload: data,
    });
  };


export const setSubmissionBundleErrors = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SUBMISSION_BUNDLE_ERROR,
      payload: data,
    });
  };

export const resetFormData = (name) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.FORM_RESET,
      name,
    });
  };

  export const clearFormError = (name) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.FORM_CLEAR_ERROR,
      name,
    });
  };

  export const setBundleSubmissionData = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BUNDLE_FORM_SUBMISSION,
      payload: data,
    });
  };

  export const setFormFailureErrorData = (name, error) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.FORM_FAILURE,
      payload: {name, error}
    });
  };
  