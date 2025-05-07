import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    processActivityList: null,
    processActivityLoadError: false,
 };

const process = (state = initialState, action) => {
    switch (action.type) {
        case ACTION_CONSTANTS.IS_PROCESS_ACTIVITY_LOAD_ERROR:
          return { ...state, processActivityLoadError: action.payload };
        case ACTION_CONSTANTS.PROCESS_ACTIVITIES:
          return { ...state, processActivityList: action.payload };
        default:
            return state;
    }
};

export default process;
