import ACTION_CONSTANTS from "../actions/actionConstants";

export const initialState = {
    applicationDetails: null,
    roles: "",
    lang: localStorage.getItem("lang") ? localStorage.getItem("lang") : null,
    isApplicationDetailLoading: false,
};

const applications = (state = initialState, action) => {
    switch (action.type) {
        case ACTION_CONSTANTS.APPLICATION_DETAIL:
            return {
                ...state,
                applicationDetails: action.payload,
            };
        case ACTION_CONSTANTS.SET_APP_DETAILS_LOADING:
            return { ...state, isApplicationDetailLoading: action.payload };

        default:
            return state;
    }
};

export default applications;