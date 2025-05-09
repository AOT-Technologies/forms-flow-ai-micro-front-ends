import ACTION_CONSTANTS from "../actions/actionConstants";
import cloneDeep from "lodash/cloneDeep";

const initialState = {
  submission:{}
};

const customSubmission = (state = initialState, action) => {
  switch (action.type) {
    case ACTION_CONSTANTS.CUSTOM_SUBMISSION:
      return { ...state, submission: cloneDeep(action.payload)};
    default:
      return state;
  }
};

export default customSubmission;
