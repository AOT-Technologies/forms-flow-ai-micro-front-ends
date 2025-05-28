import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    analyzeSubmissionSortParams: {
        activeKey: "formName",
        formName: { sortOrder: "asc" },
        submissionId: { sortOrder: "asc" },
        createdBy: { sortOrder: "asc" },
        submissionDate: { sortOrder: "asc" },
        applicationStatus: { sortOrder: "asc" },
    },
};



const analyzeSubmission = (state = initialState, action: any) => {
    switch (action.type) {
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_SORT_PARAMS:
            return { ...state, analyzeSubmissionSortParams: action.payload };
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_PAGE:
            return { ...state, page: action.payload };
        default:
            return state;
    }
};

export default analyzeSubmission;

