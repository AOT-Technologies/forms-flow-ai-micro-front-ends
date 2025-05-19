import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSelector, useDispatch, batch } from "react-redux";
import {
  TableFooter,
  SortableHeader,
  FilterSortActions,
  CustomButton,
  DateRangePicker,
  ButtonDropdown,
  AddIcon,
  PencilIcon,
  AssignUser,
  ReusableResizableTable,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import {
  setBPMFilterLoader,
  setBPMFiltersAndCount,
  setSelectedBPMFilter,
  setBPMTaskLoader,
  setBPMTaskListActivePage,
  setFilterListParams,
  setFilterListSortParams,
  setTaskListLimit,
  setDefaultFilter,
  resetTaskListParams,
  setSelectedBpmAttributeFilter,
} from "../../actions/taskActions";

import TaskFilterModal from "../TaskFilterModal";
import { useHistory } from "react-router-dom";
import {
  fetchFilterList,
  fetchBPMTaskCount,
  fetchServiceTaskList,
  updateDefaultFilter,
  claimBPMTask,
  unClaimBPMTask,
  updateAssigneeBPMTask,
  updateFilter,
  fetchAttributeFilterList,
} from "../../api/services/filterServices";
import { UN_SAVED_FILTER } from "../constants/taskConstants";

import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import Loading from "../Loading";
import { MULTITENANCY_ENABLED } from "../../constants";
import { StorageService, HelperServices } from "@formsflow/service";
import AttributeFilterModal from "../AttributeFilterModal";

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number;
}

