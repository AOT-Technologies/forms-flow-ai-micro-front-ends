import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    analyzeSubmissionSortParams: {
        activeKey: "form_name",
        form_name: { sortOrder: "asc" },
        id: { sortOrder: "asc" },
        created_by: { sortOrder: "asc" },
        created: { sortOrder: "asc" },
        application_status: { sortOrder: "asc" },
    },
    page: 1,
    limit: 10,
    dateRange:{startDate: null, endDate: null},
    defaultFilter: null,
    selectedFilter: "All Forms",
    submissionFilterList: [],
    searchFieldValues: {},
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
        case ACTION_CONSTANTS.UPDATE_DEFAULT_SUBMISSION_FILTER:
            return { ...state, defaultFilter: action.payload };
        case ACTION_CONSTANTS.UPDATE_SELECTED_SUBMISSION_FILTER:
            return { ...state, selectedFilter: action.payload };
        case ACTION_CONSTANTS.SUBMISSION_FILTER_LIST:
            return { ...state, submissionFilterList: action.payload };
        case ACTION_CONSTANTS.UPDATE_SEARCH_FIELD_VALUES:
            return { ...state, searchFieldValues: action.payload };
        case ACTION_CONSTANTS.CLEAR_SEARCH_FIELD_VALUES:
            return { ...state, searchFieldValues: {} };
        default:
            return state;
    }
};

export default analyzeSubmission;

