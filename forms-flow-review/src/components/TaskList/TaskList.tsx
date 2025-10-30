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
  // Use the actual sort key stored in filterListSortParams
  const actualSortKey = filterListSortParams?.actualSortKey || filterListSortParams?.activeKey;
  // Check if it's explicitly set as a form variable or is in the enabled sort set
  const isFormVariable = filterListSortParams?.isFormVariable !== undefined 
    ? filterListSortParams.isFormVariable 
    : enabledSort.has(actualSortKey);
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
    // Reset the sort orders using helper function
    const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
    
    // Get all available sort options
    const allSortOptions = optionsForSortModal();
    
    // Find the selected option from our options list
    const selectedOption = allSortOptions.find(option => option.value === selectedSortOption);
    
    if (!selectedOption) {
      console.error("Selected sort option not found:", selectedSortOption);
      return;
    }
    
    // Get the actual sort key and form variable flag from the selected option
    const actualSortKey = selectedOption.actualSortKey || selectedSortOption;
    const isFormVariable = selectedOption.isFormVariable;
    const selectedType = selectedOption.type;
    
    const updatedData = {
      ...resetSortOrders,
      activeKey: selectedSortOption,
      [selectedSortOption]: {
        sortOrder: selectedSortOrder,
        ...(isFormVariable && { type: selectedType })
      },
      // Store the actual sortKey to use in API requests
      actualSortKey: actualSortKey,
      isFormVariable: isFormVariable
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
    // Get predefined sort options and dynamic columns from task variables
    const existingKeys = new Set(optionSortBy.keys);
    const dynamicColumns = buildDynamicColumns(taskvariables);
    
    // Track what we've already used to avoid duplicates
    const usedLabels = new Map();
    const usedValues = new Set();
    
    // Process the base options first
    const baseOptions = optionSortBy.options.map(option => {
      // Mark this label and value as used
      usedLabels.set(option.label, true);
      usedValues.add(option.value);
      
      return {
        ...option,
        actualSortKey: option.value,
        isFormVariable: false
      };
    });
    
    // Process dynamic columns from task variables
    const formFieldOptions = dynamicColumns
      // Only keep sortable columns that aren't duplicates (unless they're form variables)
      .filter(column => 
        sortableKeysSet.has(column.type) && 
        (!existingKeys.has(column.sortKey) || column.isFormVariable)
      )
      .map(column => {
        // Create a unique identifier for this column
        const uniqueValue = column.isFormVariable ? 
          `${column.sortKey}_form` : column.sortKey;
        
        // Skip if we already have this value
        if (usedValues.has(uniqueValue)) {
          return null;
        }
        
        // Start with the column name as the label
        let label = column.name;
        
        // If this label is already used, make it unique
        if (usedLabels.has(label)) {
          // Add context to the label
          label = column.isFormVariable ? 
            `${label} (Form Field)` : 
            `${label} (Task Field)`;
          
          // If still a duplicate, add a number
          if (usedLabels.has(label)) {
            let counter = 1;
            let newLabel = label;
            
            while (usedLabels.has(newLabel)) {
              counter++;
              newLabel = `${label} ${counter}`;
            }
            
            label = newLabel;
          }
        }
        
        // Mark this label and value as used
        usedLabels.set(label, true);
        usedValues.add(uniqueValue);
        
        return {
          value: uniqueValue,
          label: label,
          actualSortKey: column.sortKey,
          isFormVariable: column.isFormVariable,
          type: column.type
        };
      })
      .filter(Boolean); // Remove null entries
    
    // Combine base options with form field options
    return [...baseOptions, ...formFieldOptions];
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
