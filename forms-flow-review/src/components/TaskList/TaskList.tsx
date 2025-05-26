import { useCallback, useEffect, useState } from "react";
import {
  setBPMFilterList,
  setBPMFilterLoader,
  setBPMTaskListActivePage,
  setBPMTaskLoader,
  setDefaultFilter,
  setFilterListSortParams,
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
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskListDropdownItems from "./TaskFilterDropdown";
import { RootState } from "../../reducers";
import TaskListTable from "./TasklistTable";
import { HelperServices } from "@formsflow/service";
import { DateRange } from "../../types/taskFilter";
import AttributeFilterDropdown from "./AttributeFilterDropdown";
import { createReqPayload } from "../../helper/taskHelper";
import { optionSortBy } from "../../helper/tableHelper";


const TaskList = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const selectedFilter = useSelector((state: any) => state.task.selectedFilter);
  //   const tasksCount = useSelector((state:any) => state.task.tasksCount);
  //   const isUnsavedFilter = useSelector((state:any) => state.task.isUnsavedFilter);
  const defaultFilterId = useSelector(
    (state: RootState) => state.task.defaultFilter
  );
  const filters = useSelector((state: RootState) => state.task.filterList);
  const activePage = useSelector((state: RootState) => state.task.activePage);
  const selectedAttributeFilter = useSelector(
    (state: RootState) => state.task.selectedAttributeFilter
  );
  const limit = useSelector((state: RootState) => state.task.limit);
  const filterListSortParams = useSelector(
    (state: RootState) => state.task.filterListSortParams
  );
  const [isAssigned, setIsAssigned] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

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
    setIsAssigned(!isAssigned);
  };

  const toggleFilterModal = () => setShowSortModal(!showSortModal);
  const fetchTaskListData = ({sortData=null,newPage=null, newLimit=null, newDateRange=null} = {}) => {
    if (selectedFilter?.id) {
      const payload = createReqPayload(
        selectedFilter,
        selectedAttributeFilter,
        sortData || filterListSortParams,
        newDateRange || dateRange,
        isAssigned
      );
      dispatch(setBPMTaskLoader(true));
      dispatch(fetchServiceTaskList(payload, null, newPage|| activePage, newLimit || limit));
    }
  };

  const handleRefresh = () => {
    fetchTaskListData();
  };

  const handleSortApply = (selectedSortOption, selectedSortOrder) => {
     // if need to reset the sort orders use this function
      const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
      const updatedData = {
          ...resetSortOrders,
          activeKey: selectedSortOption,
          [selectedSortOption]: { sortOrder: selectedSortOrder },
        }
      dispatch(
        setFilterListSortParams(updatedData)
      );
      setShowSortModal(false);
      fetchTaskListData({sortData:updatedData})
    }

    const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    if(!newDateRange?.startDate ||  !newDateRange?.endDate) return
    // Reset active page and limit when date range changes
    dispatch(setBPMTaskListActivePage(1)); 
    // Fetch task list with new date range
    fetchTaskListData({newPage: 1, newDateRange});
  }

  useEffect(() => {
    initialDataLoading();
    dispatch(fetchUserList());
  }, []);

  /* this useEffect will work each time default filter changes*/
  useEffect(() => {
    if (defaultFilterId) {
      // need to set default filter in redux store
      // need to fetch attribute filters against the default filter
      // need to fetch task count against the default filter
      // need to fetch task list against the default filter

      const currentFilter = filters.find(
        (filter) => filter.id === defaultFilterId
      );
      if (!currentFilter) return;
      dispatch(setSelectedFilter(currentFilter));
      dispatch(fetchAttributeFilterList(currentFilter.id));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(setTaskListLimit(15));
      dispatch(fetchServiceTaskList(currentFilter, null, 1, 15));
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

            <TaskListTable isAssigned={isAssigned} dateRange={dateRange} />
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskList;
