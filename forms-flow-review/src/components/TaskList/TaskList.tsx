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
} from "../../api/services/filterServices";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  AddIcon,
  DateRangePicker,
  FilterSortActions,
  ConnectIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskListDropdownItems from "./TaskFilterDropdown";
import { RootState } from "../../reducers";
import TaskListTable from "./TasklistTable";
import { HelperServices } from "@formsflow/service";
import AttributeFilterDropdown from "./AttributeFilterDropdown";
import { createReqPayload } from "../../helper/taskHelper";
import { optionSortBy } from "../../helper/tableHelper";

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
    isAssigned
  } = useSelector((state: RootState) => state.task);

   
  const [showSortModal, setShowSortModal] = useState(false);

  //inital data loading
  const initialDataLoading = async () => {
    dispatch(setBPMFilterLoader(true));
    const filterResponse = await fetchFilterList();
    const filters = filterResponse.data.filters;
    const defaultFilterId = filterResponse.data.defaultFilter;
    if (filters?.length) {
      batch(() => {
        dispatch(setBPMFilterList(filters));
        defaultFilterId && dispatch(setDefaultFilter(defaultFilterId));
        dispatch(fetchBPMTaskCount(filters));
      });
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
    newDateRange = null,
  } = {}) => {
    /**
     * we need to create paylaod for the task list
     * if filterCached is true we need to use lastReqPayload [this will use for persist]
     * if selectedFilter is not null we need to create payload using selectedFilter, selectedAttributeFilter, sortData, newDateRange and isAssigned
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
        dispatch(setTaskListLimit(15));
        dispatch(fetchServiceTaskList(currentFilter, null, 1, 15));
      });
    }
  }, [defaultFilterId]);

  useEffect(() => {
    fetchTaskListData();
  }, [isAssigned, activePage, limit]);

  return (
    <>
        <div className="table-bar">
          {/* Left Filters - Stack on small, inline on md+ */}
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

          </div>
            
         <TaskListTable />
    </>
  );
};

export default TaskList;
