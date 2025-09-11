import ACTION_CONSTANTS from "../actions/actionConstants";

// Generic helper for actions with "payload"
const createAction =
  (type: string) =>
  (payload: unknown) =>
  (dispatch: any) => {
    dispatch({ type, payload });
  };

// Generic helper for actions with "name"
const createNameAction =
  (type: string) =>
  (name: string) =>
  (dispatch: any) => {
    dispatch({ type, name });
  };

// Special case for actions with {name, error}
const createErrorAction =
  (type: string) =>
  (name: string, error: unknown) =>
  (dispatch: any) => {
    dispatch({ type, payload: { name, error } });
  };

// Now define your actions
export const setBundleSelectedForms = createAction(
  ACTION_CONSTANTS.SUBMISSION_BUNDLE_SELECTED_FORMS
);

export const setBundleLoading = createAction(
  ACTION_CONSTANTS.SUBMISSION_BUNDLE_LOADING
);

export const setSubmissionBundleErrors = createAction(
  ACTION_CONSTANTS.SUBMISSION_BUNDLE_ERROR
);

export const resetFormData = createNameAction(ACTION_CONSTANTS.FORM_RESET);

export const clearFormError = createNameAction(ACTION_CONSTANTS.FORM_CLEAR_ERROR);

export const setBundleSubmissionData = createAction(
  ACTION_CONSTANTS.BUNDLE_FORM_SUBMISSION
);

export const setFormFailureErrorData = createErrorAction(ACTION_CONSTANTS.FORM_FAILURE);
