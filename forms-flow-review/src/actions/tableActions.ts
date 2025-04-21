import ACTION_CONSTANTS from "./actionConstants";

export const fetchTaskList = (formsData, totalCount) => ({
    type: ACTION_CONSTANTS.TASKLIST,
    payload: {
      forms: formsData,
      totalCount: totalCount
    }
  });
  
  export const changeTaskListLimit = (limit) => ({
    type: ACTION_CONSTANTS.TASK_LIST_LIMIT_CHANGE,
    payload: limit
  });
  
  export const changeTaskListPage = (pageNumber) => ({
    type: ACTION_CONSTANTS.TASK_LIST_PAGE_CHANGE,
    payload: pageNumber
  });
  
  export const changeTaskListSortOrder = (sortOrder) => ({
    type: ACTION_CONSTANTS.TASK_LIST_SORT_CHANGE,
    payload: sortOrder
  });
  
  export const updateTaskSort = (sortConfig) => ({
    type: ACTION_CONSTANTS.TASK_SORT,
    payload: sortConfig
  });