interface Task {
  id: string;
  name?: string;
  created?: string;
  assignee?: string;
  _embedded?: {
    variable?: Array<{ name: string; value: any }>;
  };
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Utility function for retry logic
const retryTaskUpdate = (
  taskId: string,
  reqData: any,
  firstResult: number,
  dispatch: Function,
  RETRY_DELAY_TIME: number,
  limit: number
) => {
  setTimeout(() => {
    dispatch(fetchServiceTaskList(reqData, null, firstResult, limit));
  }, RETRY_DELAY_TIME);
};

const updateBpmTasksAndDetails = (
  err: Error | null,
  taskId: string,
  dispatch: Function,
  reqData: any,
  firstResult: number,
  RETRY_DELAY_TIME: number,
  limit: number
) => {
  if (err) console.log("Error in task updation-", err);
  retryTaskUpdate(
    taskId,
    reqData,
    firstResult,
    dispatch,
    RETRY_DELAY_TIME,
    limit
  );
};

const onChangeClaim = (
  task: Task,
  selectedUserName: string,
  dispatch: Function,
  limit: number,
  RETRY_DELAY_TIME: number,
  reqData: any,
  firstResult: number
) => {
  if (selectedUserName && selectedUserName !== task.assignee) {
    dispatch(
      // eslint-disable-next-line no-unused-vars
      updateAssigneeBPMTask(task?.id, selectedUserName, (err) =>
        updateBpmTasksAndDetails(
          err,
          task?.id,
          dispatch,
          reqData,
          firstResult,
          RETRY_DELAY_TIME,
          limit
        )
      )
    );
  }
};

const onClaim = (
  taskId: string,
  userData: any,
  dispatch: Function,
  limit: number,
  RETRY_DELAY_TIME: number,
  reqData: any,
  firstResult: number
) => {
  dispatch(
    claimBPMTask(taskId, userData?.preferred_username, (err) =>
      updateBpmTasksAndDetails(
        err,
        taskId,
        dispatch,
        reqData,
        firstResult,
        RETRY_DELAY_TIME,
        limit
      )
    )
  );
};

const onUnClaimTask = (
  taskId: string,
  dispatch: Function,
  limit: number,
  RETRY_DELAY_TIME: number,
  reqData: any,
  firstResult: number
) => {
  dispatch(
    // eslint-disable-next-line no-unused-vars
    unClaimBPMTask(taskId, (err) =>
      updateBpmTasksAndDetails(
        err,
        taskId,
        dispatch,
        reqData,
        firstResult,
        RETRY_DELAY_TIME,
        limit
      )
    )
  );
};

const renderAssigneeComponent = (
  task: Task,
  limit: number,
  RETRY_DELAY_TIME: number,
  reqData: any,
  firstResult: number,
  dispatch: Function,
  userData: any,
  userList: any
) => {
  return (
    <AssignUser
      size="sm"
      users={userList?.data ?? []}
      username={task?.assignee}
      meOnClick={() =>
        onClaim(
          task?.id,
          userData,
          dispatch,
          limit,
          RETRY_DELAY_TIME,
          reqData,
          firstResult
        )
      }
      optionSelect={(userName) =>
        onChangeClaim(
          task,
          userName,
          dispatch,
          limit,
          RETRY_DELAY_TIME,
          reqData,
          firstResult
        )
      }
      handleCloseClick={() =>
        onUnClaimTask(
          task?.id,
          dispatch,
          limit,
          RETRY_DELAY_TIME,
          reqData,
          firstResult
        )
      }
    />
  );
};

// Extracted table cell rendering component
const getCellValue = (
  column: Column,
  task: Task,
  limit: number,
  RETRY_DELAY_TIME: number,
  reqData: any,
  firstResult: number,
  dispatch: Function,
  userData: any,
  userList: any
) => {
  const { sortKey } = column;
  const { name: taskName, created, _embedded } = task ?? {};
  const variables = _embedded?.variable ?? [];
  if (column.sortKey === "applicationId") {
    return variables.find((v) => v.name === "applicationId")?.value ?? "-";
  }

  switch (sortKey) {
    case "name":
      return taskName ?? "-";
    case "created":
      return created ? HelperServices.getLocaldate(created) : "N/A";
    case "assignee":
      return renderAssigneeComponent(
        task,
        limit,
        RETRY_DELAY_TIME,
        reqData,
        firstResult,
        dispatch,
        userData,
        userList
      );
    default:
      return variables.find((v) => v.name === sortKey)?.value ?? "-";
  }
};

export function ResizableTable(): JSX.Element {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const RETRY_DELAY_TIME = 2000;
  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showAttrFilterModal, setShowAttrFilterModal] = useState(false);
  const [isAssigned, setIsAssigned] = useState(false);
  const [taskAttributeData, setTaskAttributeData] = useState([]);
  const [filterParams, setFilterParams] = useState({});
  const history = useHistory();
  const {
    filterList = [],
    attributeFilterList = [],
    selectedFilter = null,
    selectedAttributeFilter = null,
    taskId: bpmTaskId = null,
    limit,
    tasksList: taskList = [],
    defaultFilter = null,
    filtersAndCount: filtersCount = null,
    filterListSearchParams: searchParams,
    filterListSortParams: sortParams,
    listReqParams: reqData,
    activePage,
    tasksCount,
    isTaskListLoading,
    filterCached,
  } = useSelector((state: any) => state.task ?? {});
  const selectedFilterId = selectedFilter?.id ?? null;
  const selectedAttributeFilterId = selectedAttributeFilter?.id ?? null;
  const bpmFiltersList = filterList;
  const bpmattributeFilterList = attributeFilterList;

  const taskvariables = selectedFilter?.variables ?? [];

  const handleToggleFilterModal = useCallback(() => {
    setShowTaskFilterModal((prevState) => !prevState);
  }, []);

  const handleToggleAttrFilterModal = useCallback(() => {
    setShowAttrFilterModal((prevState) => !prevState);
  }, []);

  const [columns, setColumns] = useState<Column[]>([]);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const optionSortBy = useMemo(
    () => [
      { value: "name", label: t("Task") },
      { value: "created", label: t("Created Date") },
      { value: "assignee", label: t("Assigned To") },
    ],
    [t]
  );

