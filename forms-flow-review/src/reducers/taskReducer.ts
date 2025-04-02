import ACTION_CONSTANTS from "../actions/actionConstants";
import { setShowApplications } from "./../helper/helper.js"
import { TASK_FILTER_LIST_DEFAULT_PARAM } from "../constants/"
import { getFirstResultIndex } from "../api/services/filterServices";


const initialState = {
  tasks: [],
  userList: [],
  userGroups: [],
  userDetail: {},
  filterList: [],
  listReqParams: { sorting: [{ ...TASK_FILTER_LIST_DEFAULT_PARAM }] },
  firstResult: 0,
  selectedFilter: {},
  defaultFilter: "",



};

interface TaskAction {
  type: string,
  payload: any
}

const TaskHandler = (state = initialState, action: TaskAction) => {
  switch (action.type) {
    case ACTION_CONSTANTS.SET_TASKS:
      return { ...state, tasks: action.payload };
    case ACTION_CONSTANTS.BPM_USER_LIST:
      return { ...state, userList: action.payload };
    case ACTION_CONSTANTS.SET_USER_ROLES:
      return { ...state, roles: action.payload };
    case ACTION_CONSTANTS.SET_USER_GROUPS:
      return { ...state, userGroups: action.payload };
    case ACTION_CONSTANTS.SET_USER_DETAILS:
      return {
        ...state,
        userDetail: action.payload,
        showApplications: setShowApplications(action.payload?.groups || [])
      };
    case ACTION_CONSTANTS.IS_PROCESS_STATUS_LOADING:
      return { ...state, isProcessLoading: action.payload };
    case ACTION_CONSTANTS.UPDATE_LIST_PARAMS:
      return { ...state, listReqParams: action.payload };
    case ACTION_CONSTANTS.BPM_TASK_LIST_ACTIVE_PAGE:
      return {
        ...state,
        activePage: action.payload,
        firstResult: getFirstResultIndex(action.payload),
      };
    case ACTION_CONSTANTS.BPM_SELECTED_FILTER:
      return { ...state, selectedFilter: action.payload, filterListSearchParams: {} };
    case ACTION_CONSTANTS.DEFAULT_FILTER:
      return { ...state, defaultFilter: action.payload };
    default:
      return state;
  }

};

export default TaskHandler;