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
} from "../../actions/taskActions";

import TaskFilterModal from "../TaskFilterModal";
import { useHistory } from "react-router-dom";
import {
  fetchFilterList,
  fetchBPMTaskCount,
  fetchServiceTaskList,
} from "../../api/services/filterServices";
import { ALL_TASKS } from "../constants/taskConstants";

import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import Loading from "../Loading";
import { MULTITENANCY_ENABLED } from "../../constants";
import { StorageService, HelperServices } from "@formsflow/service";

// interface TableData {
//   submissionId: string;
//   task: string;
//   createdDate: string;
//   assignedTo: string;
//   submitterName: string;
// }

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
}

export function ResizableTable(): JSX.Element {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
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
  } = useSelector((state: any) => state.task || {});

  const selectedFilterId = selectedFilter?.id || null;
  const bpmFiltersList = filterList;
  const taskvariables = selectedFilter?.variables || [];
  const handleToggleFilterModal = () => {
    setShowTaskFilterModal((prevState) => !prevState);
  };
  const [columns, setColumns] = useState<Column[]>([]);

  const tableRef = useRef<HTMLTableElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const [showSortModal, setShowSortModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const optionSortBy = [
    // { value: "applicationId", label: t("Submission ID") },
    // { value: "submitterName", label: t("Submitter Name") },
    { value: "name", label: t("Task") },
    { value: "created", label: t("Created Date") },
    { value: "assignee", label: t("Assigned To") },
  ];

  const [filterToEdit, setFilterToEdit] = useState(null);
  const [canEditFilter, setCanEditFilter] = useState(false);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );

  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const isFilterCreator = userRoles.includes("createFilters");
  const isFilterAdmin = userRoles.includes("manageAllFilters");
  //const isFilterViewer = userRoles.includes("viewFilters");

  useEffect(() => {
    dispatch(setBPMFilterLoader(true));
    dispatch(
      fetchFilterList((err, data) => {
        if (data) {
          fetchBPMTaskCount(data.filters)
            .then((res) => {
              dispatch(setBPMFiltersAndCount(res.data));
            })
            .catch((err) => console.error(err))
            .finally(() => {
              dispatch(setBPMFilterLoader(false));
            });
        }
      })
    );
  }, [dispatch]);

  useEffect(() => {
    if (filterList?.length) {
      let filterSelected;
      if (filterList.length > 1) {
        filterSelected = filterList?.find(
          (filter) => filter.id === defaultFilter || filter.name === ALL_TASKS
        );
        if (!filterSelected) {
          filterSelected = filterList[0];
        }
      } else {
        filterSelected = filterList[0];
      }
      dispatch(setSelectedBPMFilter(filterSelected));
    }
  }, [filterList?.length]);

  useEffect(() => {
    if (taskvariables && Array.isArray(taskvariables)) {
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



  const handleSortApply = (selectedSortOption, selectedSortOrder) => {
    dispatch(
      setFilterListSortParams({
        ...sortParams,
        activeKey: selectedSortOption,
        [selectedSortOption]: { sortOrder: selectedSortOrder },
      })
    );
    setShowSortModal(false);
  };

  const handleSort = (key) => {
    const newSortOrder = sortParams[key].sortOrder === "asc" ? "desc" : "asc";
    const updatedSort = Object.keys(sortParams).reduce((acc, columnKey) => {
        acc[columnKey] = { sortOrder: columnKey === key ? newSortOrder : "asc" };
        return acc;
    }, {});

    dispatch(setFilterListSortParams({
        ...updatedSort,
        activeKey: key,
    }));
};
  const handleEditFilter = () => {
    if (!selectedFilter) return;
    const matchingFilter = filterList.find((f) => f.id === selectedFilter.id);
    const editPermission = matchingFilter?.editPermission;
    const isEditable = (isFilterCreator || isFilterAdmin) && editPermission;
    setFilterToEdit(matchingFilter);
    setCanEditFilter(isEditable);
    setShowTaskFilterModal(true);
  };

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
      onClick: () => {
        const filterToSet = filterList.find((f) => f.id === filter.id);
        if (filterToSet) {
          dispatch(setSelectedBPMFilter(filterToSet));
          dispatch({ type: "SET_BPM_TASK_LIST_ACTIVE_PAGE", payload: 1 });
        }
      },
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
        onClick: () => handleToggleFilterModal(),
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
  }, [filtersCount, filterList, dispatch]);

  useEffect(() => {
    const activeKey = sortParams?.activeKey;

    const transformedSorting = activeKey && sortParams?.[activeKey]?.sortOrder
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
        reqParamData.dueAfter = HelperServices.getISODateTime(dateRange.startDate);
        reqParamData.dueBefore = HelperServices.getISODateTime(dateRange.endDate);
      }
    let selectedParams = bpmFiltersList.find(
      (item) => item.id === selectedFilterId
    );

    if (selectedParams) {
      selectedParams = {
        ...selectedParams,
        criteria: {
          ...selectedParams.criteria,
          ...reqParamData,
        },
      };
    }

    if (!isEqual(selectedParams, reqData) && selectedParams) {
      dispatch(setFilterListParams(cloneDeep(selectedParams)));
    }


  }, [selectedFilterId, searchParams, sortParams, dispatch, reqData,dateRange]);



  useEffect(() => {
    if (selectedFilter) {
      dispatch(setBPMTaskLoader(true));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(fetchServiceTaskList(reqData, null, firstResult, limit));
    }
  }, [dispatch, reqData]);

  const handleRefresh = useCallback(() => {
    if (selectedFilter) {
      dispatch(setBPMTaskLoader(true));
      dispatch(setBPMTaskListActivePage(1));
      dispatch(fetchServiceTaskList(reqData, null, firstResult, limit));
    }
  }, [dispatch, reqData, selectedFilter, firstResult]);

  // Column resizing logic (updated to only resize specific columns)
  const handleMouseDown = (index: number, e: React.MouseEvent): void => {
    if (!columns[index].resizable) return;

    resizingRef.current = index;
    startXRef.current = e.pageX;
    startWidthRef.current = columns[index].width;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (resizingRef.current === null) return;

    const diff = e.pageX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + diff);

    setColumns((prev) =>
      prev.map((col, i) =>
        i === resizingRef.current ? { ...col, width: newWidth } : col
      )
    );
  };

  const handleMouseUp = (): void => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Sorting modal handlers
  const handleSortModalClose = () => {
    setShowSortModal(false);
  };

  const handleFilterIconClick = () => {
    setShowSortModal(true);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Pagination and limit change handlers
  const handleLimitChange = (limit) => {
    dispatch(setBPMTaskLoader(true));
    dispatch(setTaskListLimit(limit));
    dispatch(fetchServiceTaskList(reqData, null, firstResult, limit));
  };

  const handlePageChange = (pageNumber) => {
    dispatch(setBPMTaskListActivePage(pageNumber));
    dispatch(setBPMTaskLoader(true));
    let firstResultIndex = limit * pageNumber - limit;
    dispatch(fetchServiceTaskList(reqData, null, firstResultIndex, limit));
  };


  const renderTaskList = () => {
    if (selectedFilter) {
      return (
        <div
          className="container-wrapper"
          data-testid="table-container-wrapper"
        >
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
              {/* Table container */}
              <div
                className="resizable-table-container"
                data-testid="inner-table-container"
              >
                <table
                  ref={tableRef}
                  className="resizable-table"
                  data-testid="task-resizable-table"
                  aria-label="Tasks data table with resizable columns"
                >
                  <thead className="resizable-header">
                    <tr>
                      {columns.map((column, index) => {
                        const isSortableColumn =
                          column.sortKey === "name" ||
                          column.sortKey === "created" ||
                          column.sortKey === "assignee";

                        return (
                          <th
                            key={column.name}
                            className="resizable-column"
                            style={{ width: column.width }}
                            data-testid={`column-header-${
                              column.sortKey || "actions"
                            }`}
                            aria-label={`${column.name} column${
                              isSortableColumn ? ", sortable" : ""
                            }`}
                          >
                            {isSortableColumn ? (
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

                            {column.resizable && index < columns.length - 1 && (
                              <div
                                className={`column-resizer ${
                                  resizingRef.current === index
                                    ? "resizing"
                                    : ""
                                }`}
                                onMouseDown={(e) => handleMouseDown(index, e)}
                                data-testid={`column-resizer-${column.sortKey}`}
                                aria-label={`Resize ${column.name} column`}
                              />
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {taskList && taskList.length > 0 ? (
                      taskList.map((task, index) => {
                        //const taskVars = task?._embedded?.variable || [];

                        return (
                          <tr key={task.id} data-testid={`task-row-${index}`}>
                            {columns.map((column, colIndex) => {
                              let cellValue = "";

                              if (column.name === "Actions") {
                                return (
                                  <td key={colIndex}>
                                    <CustomButton
                                      className="btn-table"
                                      variant="secondary"
                                      label={"View"}
                                      onClick={() =>
                                        history.push(
                                          `${redirectUrl.current}review/${task?.id}`
                                        )
                                      }
                                      dataTestId={`view-task-${index}`}
                                      ariaLabel={`View details for task ${task?.name}`}
                                    />
                                  </td>
                                );
                              }

                              if (column.name === "Submission ID") {
                                cellValue =
                                  task?._embedded?.variable?.find(
                                    (v) => v.name === "applicationId"
                                  )?.value || "-";
                              } else if (column.sortKey === "name") {
                                cellValue = task?.name || "-";
                              } else if (column.sortKey === "created") {
                                cellValue = task?.created
                                  ? HelperServices.getLocaldate(task.created)
                                  : "N/A";
                              } else if (column.sortKey === "assignee") {
                                cellValue = task?.assignee || "Unassigned";
                              } else {
                                const matchVar =
                                  task?._embedded?.variable?.find(
                                    (v) => v.name === column.sortKey
                                  );
                                cellValue = matchVar?.value ?? "-";
                              }

                              return (
                                <td
                                  key={colIndex}
                                  data-testid={`task-${index}-${column.sortKey}`}
                                >
                                  {cellValue}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          style={{ textAlign: "center" }}
                        >
                          {t(
                            "No tasks have been found. Try a different filter combination or contact your admin."
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <table className="custom-tables" data-testid="table-footer-container">
            <tfoot>
              {tasksCount > 0 ? (
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
              ) : null}
            </tfoot>
          </table>
        </div>
      );
    } else {
      return <div>{t("No filter selected.")}</div>;
    }
  };
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
                      ? `${selectedFilter.name} (${tasksCount || 0})`
                      : "Select Filter"
                  }
                >
                  {selectedFilter?.name
                    ? `${selectedFilter.name} (${tasksCount || 0})`
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
            <ButtonDropdown label="Form Fields" />
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
            defaultSortOrder={sortParams?.[sortParams?.activeKey]?.sortOrder || "asc"}
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
      </div>
      {isTaskListLoading ? <Loading /> : renderTaskList()}
    </div>
  );
}
