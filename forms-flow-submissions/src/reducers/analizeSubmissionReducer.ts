import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    analyzeSubmissionSortParams: {
        activeKey: "form_name",
        form_name: { sortOrder: "asc" },
        id: { sortOrder: "asc" },
        created_by: { sortOrder: "asc" },
        created: { sortOrder: "asc" },
        application_status: { sortOrder: "asc" },
        dateRange:{startDate: null, endDate: null},
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
        case ACTION_CONSTANTS.UPDATE_SUBMISSION_DATE_RANGE:
            return { ...state, dateRange: action.payload };
        default:
            return state;
    }
};

export default analyzeSubmission;

