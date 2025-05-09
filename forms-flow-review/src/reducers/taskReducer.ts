import ACTION_CONSTANTS from "../actions/actionConstants";
import { setShowApplications } from "./../helper/helper.js";

const initialState = {
  isTaskListLoading: true,
  tasksList: [],
  userList: [],
  userGroups: [],
  userDetail: {},
  filterList: [],
  attributeFilterList: [],
  listReqParams: {
    activeKey: "created",
    created: { sortOrder: "asc" },
    name: { sortOrder: "asc" },
    assignee: { sortOrder: "asc" },
  },
  firstResult: 0,
  limit: 5,
  selectedFilter: {},
  selectedAttributeFilter: {},
  taskId: null,
  defaultFilter: "",
  filtersAndCount: [],
  filterListSearchParams: {},
  taskDetail: null,
  filterListSortParams: {
    activeKey: "created",
    created: { sortOrder: "asc" },
    name: { sortOrder: "asc" },
    assignee: { sortOrder: "asc" },
  },
  tasksCount: 0,
};

interface TaskAction {
  type: string;
  payload: any;
}

const TaskHandler = (state = initialState, action: TaskAction) => {
  switch (action.type) {
    case ACTION_CONSTANTS.BPM_LIST_TASKS:
      return { ...state, tasksList: action.payload };
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
        showApplications: setShowApplications(action.payload?.groups ?? []),
      };
    case ACTION_CONSTANTS.IS_PROCESS_STATUS_LOADING:
      return { ...state, isProcessLoading: action.payload };
    case ACTION_CONSTANTS.UPDATE_LIST_PARAMS:
      return { ...state, listReqParams: action.payload };
    case ACTION_CONSTANTS.BPM_TASK_LIST_ACTIVE_PAGE:
      return {
        ...state,
        activePage: action.payload,
      };
    case ACTION_CONSTANTS.BPM_FILTER_LIST:
      return { ...state, filterList: action.payload };
    case ACTION_CONSTANTS.ATTRIBUTE_FILTER_LIST:
      return { ...state, attributeFilterList: action.payload };
    case ACTION_CONSTANTS.BPM_SELECTED_FILTER:
      return {
        ...state,
        selectedFilter: action.payload,
        filterListSearchParams: {},
      };
    case ACTION_CONSTANTS.BPM_SELECTED_ATTRIBUTE_FILTER:
        return {
          ...state,
          selectedAttributeFilter: action.payload,
        };
    case ACTION_CONSTANTS.DEFAULT_FILTER:
      return { ...state, defaultFilter: action.payload };
    case ACTION_CONSTANTS.SELECTED_TASK_ID:
      return { ...state, taskId: action.payload, taskDetail: null };
    case ACTION_CONSTANTS.BPM_FILTERS_AND_COUNT:
      return { ...state, filtersAndCount: action.payload };
    case ACTION_CONSTANTS.UPDATE_FILTER_LIST_SORT_PARAMS:
      return { ...state, filterListSortParams: action.payload };
    case ACTION_CONSTANTS.BPM_TASKS_COUNT:
      return { ...state, tasksCount: action.payload };
    case ACTION_CONSTANTS.IS_BPM_TASK_LOADING:
      return { ...state, isTaskListLoading: action.payload };
    case ACTION_CONSTANTS.TASK_LIST_LIMIT_CHANGE:
      return { ...state, limit: action.payload };
    case ACTION_CONSTANTS.UPDATE_FILTER_SEARCH_PARAMS:
      return { ...state, filterListSearchParams: action.payload };
    default:
      return state;
  }
};

export default TaskHandler;
