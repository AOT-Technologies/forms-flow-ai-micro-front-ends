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
  fetchUserList,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  AddIcon,
  DateRangePicker,
  FilterSortActions,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskListDropdownItems from "./TaskFilterDropdown";
import { RootState } from "../../reducers";
import TaskListTable from "./TasklistTable";
import { HelperServices } from "@formsflow/service";
import AttributeFilterDropdown from "./AttributeFilterDropdown";
import { createReqPayload } from "../../helper/taskHelper";
import { optionSortBy } from "../../helper/tableHelper";
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
    filterList,
  } = useSelector((state: RootState) => state.task);  

  const { viewTasks,viewFilters } = userRoles()
  const allTasksPayload = useAllTasksPayload();
  const [showSortModal, setShowSortModal] = useState(false);
 
  //inital data loading
  const initialDataLoading = async () => {
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

  useEffect(() => {
  if (filterList && filterList.length > 0) {
    fetchTaskListData();
  }
}, [filterList]);


  const fetchTaskListData = ({
  sortData = null,
  newPage = null,
  newLimit = null,
  newDateRange = null,
} = {}) => {
  /**
   * We need to create payload for the task list
   * If filterCached is true, use lastReqPayload (for persist)
   * If selectedFilter is not null, create payload using selectedFilter
   * If not, set the default filter manually and use it immediately (do not rely on updated Redux state)
   */

  let payload = null;

  if (filterCached) {
    payload = lastReqPayload;
    dispatch(resetTaskListParams({ filterCached: false }));
  } else if (selectedFilter) {
    payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      sortData || filterListSortParams,
      newDateRange || dateRange,
      isAssigned
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
    // if need to reset the sort orders use this function
    const resetSortOrders = HelperServices.getResetSortOrders(
      optionSortBy.options
    );
    const updatedData = {
      ...resetSortOrders,
      activeKey: selectedSortOption,
      [selectedSortOption]: { sortOrder: selectedSortOrder },
    };
    dispatch(setFilterListSortParams(updatedData));
    setShowSortModal(false);
    fetchTaskListData({ sortData: updatedData });
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
    dispatch(fetchUserList());
  }, []);

  /* this useEffect will work each time default filter changes*/
  useEffect(() => {
    // no neeed to call this on if filterCached is true
    if (filterCached) return;
    if (defaultFilterId) {
      const currentFilter = filters.find(
        (filter) => filter.id === defaultFilterId
      );
      if (!currentFilter) return;
      batch(() => {
        dispatch(setSelectedFilter(currentFilter));
        dispatch(setDateRangeFilter({ startDate: null, endDate: null }));
        dispatch(fetchAttributeFilterList(currentFilter.id));
        dispatch(setBPMTaskListActivePage(1));
        dispatch(setTaskListLimit(25));
        dispatch(fetchServiceTaskList(currentFilter, null, 1, 25));
      });
    }
  }, [defaultFilterId]);

  useEffect(() => {
    fetchTaskListData();
  }, [isAssigned, activePage, limit]);
  return (
    <>
      <div
        className="container-fluid py-4"
        data-testid="resizable-table-container"
        aria-label={t("Resizable tasks table container")}
      >
        <div className="row w-100 mb-3 g-2">
          {/* Left Filters - Stack on small, inline on md+ */}
          { viewFilters &&
          <div className="col-12 col-md d-flex flex-wrap gap-3 align-items-center">
            <div className="mb-2">
              <TaskListDropdownItems />
            </div>

            <span className="text-muted">
              <AddIcon size="8" />
            </span>
            <div className="mb-2">
              <AttributeFilterDropdown />
            </div>
            <span className="text-muted">
              <AddIcon size="8" />
            </span>
            <div className="mb-2">
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

            <span className="text-muted">
              <AddIcon size="8" />
            </span>
            <div className="mb-2">
              <button
                className={`custom-checkbox-container button-as-div ${
                  isAssigned ? "checked" : ""
                }`}
                onClick={handleCheckBoxChange}
              >
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={isAssigned}
                  onChange={handleCheckBoxChange}
                  data-testid="assign-to-me-checkbox"
                />
                <span className="custom-checkbox-label">
                  {t("Assign to me")}
                </span>
              </button>
            </div>

            {/* Right actions - Stack below on small */}
            <div className="col-12 col-md-auto d-flex justify-content-end button-align">
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
                optionSortBy={optionSortBy.options}
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

          </div>}
            
        </div>
         {viewTasks && <TaskListTable />}
      </div>
    </>
  );
};

export default TaskList;
