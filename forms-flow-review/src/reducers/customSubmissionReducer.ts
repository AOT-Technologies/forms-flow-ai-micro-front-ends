import ACTION_CONSTANTS from "../actions/actionConstants";
import cloneDeep from "lodash/cloneDeep";

const initialState = {
  submission:{}
};

const customSubmission = (state = initialState, action) => {
  if (action.type === ACTION_CONSTANTS.CUSTOM_SUBMISSION) {
    return { ...state, submission: cloneDeep(action.payload) };
  }
  return state;
};

export default customSubmission;
