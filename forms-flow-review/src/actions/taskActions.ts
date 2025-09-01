import ACTION_CONSTANTS from "./actionConstants";

export const setTasks = (data: any) => ({
    type: ACTION_CONSTANTS.SET_TASKS,
    payload: data,
  })

  export const setIsUnsavedFilter =(data: boolean) => ({
    type: ACTION_CONSTANTS.SET_IS_UNSAVED_FILTER,
    payload: data,
  })

  export const setBPMUserList = (data: any) => ({
 
      type: ACTION_CONSTANTS.BPM_USER_LIST,
      payload: data,
  });

  export const setUserGroups = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_GROUPS,
      payload: data,
    });
  };

  export const setUserDetails = (data) => (dispatch) => {
    localStorage.setItem("UserDetails", JSON.stringify(data));
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_DETAILS,
      payload: data,
    });
  };

  export const serviceActionError = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.ERROR,
      payload: "Error Handling API",
    });
  };

  export const setProcessStatusLoading = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_PROCESS_STATUS_LOADING,
      payload: data,
    });
  };

  export const setUserRole = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_USER_ROLES,
      payload: data,
    });
  };

  export const setBPMTaskList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_LIST_TASKS,
      payload: data,
    });
  };

  export const setBPMTaskCount = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_TASKS_COUNT,
      payload: data,
    });
  };

  export const setBPMTaskLoader = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_BPM_TASK_LOADING,
      payload: data,
    });
  };


  export const setVisibleAttributes = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_VISSIBLE_ATTRIBUTES, 
      payload: data,
    });
  };

  export const setDefaultFilter = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.DEFAULT_FILTER,
      payload: data,
    });
  };
  export const setBPMFilterList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_FILTER_LIST,
      payload: data,
    });
  };

  export const setAttributeFilterList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.ATTRIBUTE_FILTER_LIST,
      payload: data,
    });
  };

  export const setBPMFilterLoader = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_BPM_FILTERS_LOADING,
      payload: data,
    });
  };

  export const setBPMFiltersAndCount = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_FILTERS_AND_COUNT,
      payload: data,
    });
  };
  export const setSelectedFilter = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SET_SELECTED_FILTER,
      payload: data,
    });
  };

  export const setSelectedBpmAttributeFilter = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_SELECTED_ATTRIBUTE_FILTER,
      payload: data,
    });
  };

  export const setBPMTaskDetail = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_TASK_DETAIL,
      payload: data,
    });
  };
  export const setBPMTaskFormId = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_TASK_FORM_ID,
      payload: data,
    });
  };
  
  export const setFormSubmissionLoading = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_FORM_SUBMISSION_LOADING,
      payload: data,
    });
  };
  export const resetFormData = (name) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.FORM_RESET,
      name,
    });
  };
  
  export const setCustomSubmission = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.CUSTOM_SUBMISSION,
      payload: data,
    });
  };
export const setBPMTaskDetailLoader = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.IS_BPM_TASK_DETAIL_LOADING,
    payload: data,
  });
};

export const setBPMTaskListActivePage = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.BPM_TASK_LIST_ACTIVE_PAGE,
    payload: data,
  });
};

export const setLastReqPayload = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.LAST_REQ_PAYLOAD,
    payload: data,
  });
};


export const setFilterListSortParams = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_FILTER_LIST_SORT_PARAMS,
    payload: data,
  });
};

export const setTaskListLimit = (pageLimit) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.TASK_LIST_LIMIT_CHANGE,
    payload: pageLimit,
  });
};

export const setFilterToEdit = (data) => ({
  type: ACTION_CONSTANTS.SET_FILTER_TO_EDIT,
  payload: data,
})


export const setIsAssigned = (data:boolean) => ({
  type: ACTION_CONSTANTS.IS_ASSIGNED,
  payload: data,
})

export const setAttributeFilterToEdit = (data) => ({
  type: ACTION_CONSTANTS.SET_ATTRIBUTE_FILTER_TO_EDIT,
  payload: data,
})


export const setIsUnsavedAttributeFilter = (data) =>({
  type: ACTION_CONSTANTS.SET_IS_UNSAVED_ATTRIBUTE_FILTER,
  payload: data,
})

export const setDateRangeFilter = (data) => ({
  type: ACTION_CONSTANTS.SET_DATE_RANGE_FILTER,
  payload: data,
})



export const setBPMFilterSearchParams = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.UPDATE_FILTER_SEARCH_PARAMS,
    payload: data,
  });
};

  export const setSelectedTaskID = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.SELECTED_TASK_ID,
      payload: data,
    });
  }; 


  // Actions for Task History
  export const setAppHistoryLoading = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_HISTORY_LOADING,
      payload: data,
    });
  };

  export const setApplicationHistoryList = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.LIST_APPLICATION_HISTORY,
      payload: data,
    });
  };

  
export const setBPMTaskDetailUpdating = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.IS_BPM_TASK_DETAIL_UPDATING,
      payload: data,
    });
  };  

export const bpmActionError = (data) => (dispatch) => {
    dispatch({
      type: ACTION_CONSTANTS.BPM_ERROR,
      payload: data,
    });
  };
  
export const resetTaskListParams = (data) =>({
  type: ACTION_CONSTANTS.RESET_TASK_LIST_PARAMS,
  payload: data,
})

export const setTaskAssignee = (data) =>({
  type: ACTION_CONSTANTS.SET_TASK_ASSIGNEE,
  payload: data,
})

export const setTaskDetailsLoading = (data) =>({
  type: ACTION_CONSTANTS.SET_TASK_DETAILS_LOADING,
  payload: data,
})

//===== Bundle Actions  ==>

export const setBundleSelectedForms = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.BUNDLE_SELECTED_FORMS,
    payload: data,
  });
};

export const setBundleLoading = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.BUNDLE_LOADING,
    payload: data,
  });
};

export const setBundleErrors = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.BUNDLE_ERROR,
    payload: data,
  });
};

export const clearFormError = (name) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.FORM_CLEAR_ERROR,
    name,
  });
};

export const setBundleSubmissionData = (data) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.BUNDLE_FORM_SUBMISSION,
    payload: data,
  });
};

export const setFormFailureErrorData = (name, error) => (dispatch) => {
  dispatch({
    type: ACTION_CONSTANTS.FORM_FAILURE,
    payload: {name, error}
  });
};


