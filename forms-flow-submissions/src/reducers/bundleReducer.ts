import ACTION_CONSTANTS from "../actions/actionConstants";

const initialState = {
    bundleLoading: false,
    submissionBundleForms: [],
    submissionBundleError:'',
    submissionBundleLoading: false,
    bundleSubmission:{},
    error : null,
    errors: '',
    isActive: false,

};

const submissionBundle = (state = initialState, action: any) => {
    switch (action.type) {
        case ACTION_CONSTANTS.SUBMISSION_BUNDLE_SELECTED_FORMS:
            return { ...state, submissionBundleForms: action.payload };
        case ACTION_CONSTANTS.SUBMISSION_BUNDLE_LOADING:
            return { ...state, bundleLoading: action.payload};
        case ACTION_CONSTANTS.SUBMISSION_BUNDLE_ERROR:
          return { ...state, submissionBundleError: action.payload};

          case ACTION_CONSTANTS.FORM_CLEAR_ERROR:
            return {...state, error: ''};
            case ACTION_CONSTANTS.BUNDLE_FORM_SUBMISSION:
                return {...state, bundleSubmission:action.payload};
                case ACTION_CONSTANTS.FORM_FAILURE:
                    return {
                      ...state,
                      isActive: false,
                      isInvalid: true,
                      errors: action?.payload.error
                    };
        default:
            return state;
    }
};

export default submissionBundle;