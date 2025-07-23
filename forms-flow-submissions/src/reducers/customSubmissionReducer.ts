import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
  submission:{}
};

const customSubmission = (state = initialState, action) => {
    if (action.type === ACTION_CONSTANTS.CUSTOM_SUBMISSION) {
      return { ...state, submission: action.payload };
    }  
    return state;
  };

export default customSubmission;