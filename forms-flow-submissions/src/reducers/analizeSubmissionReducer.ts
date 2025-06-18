import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    analyzeSubmissionSortParams: {
        activeKey: "formName",
        formName: { sortOrder: "asc" },
        id: { sortOrder: "asc" },
        createdBy: { sortOrder: "asc" },
        created: { sortOrder: "asc" },
        applicationStatus: { sortOrder: "asc" },
    },
    page: 1,
    limit: 10,
};



const analyzeSubmission = (state = initialState, action: any) => {
    switch (action.type) {
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_SORT_PARAMS:
            return { ...state, analyzeSubmissionSortParams: action.payload };
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_PAGE:
            return { ...state, page: action.payload };
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_LIMIT:
            return { ...state, limit: action.payload };
        default:
            return state;
    }
};

export default analyzeSubmission;