  const [filterToEdit, setFilterToEdit] = useState(null);
  const [attrFilterToEdit, setAttrFilterToEdit] = useState(null);
  const [canEditFilter, setCanEditFilter] = useState(false);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const userList = useSelector((state: any) => state.task?.userList);
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );

  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
  );
  const userData =
    StorageService.getParsedData(StorageService.User.USER_DETAILS) ?? {};

  const isFilterCreator = userRoles.includes("create_filters");
  const isFilterAdmin = userRoles.includes("manage_all_filters");

  useEffect(() => {
    dispatch(setBPMFilterLoader(true));
    dispatch(
      fetchFilterList((err: Error | null, data: any) => {
        if (data) {
          fetchBPMTaskCount(data.filters)
            .then((res) => {
              dispatch(setBPMFiltersAndCount(res.data));
            })
            .catch((err) =>
              console.error("Error fetching BPM task count:", err)
            )
            .finally(() => {
              dispatch(setBPMFilterLoader(false));
            });
        }
      })
    );
  }, [dispatch, defaultFilter]);

  useEffect(() => {
    if (filterList.length === 0) return;

    // Step 1: Determine the default or unsaved filter
    const filterSelected =
      filterList.find(
        (filter) =>
          filter.id === defaultFilter || filter.name === UN_SAVED_FILTER
      ) ?? filterList[0];

    if (!filterSelected?.id) return;

    // Step 2: Clear current attribute filters
    dispatch(setSelectedBpmAttributeFilter({}));

    // Step 3: Fetch attribute filters for the selected filter ID
    const handleAttributeFilterList = (err: Error | null, data: any) => {
      if (err) return;

      const attributeFilters = data?.attributeFilters ?? [];
      const attributefilterSelected =
        attributeFilters.find((f: any) => f.name === UN_SAVED_FILTER) ||
        attributeFilters[0];

      batch(() => {
        dispatch(setSelectedBPMFilter(filterSelected));
        dispatch(setSelectedBpmAttributeFilter(attributefilterSelected || {}));
      });
    };

    dispatch(
      fetchAttributeFilterList(filterSelected.id, handleAttributeFilterList)
    );
  }, [filterList.length, defaultFilter, dispatch]);

  useEffect(() => {
    if (selectedFilter.id) {
      const updatedFilter = {
        ...reqData,
        criteria: {
          ...reqData.criteria,
          ...(isAssigned && { assigneeExpression: "${ currentUser() }" }),
        },
      };
      dispatch(setBPMTaskLoader(true));
      dispatch(fetchServiceTaskList(updatedFilter, null, activePage, limit));
    }
  }, [isAssigned]);

  useEffect(() => {
    if (Array.isArray(taskvariables)) {
      const dynamicColumns = taskvariables
        .filter((variable) => variable.isChecked)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((variable) => ({
          name: variable.label,
          width: variable.width ?? 200,
          sortKey: variable.name,
          resizable: true,
        }));

      if (dynamicColumns.length > 0) {
        dynamicColumns.push({
          name: "",
          width: 100,
          sortKey: "actions",
          resizable: false,
        });
      }

      // Only update if columns are different
      setColumns((prevColumns) => {
        if (!isEqual(prevColumns, dynamicColumns)) {
          return dynamicColumns;
        }
        return prevColumns;
      });
    }
  }, [taskvariables]);

  const handleSortApply = useCallback(
    (selectedSortOption, selectedSortOrder) => {
      const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy);
      dispatch(
        setFilterListSortParams({
          ...resetSortOrders,
          activeKey: selectedSortOption,
          [selectedSortOption]: { sortOrder: selectedSortOrder },
        })
      );
      setShowSortModal(false);
    },
    [dispatch, optionSortBy]
  );

  const handleSort = useCallback(
    (key) => {
      const newSortOrder =
        sortParams[key]?.sortOrder === "asc" ? "desc" : "asc";
      const updatedSort = Object.keys(sortParams).reduce((acc, columnKey) => {
        acc[columnKey] = {
          sortOrder: columnKey === key ? newSortOrder : "asc",
        };
        return acc;
      }, {});

      dispatch(
        setFilterListSortParams({
          ...updatedSort,
          activeKey: key,
        })
      );
    },
    [dispatch, sortParams]
  );

  const handleEditTaskFilter = useCallback(() => {
    if (!selectedFilter) return;
    const matchingFilter = filterList.find((f) => f.id === selectedFilter.id);
    if (!matchingFilter) return;

    const editPermission = matchingFilter?.editPermission;
    const isEditable = (isFilterCreator || isFilterAdmin) && editPermission;
    setFilterToEdit(matchingFilter);
    setCanEditFilter(isEditable);
    setShowTaskFilterModal(true);
  }, [selectedFilter, filterList, isFilterCreator, isFilterAdmin]);

  const handleEditAttrFilter = useCallback(() => {
    if (!selectedAttributeFilter) return;
    const matchingFilter = bpmattributeFilterList.find((f) => f.id === selectedAttributeFilter.id);
    if (!matchingFilter) return;

    const editPermission = matchingFilter?.editPermission;
    const isEditable = (isFilterCreator || isFilterAdmin) && editPermission;
    setAttrFilterToEdit(matchingFilter);
    setCanEditFilter(isEditable);
    setShowAttrFilterModal(true);
  }, [selectedAttributeFilter, bpmattributeFilterList, isFilterCreator, isFilterAdmin]);

  useEffect(() => {  
    const currentFilter = filterList.find((item) => item.id === defaultFilter);
    if (currentFilter) {
      const checkedVariables = currentFilter.variables?.filter(
        (variable) => variable.isChecked
      );
      setTaskAttributeData(checkedVariables);
    }
  }, [filterList, defaultFilter]);

  const changeFilterSelection = useCallback(
    (filter) => {
      const selectedFilter = filterList.find((item) => item.id === filter.id);
      if (!selectedFilter) return;

      const taskAttributes = selectedFilter.variables.filter(
        (variable) => variable.isChecked === true
      );
      setTaskAttributeData(taskAttributes);
      const defaultFilterId =
        selectedFilter.id === defaultFilter ? null : selectedFilter.id;
      updateDefaultFilter(defaultFilterId)
        .then((updateRes) =>
          dispatch(setDefaultFilter(updateRes.data.defaultFilter))
        )
        .catch((error) =>
          console.error("Error updating default filter:", error)
        );
      dispatch(setBPMTaskListActivePage(1));
    },
    [dispatch, defaultFilter, filterList]
  );

  const changeAttributeFilterSelection = useCallback(
    (attributeFilter) => {
      const selectedAttributeFilter = bpmattributeFilterList.find(
        (item) => item.id === attributeFilter.id
      );
      if (!selectedAttributeFilter) return;

      dispatch(setSelectedBpmAttributeFilter(selectedAttributeFilter));
      // Do not trigger fetch here; useEffect will handle it
    },
    [dispatch, bpmattributeFilterList]
  );

  const filterDropdownItems = useMemo(() => {
    if (!Array.isArray(filtersCount) || filtersCount.length === 0) {
      return [
        {
          content: <em>{t("No filters found")}</em>,
          onClick: () => {},
          type: "none",
          dataTestId: "no-filters",
          ariaLabel: t("No filters available"),
        },
      ];
    }

    const mappedItems = filtersCount.map((filter) => ({
      content: `${t(filter.name)} (${filter.count})`,
      onClick: () => changeFilterSelection(filter),
      type: String(filter.id),
      dataTestId: `filter-item-${filter.id}`,
      ariaLabel: t("Select filter {{filterName}}", {
        filterName: t(filter.name),
      }),
    }));

    const extraItems = isFilterCreator
      ? [
          {
            content: (
              <span>
                <span>
                  <AddIcon className="filter-plus-icon" />
                </span>{" "}
                {t("Custom Filter")}
              </span>
            ),
            onClick: handleToggleFilterModal,
            type: "custom",
            dataTestId: "filter-item-custom",
            ariaLabel: t("Custom Filter"),
          },
          {
            content: (
              <span>
                <span>
                  <PencilIcon className="filter-edit-icon" />
                </span>{" "}
                {t("Re-order And Hide Filters")}
              </span>
            ),
            onClick: () => console.log("Re-order clicked"),
            type: "reorder",
            dataTestId: "filter-item-reorder",
            ariaLabel: t("Re-order And Hide Filters"),
          },
        ]
      : [];

    return [...mappedItems, ...extraItems];
  }, [
    filtersCount,
    t,
    handleToggleFilterModal,
    changeFilterSelection,
    isFilterCreator,
  ]);

  const filterDropdownAttributeItems = useMemo(() => {
    // Generate items based on the attributeFilterList
    const attributeItems =
      Array.isArray(attributeFilterList) && attributeFilterList.length > 0
        ? attributeFilterList.map((filter) => ({
            content: `${t(filter.name)}`,
            onClick: () => changeAttributeFilterSelection(filter),
            type: String(filter.id),
            dataTestId: `attr-filter-item-${filter.id}`,
            ariaLabel: t("Select attribute filter {{filterName}}", {
              filterName: t(filter.name),
            }),
          }))
        : [
            {
              content: <em>{t("No attribute filters found")}</em>,
              onClick: () => {},
              type: "none",
              dataTestId: "no-attr-filters",
              ariaLabel: t("No attribute filters available"),
            },
          ];

    const extraItems = isFilterCreator
      ? [
          {
            content: (
              <span>
                <span>
                  <AddIcon className="filter-plus-icon" />
                </span>{" "}
                {t("Custom Attribute Filter")}
              </span>
            ),
            onClick: handleToggleAttrFilterModal,
            type: "custom",
            dataTestId: "attr-filter-item-custom",
            ariaLabel: t("Custom Attribute Filter"),
          },
          {
            content: (
              <span>
                <span>
                  <PencilIcon className="filter-edit-icon" />
                </span>{" "}
                {t("Re-order And Hide Attribute Filters")}
              </span>
            ),
            onClick: () => console.log("Re-order attribute filters clicked"),
            type: "reorder",
            dataTestId: "attr-filter-item-reorder",
            ariaLabel: t("Re-order And Hide Attribute Filters"),
          },
        ]
      : [];

    return [...attributeItems, ...extraItems];
  }, [
    attributeFilterList,
    t,
    handleToggleAttrFilterModal,
    changeAttributeFilterSelection,
    isFilterCreator,
  ]);

  const hasFetchedInitially = useRef(false);

  useEffect(() => {
    if (!hasFetchedInitially.current) {
      hasFetchedInitially.current = true;
      return;
    }

    const activeKey = sortParams?.activeKey;
    const transformedSorting =
      activeKey && sortParams?.[activeKey]?.sortOrder
        ? [{ sortBy: activeKey, sortOrder: sortParams[activeKey].sortOrder }]
        : [];

    const reqParamData = {
      ...searchParams,
      sorting: transformedSorting,
    };

    if (dateRange?.startDate && dateRange?.endDate) {
      reqParamData.createdAfter = HelperServices.getISODateTime(
        dateRange.startDate
      );
      reqParamData.createdBefore = HelperServices.getISODateTime(
        dateRange.endDate
      );
    }

    const selectedParams = bpmFiltersList.find(
      (item) => item.id === selectedFilterId
    );
    if (!selectedParams) return;

    const selectedBpmAttributeFilter = bpmattributeFilterList.find(
      (item) => item.id === selectedAttributeFilterId
    );

    if (selectedAttributeFilterId && !selectedBpmAttributeFilter) return;

    const criteriaToUse =
      selectedBpmAttributeFilter?.criteria ?? selectedParams.criteria;

    const updatedParams = {
      ...selectedParams,
      criteria: {
        ...criteriaToUse,
        ...reqParamData,
      },
    };

    const areParamsEqual = isEqual(updatedParams, reqData);

    if (!areParamsEqual) {
      dispatch(setFilterListParams(cloneDeep(updatedParams)));
    }

    if (selectedFilter && !areParamsEqual) {
      dispatch(setBPMTaskLoader(true));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(
        fetchServiceTaskList(cloneDeep(updatedParams), null, activePage, limit)
      );
    } else if (filterCached) {
      dispatch(resetTaskListParams({ filterCached: false }));
      dispatch(
        fetchServiceTaskList(cloneDeep(updatedParams), null, activePage, limit)
      );
    }
  }, [
    selectedAttributeFilterId,
    searchParams,
    dispatch,
    dateRange,
    bpmFiltersList,
    bpmattributeFilterList,
    selectedFilter,
    sortParams,
    reqData,
    activePage,
    limit,
    filterCached,
  ]);

  // Refresh handler (same logic as useEffect)
  const handleRefresh = useCallback(() => {
    const activeKey = sortParams?.activeKey;

    const transformedSorting =
      activeKey && sortParams?.[activeKey]?.sortOrder
        ? [
            {
              sortBy: activeKey,
              sortOrder: sortParams[activeKey].sortOrder,
            },
          ]
        : [];

    const reqParamData = {
      ...searchParams,
      sorting: transformedSorting,
    };

    if (dateRange?.startDate && dateRange?.endDate) {
      reqParamData.createdAfter = HelperServices.getISODateTime(
        dateRange.startDate
      );
      reqParamData.createdBefore = HelperServices.getISODateTime(
        dateRange.endDate
      );
    }

    const selectedParams = bpmFiltersList.find(
      (item) => item.id === selectedFilterId
    );

    if (selectedParams) {
      const updatedParams = {
        ...selectedParams,
        criteria: {
          ...selectedParams.criteria,
          ...reqParamData,
        },
      };

      if (!isEqual(updatedParams, reqData)) {
        dispatch(setFilterListParams(cloneDeep(updatedParams)));
      }
    }

    const formattedReqData = {
      ...reqData,
      sorting: transformedSorting,
    };

    if (selectedFilter) {
      dispatch(setBPMTaskLoader(true));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(fetchServiceTaskList(formattedReqData, null, activePage, limit));
    }
  }, [
    dispatch,
    reqData,
    selectedFilter,
    activePage,
    limit,
    searchParams,
    bpmFiltersList,
    dateRange,
    selectedFilterId,
    sortParams,
  ]);

  // Handle column resize
  const handleColumnResize = useCallback(
    (column: Column, newWidth: number) => {
      // Update the selected filter with the new width
      const updatedData = cloneDeep(selectedFilter);
      const variables = updatedData.variables.map((variable: any) => {
        if (variable.name === column.sortKey) {
          return { ...variable, width: newWidth };
        }
        return variable;
      });

      // Update the filter with the new width
      updateFilter({ variables }, selectedFilterId);
    },
    [selectedFilter, selectedFilterId]
  );

  // Sorting modal handlers
  const handleSortModalClose = useCallback(() => {
    setShowSortModal(false);
  }, []);

  const handleFilterIconClick = useCallback(() => {
    setShowSortModal(true);
  }, []);

  // Pagination and limit change handlers
  const handleLimitChange = useCallback(
    (newLimit) => {
      dispatch(setBPMTaskLoader(true));
      dispatch(setTaskListLimit(newLimit));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(fetchServiceTaskList(reqData, null, 1, newLimit));
    },
    [dispatch, reqData]
  );

  const handlePageChange = useCallback(
    (pageNumber) => {
      dispatch(setBPMTaskListActivePage(pageNumber));
      dispatch(setBPMTaskLoader(true));
      dispatch(fetchServiceTaskList(reqData, null, pageNumber, limit));
    },
    [dispatch, limit, reqData]
  );

  const handleCheckBoxChange = () => {
    setIsAssigned(!isAssigned);
  };

  const onLabelClick = () => {
    handleCheckBoxChange();
  };

  // Render header cell for ReusableResizableTable
  const renderHeaderCell = useCallback(
    (
      column: Column,
      index: number,
      columnsLength: number,
      currentResizingColumn: any,
      handleMouseDown: (index: number, column: any, e: React.MouseEvent) => void
    ) => {
      const isSortable = ["name", "created", "assignee"].includes(
        column.sortKey
      );

      return (
        <th
          key={`header-${column.sortKey ?? index}`}
          className="resizable-column"
          style={{ width: column.width }}
          data-testid={`column-header-${column.sortKey ?? "actions"}`}
          aria-label={`${t(column.name)} ${t("column")}${
            isSortable ? ", " + t("sortable") : ""
          }`}
        >
          {isSortable ? (
            <SortableHeader
              columnKey={column.sortKey}
              title={t(column.name)}
              currentSort={sortParams}
              handleSort={handleSort}
              className="w-100 d-flex justify-content-between align-items-center"
              dataTestId={`sort-header-${column.sortKey}`}
              ariaLabel={t("Sort by {{columnName}}", {
                columnName: t(column.name),
              })}
            />
          ) : (
            t(column.name)
          )}
          {column.resizable && index < columnsLength - 1 && (
            <div
              className={`column-resizer ${
                currentResizingColumn?.sortKey === column.sortKey
                  ? "resizing"
                  : ""
              }`}
              onMouseDown={(e) => handleMouseDown(index, column, e)}
              data-testid={`column-resizer-${column.sortKey}`}
              aria-label={t("Resize {{columnName}} column", {
                columnName: t(column.name),
              })}
            />
          )}
        </th>
      );
    },
    [t, sortParams, handleSort]
  );

  // Render row for ReusableResizableTable
  const renderRow = useCallback(
    (task: Task, columns: Column[], rowIndex: number) => {
      return (
        <tr
          key={`row-${task.id}`}
          data-testid={`task-row-${task.id}`}
          aria-label={t("Task row for task {{taskName}}", {
            taskName: task.name ?? t("unnamed"),
          })}
        >
          {columns.map((column, colIndex) => {
            if (column.sortKey === "actions") {
              return (
                <td key={`action-${task.id}-${colIndex}`}>
                  <CustomButton
                    size="table-sm"
                    variant="secondary"
                    label={t("View")}
                    onClick={() =>
                      history.push(`${redirectUrl.current}review/${task?.id}`)
                    }
                    dataTestId={`view-task-${task.id}`}
                    ariaLabel={t("View details for task {{taskName}}", {
                      taskName: task?.name ?? t("unnamed"),
                    })}
                  />
                </td>
              );
            }

            return (
              <td
                key={`cell-${task.id}-${column.sortKey}`}
                data-testid={`task-${task.id}-${column.sortKey}`}
                aria-label={`${t(column.name)}: ${getCellValue(
                  column,
                  task,
                  limit,
                  RETRY_DELAY_TIME,
                  reqData,
                  activePage,
                  dispatch,
                  userData,
                  userList
                )}`}
              >
                {getCellValue(
                  column,
                  task,
                  limit,
                  RETRY_DELAY_TIME,
                  reqData,
                  activePage,
                  dispatch,
                  userData,
                  userList
                )}
              </td>
            );
          })}
        </tr>
      );
    },
    [
      t,
      history,
      redirectUrl,
      limit,
      RETRY_DELAY_TIME,
      reqData,
      activePage,
      dispatch,
      userData,
      userList,
    ]
  );

  const renderTaskList = () => {
    if (!selectedFilter) {
      return (
        <div
          data-testid="no-filter-selected"
          aria-label={t("No filter selected message")}
        >
          {t("No filter selected.")}
        </div>
      );
    }

    if (columns.length === 0) {
      return (
        <div
          className="container-wrapper"
          data-testid="no-columns-message"
          aria-label={t("No columns message")}
        >
          <div className="table-outer-container">
            <div className="table-scroll-wrapper">
              <table className="resizable-table">
                <thead className="visually-hidden">
                  <tr className="no-hover">
                    <th scope="col">{t("Message")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="empty-table-message"
                      data-testid="empty-columns-message"
                    >
                      {t(
                        "No tasks have been found. Try a different filter combination or contact your admin."
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="container-wrapper"
        data-testid="table-container-wrapper"
        aria-label={t("Task table container")}
      >
        <div
          className="table-outer-container"
          data-testid="table-outer-container"
          aria-label={t("Table outer container")}
        >
          <div
            className="table-scroll-wrapper resizable-scroll"
            ref={scrollWrapperRef}
            data-testid="table-scroll-wrapper"
            aria-label={t("Scrollable task table content")}
          >
            <div
              className="resizable-table-container"
              data-testid="inner-table-container"
              aria-label={t("Inner table container")}
            >
              <ReusableResizableTable
                columns={columns}
                data={taskList}
                renderRow={renderRow}
                renderHeaderCell={renderHeaderCell}
                emptyMessage={t(
                  "No tasks have been found. Try a different filter combination or contact your admin."
                )}
                onColumnResize={handleColumnResize}
                tableClassName="resizable-table"
                headerClassName="resizable-header"
                containerClassName="resizable-table-container"
                scrollWrapperClassName="table-scroll-wrapper resizable-scroll"
                dataTestId="task-resizable-table"
                ariaLabel={t("Tasks data table with resizable columns")}
              />
            </div>
          </div>
        </div>

        <table
          className="custom-tables"
          data-testid="table-footer-container"
          aria-label={t("Table footer container")}
        >
          <tfoot>
            {tasksCount > 0 && taskList?.length > 0 && (
              <TableFooter
                limit={limit}
                activePage={activePage}
                totalCount={tasksCount}
                handlePageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                pageOptions={[
                  { text: "5", value: 5 },
                  { text: "25", value: 25 },
                  { text: "50", value: 50 },
                  { text: "100", value: 100 },
                  { text: "All", value: tasksCount },
                ]}
                dataTestId="task-table-footer"
                ariaLabel={t("Table pagination controls")}
                pageSizeDataTestId="task-page-size-selector"
                pageSizeAriaLabel={t("Select number of tasks per page")}
                paginationDataTestId="task-pagination-controls"
                paginationAriaLabel={t("Navigate between task pages")}
              />
            )}
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div
      className="container-fluid py-4"
      data-testid="resizable-table-container"
      aria-label={t("Resizable tasks table container")}
    >
      <div className="row w-100 mb-3 g-2">
        {/* Left Filters - Stack on small, inline on md+ */}
        <div className="col-12 col-md d-flex flex-wrap gap-3 align-items-center">
          <div className="mb-2">
            <ButtonDropdown
              label={
                <span
                  className="filter-large"
                  title={
                    selectedFilter?.name
                      ? `${t(selectedFilter.name)} (${tasksCount ?? 0})`
                      : t("Select Filter")
                  }
                >
                  {selectedFilter?.name
                    ? `${t(selectedFilter.name)} (${tasksCount ?? 0})`
                    : t("Select Filter")}
                </span>
              }
              variant="primary"
              size="md"
              dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
              dropdownItems={filterDropdownItems}
              extraActionIcon={<PencilIcon color="white" />}
              extraActionOnClick={handleEditTaskFilter}
              dataTestId="business-filter-dropdown"
              ariaLabel={t("Select business filter")}
              extraActionAriaLabel={t("Edit selected filter")}
            />
          </div>

          <span className="text-muted">
            <AddIcon size="8" />
          </span>

          <div className="mb-2">
            <ButtonDropdown
              label={
                <span
                  className="filter-large"
                  title={
                    selectedAttributeFilter?.name
                      ? `${t(selectedAttributeFilter.name)}`
                      : t("Select  Attribute Filter")
                  }
                >
                  {selectedAttributeFilter?.name
                    ? `${t(selectedAttributeFilter.name)}`
                    : t("Select Attribute Filter")}
                </span>
              }
              variant="primary"
              size="md"
              dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
              dropdownItems={filterDropdownAttributeItems}
              extraActionIcon={<PencilIcon color="white" />}
              extraActionOnClick={handleEditAttrFilter}
              dataTestId="attribute-filter-dropdown"
              ariaLabel={t("Select attribute filter")}
              extraActionAriaLabel={t("Edit attribute filters")}
            />
          </div>

          <span className="text-muted">
            <AddIcon size="8" />
          </span>

          <div className="mb-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
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
              onClick={onLabelClick}
            >
              <input
                type="checkbox"
                className="form-check-input"
                checked={isAssigned}
                onChange={handleCheckBoxChange}
                data-testid="assign-to-me-checkbox"
              />
              <span className="custom-checkbox-label">{t("Assign to me")}</span>
            </button>
          </div>
        </div>

        {/* Right actions - Stack below on small */}
        <div className="col-12 col-md-auto d-flex justify-content-end button-align">
          <FilterSortActions
            showSortModal={showSortModal}
            handleFilterIconClick={handleFilterIconClick}
            handleRefresh={handleRefresh}
            handleSortModalClose={handleSortModalClose}
            handleSortApply={handleSortApply}
            defaultSortOption={sortParams?.activeKey}
            defaultSortOrder={
              sortParams?.[sortParams?.activeKey]?.sortOrder ?? "asc"
            }
            optionSortBy={optionSortBy}
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

        <TaskFilterModal
          show={showTaskFilterModal}
          onClose={handleToggleFilterModal}
          filter={filterToEdit}
          canEdit={canEditFilter}
        />
        <AttributeFilterModal
          show={showAttrFilterModal}
          onClose={handleToggleAttrFilterModal}
          taskAttributeData={taskAttributeData}
          filterParams={filterParams}
          setFilterParams={setFilterParams}
          selectedFilter={selectedFilter}
          attributeFilter={attrFilterToEdit}
        />
      </div>
      {isTaskListLoading ? <Loading /> : renderTaskList()}
    </div>
  );
}
