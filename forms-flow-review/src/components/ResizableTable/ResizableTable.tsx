import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  TableFooter,
  SortableHeader,
  FilterSortActions,
  CustomButton,
  DateRangePicker,
  ButtonDropdown,
  AddIcon,
  PencilIcon,
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
  setSelectedTaskID,
} from "../../actions/taskActions";

import TaskFilterModal from "../TaskFilterModal";
import { useHistory } from "react-router-dom";
import {
  fetchFilterList,
  fetchBPMTaskCount,
  fetchServiceTaskList,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import { ALL_TASKS } from "../constants/taskConstants";

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

// Extracted table cell rendering component
const TaskTableCell = ({ task, column, index, redirectUrl, history }) => {
  if (column.name === "Actions") {
    return (
      <td key={`action-${task.id}-${index}`}>
        <CustomButton
          className="btn-table"
          variant="secondary"
          label="View"
          onClick={() =>
            history.push(`${redirectUrl.current}review/${task?.id}`)
          }
          dataTestId={`view-task-${task.id}`}
          ariaLabel={`View details for task ${task?.name ?? "unnamed"}`}
        />
      </td>
    );
  }

  const { sortKey } = column;
  const { name: taskName, created, assignee, _embedded } = task ?? {};
  const variables = _embedded?.variable ?? [];

  return (
    <td
      key={`cell-${task.id}-${sortKey}`}
      data-testid={`task-${task.id}-${column.sortKey}`}
    >
      {column.name === "Submission ID"
        ? variables.find((v) => v.name === "applicationId")?.value ?? "-"
        : sortKey === "name"
        ? taskName ?? "-"
        : sortKey === "created"
        ? created
          ? HelperServices.getLocaldate(created)
          : "N/A"
        : sortKey === "assignee"
        ? assignee ?? "Unassigned"
        : variables.find((v) => v.name === sortKey)?.value ?? "-"}
    </td>
  );
};

// Extracted table header component
const TableHeaderCell = ({
  column,
  index,
  columnsLength,
  resizingIndex,
  sortParams,
  handleSort,
  handleMouseDown,
}) => {
  const isSortable = ["name", "created", "assignee"].includes(column.sortKey);

  return (
    <th
      key={`header-${column.sortKey ?? index}`}
      className="resizable-column"
      style={{ width: column.width }}
      data-testid={`column-header-${column.sortKey ?? "actions"}`}
      aria-label={`${column.name} column${isSortable ? ", sortable" : ""}`}
    >
      {isSortable ? (
        <SortableHeader
          columnKey={column.sortKey}
          title={column.name}
          currentSort={sortParams}
          handleSort={handleSort}
          className="w-100 d-flex justify-content-between align-items-center"
        />
      ) : (
        column.name
      )}
      {column.resizable && index < columnsLength - 1 && (
        <div
          className={`column-resizer ${
            resizingIndex === index ? "resizing" : ""
          }`}
          onMouseDown={(e) => handleMouseDown(index, e)}
          data-testid={`column-resizer-${column.sortKey}`}
          aria-label={`Resize ${column.name} column`}
        />
      )}
    </th>
  );
};

// Extracted task row component
const TaskRow = ({ task, columns, redirectUrl, history }) => {
  return (
    <tr key={`row-${task.id}`} data-testid={`task-row-${task.id}`}>
      {columns.map((column, colIndex) => (
        <TaskTableCell
          key={`cell-${task.id}-${column.sortKey ?? colIndex}`}
          task={task}
          column={column}
          index={colIndex}
          redirectUrl={redirectUrl}
          history={history}
        />
      ))}
    </tr>
  );
};

// Extracted table component
const TaskTable = ({
  columns,
  taskList,
  tasksCount,
  t,
  sortParams,
  handleSort,
  resizingRef,
  handleMouseDown,
  tableRef,
  redirectUrl,
  history,
}) => {
  if (taskList?.length === 0) {
    return (
      <table
        ref={tableRef}
        className="resizable-table"
        data-testid="task-resizable-table"
        aria-label="Tasks data table with resizable columns"
      >
        <thead className="resizable-header">
          <tr>
            {columns.map((column, index) => (
              <TableHeaderCell
                key={`header-${column.sortKey ?? index}`}
                column={column}
                index={index}
                columnsLength={columns.length}
                resizingIndex={resizingRef.current}
                sortParams={sortParams}
                handleSort={handleSort}
                handleMouseDown={handleMouseDown}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center" }}>
              {t(
                "No tasks have been found. Try a different filter combination or contact your admin."
              )}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table
      ref={tableRef}
      className="resizable-table"
      data-testid="task-resizable-table"
      aria-label="Tasks data table with resizable columns"
    >
      <thead className="resizable-header">
        <tr>
          {columns.map((column, index) => (
            <TableHeaderCell
              key={`header-${column.sortKey ?? index}`}
              column={column}
              index={index}
              columnsLength={columns.length}
              resizingIndex={resizingRef.current}
              sortParams={sortParams}
              handleSort={handleSort}
              handleMouseDown={handleMouseDown}
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {taskList.map((task) => (
          <TaskRow
            key={`row-${task.id}`}
            task={task}
            columns={columns}
            redirectUrl={redirectUrl}
            history={history}
          />
        ))}
      </tbody>
    </table>
  );
};

export function ResizableTable(): JSX.Element {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showAttrFilterModal, setShowAttrFilterModal] = useState(false);
  const [taskAttributeData, setTaskAttributeData] = useState([]);
  const [filterParams, setFilterParams] = useState({});
  const history = useHistory();
  const {
    filterList = [],
    selectedFilter = null,
    taskId: bpmTaskId = null,
    firstResult = 0,
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
  } = useSelector((state: any) => state.task ?? {});

  const selectedFilterId = selectedFilter?.id ?? null;
  const bpmFiltersList = filterList;
  const taskvariables = selectedFilter?.variables ?? [];

  const handleToggleFilterModal = useCallback(() => {
    setShowTaskFilterModal((prevState) => !prevState);
  }, []);

  const handleToggleAttrFilterModal = useCallback(() => {
    setShowAttrFilterModal((prevState) => !prevState);
  }, []);

  const [columns, setColumns] = useState<Column[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
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
  const [canEditFilter, setCanEditFilter] = useState(false);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );

  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
  );
  const isFilterCreator = userRoles.includes("createFilters");
  const isFilterAdmin = userRoles.includes("manageAllFilters");

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
  }, [dispatch]);

  useEffect(() => {
    if (filterList.length > 0) {
      const filterSelected =
        filterList.find(
          (filter) => filter.id === defaultFilter || filter.name === ALL_TASKS
        ) ?? filterList[0];

      dispatch(setSelectedBPMFilter(filterSelected));
    }
  }, [filterList.length, defaultFilter, dispatch]);

  useEffect(() => {
    if (Array.isArray(taskvariables)) {
      const dynamicColumns = taskvariables
        .filter((variable) => variable.isChecked)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((variable) => ({
          name: variable.label,
          width: 200,
          sortKey: variable.name,
          resizable: true,
        }));

      if (dynamicColumns.length > 0) {
        dynamicColumns.push({
          name: "Actions",
          width: 100,
          sortKey: "",
          resizable: false,
        });
      }

      setColumns(dynamicColumns);
    }
  }, [taskvariables]);

  const handleSortApply = useCallback(
    (selectedSortOption, selectedSortOrder) => {
      dispatch(
        setFilterListSortParams({
          ...sortParams,
          activeKey: selectedSortOption,
          [selectedSortOption]: { sortOrder: selectedSortOrder },
        })
      );
      setShowSortModal(false);
    },
    [dispatch, sortParams]
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

  const handleEditFilter = useCallback(() => {
    if (!selectedFilter) return;
    const matchingFilter = filterList.find((f) => f.id === selectedFilter.id);
    if (!matchingFilter) return;

    const editPermission = matchingFilter?.editPermission;
    const isEditable = (isFilterCreator || isFilterAdmin) && editPermission;
    setFilterToEdit(matchingFilter);
    setCanEditFilter(isEditable);
    setShowTaskFilterModal(true);
  }, [selectedFilter, filterList, isFilterCreator, isFilterAdmin]);

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
      ariaLabel: `${t("Select filter")} ${t(filter.name)}`,
    }));

    const extraItems = [
      {
        content: (
          <span>
            <span>
              <AddIcon />
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
              <PencilIcon />
            </span>{" "}
            {t("Re-order And Hide Filters")}
          </span>
        ),
        onClick: () => console.log("Re-order clicked"),
        type: "reorder",
        dataTestId: "filter-item-reorder",
        ariaLabel: t("Re-order And Hide Filters"),
      },
    ];

    return [...mappedItems, ...extraItems];
  }, [filtersCount, filterList, dispatch, t, handleToggleFilterModal]);

  const filterDropdownAttributeItems = useMemo(() => {
    const extraItems = [
      {
        content: (
          <span>
            <span>
              <AddIcon />
            </span>{" "}
            {t("Custom Filter")}
          </span>
        ),
        onClick: handleToggleAttrFilterModal,
        type: "custom",
        dataTestId: "filter-item-custom",
        ariaLabel: t("Custom Filter"),
      },
      {
        content: (
          <span>
            <span>
              <PencilIcon />
            </span>{" "}
            {t("Re-order And Hide Filters")}
          </span>
        ),
        onClick: () => console.log("Re-order clicked"),
        type: "reorder",
        dataTestId: "filter-item-reorder",
        ariaLabel: t("Re-order And Hide Filters"),
      },
    ];

    return [...extraItems];
  }, [t, handleToggleAttrFilterModal]);

  useEffect(() => {
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

    const updatedParams = {
      ...selectedParams,
      criteria: {
        ...selectedParams.criteria,
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
        fetchServiceTaskList(cloneDeep(updatedParams), null, firstResult, limit)
      );
    }
  }, [
    selectedFilterId,
    searchParams,
    dispatch,
    dateRange,
    bpmFiltersList,
    selectedFilter,
    sortParams,
    firstResult,
    limit,
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
      dispatch(
        fetchServiceTaskList(formattedReqData, null, firstResult, limit)
      );
    }
  }, [
    dispatch,
    reqData,
    selectedFilter,
    firstResult,
    limit,
    searchParams,
    bpmFiltersList,
    dateRange,
    selectedFilterId,
  ]);

  // Column resizing logic (updated to only resize specific columns)
  const handleMouseDown = useCallback(
    (index: number, e: React.MouseEvent): void => {
      if (!columns[index].resizable) return;

      resizingRef.current = index;
      startXRef.current = e.pageX;
      startWidthRef.current = columns[index].width;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columns]
  );

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    if (resizingRef.current === null) return;

    const diff = e.pageX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + diff);

    setColumns((prev) =>
      prev.map((col, i) =>
        i === resizingRef.current ? { ...col, width: newWidth } : col
      )
    );
  }, []);

  const handleMouseUp = useCallback((): void => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  // Sorting modal handlers
  const handleSortModalClose = useCallback(() => {
    setShowSortModal(false);
  }, []);

  const handleFilterIconClick = useCallback(() => {
    setShowSortModal(true);
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Pagination and limit change handlers
  const handleLimitChange = useCallback(
    (newLimit) => {
      dispatch(setBPMTaskLoader(true));
      dispatch(setTaskListLimit(newLimit));
      dispatch(fetchServiceTaskList(reqData, null, firstResult, newLimit));
    },
    [dispatch, reqData, firstResult]
  );

  const handlePageChange = useCallback(
    (pageNumber) => {
      dispatch(setBPMTaskListActivePage(pageNumber));
      dispatch(setBPMTaskLoader(true));
      const firstResultIndex = limit * pageNumber - limit;
      dispatch(fetchServiceTaskList(reqData, null, firstResultIndex, limit));
    },
    [dispatch, limit, reqData]
  );

  const changeFilterSelection = useCallback(
    (filter) => {
      const selectedFilter = filterList.find((item) => item.id === filter.id);
      if (!selectedFilter) return;

      const taskAttributes = selectedFilter.variables.filter(
        (variable) => variable.isChecked === true
      );
      setTaskAttributeData(taskAttributes);
      dispatch(setSelectedBPMFilter(selectedFilter));

      const defaultFilterId =
        selectedFilter.id === defaultFilter ? null : selectedFilter.id;
      updateDefaultFilter(defaultFilterId)
        .then((updateRes) =>
          dispatch(setDefaultFilter(updateRes.data.defaultFilter))
        )
        .catch((error) =>
          console.error("Error updating default filter:", error)
        );

      dispatch(setSelectedTaskID(defaultFilterId));
      dispatch(setBPMTaskListActivePage(1));
    },
    [dispatch, defaultFilter, filterList]
  );

  const renderTaskList = useCallback(() => {
    if (!selectedFilter) {
      return <div>{t("No filter selected.")}</div>;
    }

    return (
      <div className="container-wrapper" data-testid="table-container-wrapper">
        <div
          className="table-outer-container"
          data-testid="table-outer-container"
        >
          <div
            className="table-scroll-wrapper resizable-scroll"
            ref={scrollWrapperRef}
            data-testid="table-scroll-wrapper"
            aria-label="Scrollable task table content"
          >
            <div
              className="resizable-table-container"
              data-testid="inner-table-container"
            >
              <TaskTable
                columns={columns}
                taskList={taskList}
                tasksCount={tasksCount}
                t={t}
                sortParams={sortParams}
                handleSort={handleSort}
                resizingRef={resizingRef}
                handleMouseDown={handleMouseDown}
                tableRef={tableRef}
                redirectUrl={redirectUrl}
                history={history}
              />
            </div>
          </div>
        </div>

        <table className="custom-tables" data-testid="table-footer-container">
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
                ariaLabel="Table pagination controls"
                pageSizeDataTestId="task-page-size-selector"
                pageSizeAriaLabel="Select number of tasks per page"
                paginationDataTestId="task-pagination-controls"
                paginationAriaLabel="Navigate between task pages"
              />
            )}
          </tfoot>
        </table>
      </div>
    );
  }, [
    selectedFilter,
    t,
    columns,
    sortParams,
    handleSort,
    taskList,
    tasksCount,
    limit,
    activePage,
    handlePageChange,
    handleLimitChange,
    history,
    redirectUrl,
    handleMouseDown,
    scrollWrapperRef,
    tableRef,
    resizingRef,
  ]);

  return (
    <div
      className="container-fluid py-4"
      data-testid="resizable-table-container"
      aria-label="Resizable tasks table container"
    >
      <div className="row w-100 mb-3 g-2">
        {/* Left Filters - Stack on small, inline on md+ */}
        <div className="col-12 col-md d-flex flex-wrap align-items-center">
          <div className="me-2 mb-2">
            <ButtonDropdown
              label={
                <span
                  className="filter-large"
                  title={
                    selectedFilter?.name
                      ? `${selectedFilter.name} (${tasksCount ?? 0})`
                      : "Select Filter"
                  }
                >
                  {selectedFilter?.name
                    ? `${selectedFilter.name} (${tasksCount ?? 0})`
                    : "Select Filter"}
                </span>
              }
              variant="primary"
              size="md"
              dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
              dropdownItems={filterDropdownItems}
              extraActionIcon={<PencilIcon color="white" />}
              extraActionOnClick={handleEditFilter}
              dataTestId="business-filter-dropdown"
              ariaLabel="Select business filter"
            />
          </div>

          <span className="text-muted me-2">
            <AddIcon size="8" />
          </span>

          <div className="me-2 mb-2">
            <ButtonDropdown
              label="Attribute Filter"
              variant="primary"
              size="md"
              dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
              dropdownItems={filterDropdownAttributeItems}
              extraActionIcon={<PencilIcon color="white" />}
              dataTestId="business-filter-dropdown"
              ariaLabel="Select business filter"
            />
          </div>

          <span className="text-muted me-2">
            <AddIcon size="8" />
          </span>

          <div className="me-2 mb-2">
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter Dates"
            />
          </div>

          <span className="text-muted me-2">
            <AddIcon size="8" />
          </span>

          <div className="mb-2">
            <CustomButton
              variant="secondary"
              size="md"
              label="Filter Created Date"
              onClick={handleToggleFilterModal}
              dataTestId="open-create-filter-modal"
              ariaLabel="Toggle Create Filter Modal"
            />
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
            filterAriaLabel="Filter the task list"
            refreshDataTestId="task-list-refresh"
            refreshAriaLabel="Refresh the task list"
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
        />
      </div>
      {isTaskListLoading ? <Loading /> : renderTaskList()}
    </div>
  );
}
