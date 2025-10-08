 
import ACTION_CONSTANTS from "../actions/actionConstants";
import { StorageService } from "@formsflow/service";

const initialState = {
  isTaskListLoading: true,
  userDetails:StorageService.getParsedData( StorageService.User.USER_DETAILS) || {},
  isAssigned: false,
  tasksList: [],
  userList: [],
  userGroups: [], 
  filterList: [],
  attributeFilterList: [],
  lastRequestedPayload: {},
  limit: 5,
  activePage: 1,
  selectedFilter: null,
  selectedAttributeFilter: null,
  taskId: null,
  defaultFilter: null,
  filtersAndCount: [], 
  taskDetail: null,
  filterListSortParams: {
    activeKey: "created",
    created: { sortOrder: "asc" },
    name: { sortOrder: "asc" },
    assignee: { sortOrder: "asc" },
  },
  tasksCount: 0,
  taskFilterPreference: [],
  formId: "",
  isFormSubmissionLoading: false,
  taskGroups: [],
  isGroupLoading: false,
  taskFormSubmissionReload: false,
  isHistoryListLoading: true,
  appHistory: [],
  isTaskDetailUpdating: false,
  error : null,
  isUnsavedFilter: false,
  isUnsavedAttributeFilter: false,
  filterToEdit:null,
  attributeFilterToEdit:null,
  dateRange:{startDate: null, endDate: null},
  taskAssignee:'',
  taskDetailsLoading: false,
  selectedForms: [],
  bundleLoading: false,
  bundleError:'',
  bundleSubmission:{},
  id: '',
  isActive: false,
  lastUpdated: 0,
  form: {},
  url: '',
  errors: ''
};

interface TaskAction {
  type: string;
  payload: any;
}

const TaskHandler = (state = initialState, action: TaskAction) => {
  switch (action.type) {
    case ACTION_CONSTANTS.BPM_LIST_TASKS:
      return { ...state, tasksList: action.payload};
    case ACTION_CONSTANTS.IS_ASSIGNED:
      return { ...state, isAssigned: action.payload };
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
  };
    case ACTION_CONSTANTS.IS_PROCESS_STATUS_LOADING:
      return { ...state, isProcessLoading: action.payload };
    case ACTION_CONSTANTS.LAST_REQ_PAYLOAD:
      return { ...state, lastRequestedPayload: action.payload };
    case ACTION_CONSTANTS.BPM_TASK_LIST_ACTIVE_PAGE:
      return {
        ...state,
        activePage: action.payload,
      };
    case ACTION_CONSTANTS.BPM_FILTER_LIST:
      return { ...state, filterList: action.payload };
    case ACTION_CONSTANTS.ATTRIBUTE_FILTER_LIST:
      return { ...state, attributeFilterList: action.payload };
    case ACTION_CONSTANTS.SET_IS_UNSAVED_FILTER:
      return { ...state, isUnsavedFilter: action.payload };
    case ACTION_CONSTANTS.SET_IS_UNSAVED_ATTRIBUTE_FILTER:
      return { ...state, isUnsavedAttributeFilter: action.payload };
    case ACTION_CONSTANTS.SET_FILTER_TO_EDIT:
      return { ...state, filterToEdit: action.payload };
          case ACTION_CONSTANTS.SET_ATTRIBUTE_FILTER_TO_EDIT:
      return { ...state, attributeFilterToEdit: action.payload };
    case ACTION_CONSTANTS.SET_SELECTED_FILTER:
      return {
        ...state,
        isUnsavedFilter:false,
        isUnsavedAttributeFilter: false,
        selectedFilter: action.payload,
        dateRange: { startDate: null, endDate: null },
        activePage: 1,
        isAssigned:false,
        selectedAttributeFilter: null,
      };
    case ACTION_CONSTANTS.BPM_SELECTED_ATTRIBUTE_FILTER:
        return {
          ...state,
          isUnsavedAttributeFilter: false,
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
    case ACTION_CONSTANTS.BPM_TASK_DETAIL:
      return { ...state, taskDetail: action.payload };
    case ACTION_CONSTANTS.BPM_TASK_FORM_ID:
      return { ...state, formId: action.payload };
    case ACTION_CONSTANTS.IS_FORM_SUBMISSION_LOADING:
      return { ...state, isFormSubmissionLoading: action.payload };
    case ACTION_CONSTANTS.SET_TASK_GROUP:
      return { ...state, taskGroups: action.payload, isGroupLoading: false };
    case ACTION_CONSTANTS.IS_TASK_GROUP_LOADING:
      return { ...state, isGroupLoading: action.payload };

    case ACTION_CONSTANTS.RELOAD_TASK_FORM_SUBMISSION:
      return { ...state, taskFormSubmissionReload: action.payload };
    case ACTION_CONSTANTS.IS_BPM_TASK_DETAIL_UPDATING:
        return { ...state, isTaskDetailUpdating: action.payload };
    case ACTION_CONSTANTS.ERROR:
      return { ...state, error: action.payload };   
    case ACTION_CONSTANTS.RESET_TASK_LIST_PARAMS:
      return {...state, ...action.payload}
      case ACTION_CONSTANTS.IS_HISTORY_LOADING:
        return { ...state, isHistoryListLoading: action.payload };
      case ACTION_CONSTANTS.LIST_APPLICATION_HISTORY:
        return { ...state, appHistory: action.payload };
      case ACTION_CONSTANTS.SET_DATE_RANGE_FILTER:
        return { ...state, dateRange: action.payload };
        case ACTION_CONSTANTS.SET_TASK_ASSIGNEE:
        return { ...state, taskAssignee: action.payload };
         case ACTION_CONSTANTS.SET_TASK_DETAILS_LOADING:
        return { ...state, taskDetailsLoading: action.payload };
        case ACTION_CONSTANTS.BUNDLE_SELECTED_FORMS:
          return { ...state, selectedForms: action.payload };
        case ACTION_CONSTANTS.BUNDLE_LOADING:
          return { ...state, setBundleLoading: action.payload};
        case ACTION_CONSTANTS.BUNDLE_ERROR:
          return { ...state, bundleError: action.payload};
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

export default TaskHandler;
