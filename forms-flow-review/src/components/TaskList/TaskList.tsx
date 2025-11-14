import { useEffect, useState } from "react";
import {
  resetTaskListParams,
  setBPMFilterList,
  setBPMFilterLoader,
  setBPMTaskListActivePage,
  setBPMTaskLoader,
  setDateRangeFilter,
  setDefaultFilter,
  setFilterListSortParams,
  setSelectedBpmAttributeFilter,
  setIsAssigned,
  setSelectedFilter,
  setTaskListLimit,
} from "../../actions/taskActions";
import {
  fetchAttributeFilterList,
  fetchBPMTaskCount,
  fetchFilterList,
  fetchServiceTaskList,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  // AddIcon,
  DateRangePicker,
  // FilterSortActions,
  // ConnectIcon,
  // CheckboxCheckedIcon,
  // CheckboxUncheckedIcon,
  CustomSearch,
  V8CustomButton,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskListDropdownItems from "./TaskFilterDropdown";
import { RootState } from "../../reducers";
import TaskListTable from "./TasklistTable";
import { HelperServices } from "@formsflow/service";
import AttributeFilterDropdown from "./AttributeFilterDropdown";
import { createReqPayload ,sortableKeysSet} from "../../helper/taskHelper";
import { buildDynamicColumns, optionSortBy } from "../../helper/tableHelper";
import  useAllTasksPayload  from "../../constants/allTasksPayload";
import { userRoles } from "../../helper/permissions";

const TaskList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const {
    limit,
    dateRange,
    activePage,
    filterListSortParams: filterListSortParams,
    selectedFilter,
    filterList: filters,
    filterCached,
    defaultFilter: defaultFilterId,
    lastRequestedPayload: lastReqPayload,
    selectedAttributeFilter,
    isAssigned,
    isUnsavedFilter,
  } = useSelector((state: RootState) => state.task);  

  const { viewTasks,viewFilters } = userRoles()
  const allTasksPayload = useAllTasksPayload();
  const [showSortModal, setShowSortModal] = useState(false);
  const taskvariables = selectedFilter?.variables ?? [];
 
  //inital data loading
  const initialDataLoading = async () => {
    // If we have an unsaved filter, do not reset filter state
    if (isUnsavedFilter) {
      dispatch(setBPMFilterLoader(false));
      return;
    }
    dispatch(setBPMFilterLoader(true));
    if(!viewFilters && viewTasks){
      dispatch(setSelectedFilter(allTasksPayload));
      dispatch(fetchServiceTaskList(allTasksPayload, null, 1, limit))
    }
    else{
      const filterResponse = await fetchFilterList();
      const filters = filterResponse.data.filters;
      const updatedfilters = filters.filter((filter) => !filter.hide);
      const defaultFilterId = filterResponse.data.defaultFilter;
      if (filters?.length) {
        batch(() => {
          dispatch(setBPMFilterList(filters));
          defaultFilterId && dispatch(setDefaultFilter(defaultFilterId));
          dispatch(fetchBPMTaskCount(updatedfilters));
        });
        // If no default filter, will select All Tasks filter if its exists, else will select first filter
        if (defaultFilterId !== filters.find((f) => f.id === defaultFilterId)?.id) {
          const newFilter = filters.find(f => f.name === "All Tasks") || filters[0];
          dispatch(setDefaultFilter(newFilter.id));
          updateDefaultFilter(newFilter.id);
        }
      }   
      // if no filter is present, the data will be shown as All Tasks response
      else {
        dispatch(setSelectedFilter(allTasksPayload));
        dispatch(fetchServiceTaskList(allTasksPayload, null, 1, limit));
      }
    }
    dispatch(setBPMFilterLoader(false));
  };

  const handleAssigneTabClick = (assigned: boolean) => {
  dispatch(setIsAssigned(assigned));
};

  const toggleFilterModal = () => setShowSortModal(!showSortModal);



  const fetchTaskListData = ({
  sortData = null,
  newPage = null,
  newLimit = null,
  newDateRange = null
} = {}) => {
  /**
   * We need to create payload for the task list
   * If filterCached is true, use lastReqPayload (for persist)
   * If selectedFilter is not null, create payload using selectedFilter
   * If not, set the default filter manually and use it immediately (do not rely on updated Redux state)
   */
  let payload = null;
  const enabledSort = new Set ([
    "applicationId",
    "submitterName",
    "formName"
  ])
  // check if selectedType belongs to sortableList
  const currentVariable = taskvariables.find((item)=> item.key === filterListSortParams?.activeKey);
  const isFormVariable =currentVariable?.isFormVariable || enabledSort.has(filterListSortParams?.activeKey) ;
  if (filterCached) {
    payload = lastReqPayload;
    dispatch(resetTaskListParams({ filterCached: false }));
  } else if (selectedFilter) {
    payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      sortData || filterListSortParams,
      newDateRange || dateRange,
      isAssigned,
      isFormVariable
    );  
  }

  if (!payload) return;

  dispatch(setBPMTaskLoader(true));
  dispatch(
    fetchServiceTaskList(
      payload,
      null,
      newPage || activePage,
      newLimit || limit
    )
  );
};


  const handleRefresh = () => {
    fetchTaskListData();
  };

  // Clear task filter, attribute filter, and date range to defaults
  const handleClearAllFilters = () => {
    // Determine the base filter to reset to
    let baseFilter = null as any;
    if (defaultFilterId) {
      baseFilter = filters.find((f) => f.id === defaultFilterId);
    }
    if (!baseFilter) {
      baseFilter = allTasksPayload; // fallback to All Tasks
    }

    batch(() => {
      // Reset core selections
      dispatch(setSelectedFilter(baseFilter));
      dispatch(setSelectedBpmAttributeFilter(null as any));
      dispatch(setDateRangeFilter({ startDate: null, endDate: null }));
      // Reset pagination defaults
      dispatch(setBPMTaskListActivePage(1));
      dispatch(setTaskListLimit(10));
      // Refresh attribute filter list for the base filter, if applicable
      if (baseFilter?.id) {
        dispatch(fetchAttributeFilterList(baseFilter.id) as any);
      }
      // Fetch tasks for the base filter
      dispatch(fetchServiceTaskList(baseFilter, null, 1, 25) as any);
    });
  };

  const handleSortApply = (selectedSortOption, selectedSortOrder) => {
    // reset the sort orders using helper function
    const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
  
    // get the variable info first
    const selectedVar = taskvariables.find(item => item.key === selectedSortOption);
    const selectedType = selectedVar?.type;
  
    // check if it's a form variable
    const isFormVariable = sortableKeysSet.has(selectedType);
  
    const updatedData = {
      ...resetSortOrders,
      activeKey: selectedSortOption,
      [selectedSortOption]: {
        sortOrder: selectedSortOrder,
        ...(isFormVariable && { type: selectedType })
      },
    };
  
    dispatch(setFilterListSortParams(updatedData));
    setShowSortModal(false);
    fetchTaskListData({ sortData: updatedData  });
  };
  

  const handleDateRangeChange = (newDateRange) => {
    /**
     * the values means we need to call the api for date range change when start date or end date is selected
     * if it is cleared we need to call the api again but newDateRange will be null
     * if any one of the values selected we don't want to call the api
     */
    const values = Object.values(newDateRange);
    dispatch(setDateRangeFilter(newDateRange));
    if (values.length == 1) return;
    // Reset active page and limit when date range changes
    dispatch(setBPMTaskListActivePage(1));
    // Fetch task list with new date range
    fetchTaskListData({
      newPage: 1,
      newDateRange: values.length ? newDateRange : null,
    });
  };

  useEffect(() => {
    // no neeed to call this on if filterCached is true
    if (filterCached) return;
    initialDataLoading();
  }, [isUnsavedFilter]);
  /* this useEffect will work each time default filter changes*/
  useEffect(() => {
    // no neeed to call this on if filterCached is true
    if (filterCached) return;
    if (defaultFilterId) {
      const currentFilter = filters.find(
        (filter) => filter.id === defaultFilterId
      );

      if (!currentFilter || defaultFilterId === selectedFilter?.id) return;
      batch(() => {
        dispatch(setSelectedFilter(currentFilter));
        dispatch(setDateRangeFilter({ startDate: null, endDate: null }));
        dispatch(fetchAttributeFilterList(currentFilter.id));
        dispatch(setBPMTaskListActivePage(1));
        dispatch(setTaskListLimit(10));
        dispatch(fetchServiceTaskList(currentFilter, null, 1, 25));
      });
    }
  }, [defaultFilterId, selectedFilter]);

  useEffect(() => {
    fetchTaskListData();
  }, [isAssigned, activePage, limit]);

  const optionsForSortModal = () => {
    const existingValues = new Set(optionSortBy.keys);  
    const dynamicColumns = buildDynamicColumns(taskvariables);
  
    const filteredDynamicColumns = dynamicColumns
      .filter(column =>
      !existingValues.has(column.sortKey) && // filter out duplicates form sorting list 
      sortableKeysSet.has(column.type))  // sorting enabled only for sortablelist items and optionSortBy
      .map(column => ({
        value: column.sortKey,
        label: column.name,
      }));
  
    return [...optionSortBy.options, ...filteredDynamicColumns];
  };
  
  return (
    <>
      <div className="Toastify"></div>
      <div className="toast-section">{}</div>
      <div className="header-section-1">
        <div className="section-seperation-left">
          <h4> Tasks </h4>
        </div>
      </div>
      {/* Commenting out since global search is out of scope for this module */}
      {/* <div className="header-section-2">
        <div className="section-seperation-left">
          <div className="medium-search-container">
          <CustomSearch
            // search={}
            // setSearch={}
            // handleSearch={}

            placeholder={t("Search")}
            // searchLoading={}
            title={t("Search Tasks")}
            dataTestId="task-search-input"
          />
          </div>       
            </div></div>    */}
            <div className="header-section-2 overflow-visible">
              <div className="section-seperation-left">
              <TaskListDropdownItems/>
              <AttributeFilterDropdown/>
              
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={t("Filter Created Date")}
              dataTestId="date-range-picker"
              ariaLabel={t("Select date range for filtering")}
              startDateAriaLabel={t("Start date")}
              endDateAriaLabel={t("End date")}
            />
              </div>
        <div className="d-flex justify-content-end flex-fill">
          <V8CustomButton
            variant="secondary"
            onClick={handleClearAllFilters}
            label={t("Clear")}
            dataTestId="clear-all-review-filters-button"
          />
        </div>
              
              </div>   
              <div className="header-section-3">
                <div className="section-seperation-left">
                <V8CustomButton
  variant={!isAssigned ? "primary" : "secondary"}
      onClick={() => handleAssigneTabClick(false)}
      label={t("All")}
      selected={!isAssigned}
    />
    <V8CustomButton
  variant={isAssigned ? "primary" : "secondary"}
      onClick={() => handleAssigneTabClick(true)}
      label={t("Assigned to me")}
      selected={isAssigned}
    />
                </div>
              </div>
         {viewTasks && <div className="body-section"><TaskListTable /></div>}
    </>
  );
};

export default TaskList;
