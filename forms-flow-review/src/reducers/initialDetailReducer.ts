import ACTION_CONSTANTS from "../actions/actionConstants";
import {  setUserRolesToObject} from "../helper/user";
import { setFormAndSubmissionAccess } from "../helper/access.js";

const roleIdsFromLocalStorage = localStorage.getItem("roleIds")
    ? JSON.parse(localStorage.getItem("roleIds"))
    : undefined;

const initialState = {
    roleIds: roleIdsFromLocalStorage
        ? setUserRolesToObject(roleIdsFromLocalStorage)
        : {},
    formAccess: roleIdsFromLocalStorage
        ? setFormAndSubmissionAccess("formAccess", roleIdsFromLocalStorage)
        : [],
    submissionAccess: roleIdsFromLocalStorage
        ? setFormAndSubmissionAccess("submissionAccess", roleIdsFromLocalStorage)
        : [],
};

const user = (state = initialState, action) => {
    switch (action.type) {
        case ACTION_CONSTANTS.ROLE_IDS:
            return { ...state, roleIds: setUserRolesToObject(action.payload) };
        case ACTION_CONSTANTS.ACCESS_ADDING:
            return {
                ...state,
                formAccess: setFormAndSubmissionAccess("formAccess", action.payload),
                submissionAccess: setFormAndSubmissionAccess(
                    "submissionAccess",
                    action.payload
                ),
            };
        default:
            return state;
    }
};

export default user;
