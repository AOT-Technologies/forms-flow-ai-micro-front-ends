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
  AddIcon,
  DateRangePicker,
  FilterSortActions,
  ConnectIcon,
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
  Switch,
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

  const handleCheckBoxChange = () => {
    dispatch(setIsAssigned(!isAssigned));
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
        dispatch(setTaskListLimit(25));
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
        <div className="table-bar">
          {/* Left Filters - Stack on small, inline on md+ */}
          { viewFilters && (
            <>
           <div className="filters">
            <TaskListDropdownItems />

            <ConnectIcon />

            <AttributeFilterDropdown />

            <ConnectIcon />

            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={t("Filter Created Date")}
              dataTestId="date-range-picker"
              ariaLabel={t("Select date range for filtering")}
              startDateAriaLabel={t("Start date")}
              endDateAriaLabel={t("End date")}
            />

            <ConnectIcon />

            {/* should probably be created as a separate component "InputFilterSingle" */}
            <label htmlFor="assigned-to-me" className="input-filter single">
              <input
                id="assigned-to-me"
                type="checkbox"
                checked={isAssigned}
                onClick={handleCheckBoxChange}
                data-testid="assign-to-me-checkbox"
                />
              <span>{t("Assigned to me")}</span>
              {isAssigned ? <CheckboxCheckedIcon /> : <CheckboxUncheckedIcon /> }
            </label>
           </div>

              

            <div className="actions">
              <FilterSortActions
                showSortModal={showSortModal}
                handleFilterIconClick={toggleFilterModal}
                handleRefresh={handleRefresh}
                handleSortModalClose={toggleFilterModal}
                handleSortApply={handleSortApply}
                defaultSortOption={filterListSortParams?.activeKey}
                defaultSortOrder={
                  filterListSortParams?.[filterListSortParams?.activeKey]
                    ?.sortOrder ?? "asc"
                }
                optionSortBy={optionsForSortModal()}
                filterDataTestId="task-list-filter"
                filterAriaLabel={t("Filter the task list")}
                refreshDataTestId="task-list-refresh"
                refreshAriaLabel={t("Refresh the task list")}
                sortModalTitle={t("Sort Tasks")}
                sortModalDataTestId="task-sort-modal"
                sortModalAriaLabel={t("Modal for sorting tasks")}
                sortByLabel={t("Sort by")}
                sortOrderLabel={t("Sort order")}
                ascendingLabel={t("Ascending")}
                descendingLabel={t("Descending")}
                applyLabel={t("Apply")}
                cancelLabel={t("Cancel")}
              />
            </div>
            </>
          )}
        </div>
         {viewTasks && <TaskListTable />}
    </>
  );
};

export default TaskList;
