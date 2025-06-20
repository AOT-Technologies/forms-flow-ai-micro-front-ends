import {
  CustomButton,
  ReusableResizableTable,
  SortableHeader,
  TableFooter,
} from "@formsflow/components";
import { HelperServices } from "@formsflow/service";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import { isEqual, cloneDeep } from "lodash";
import {
  resetTaskListParams,
  setBPMTaskListActivePage,
  setFilterListSortParams,
  setTaskListLimit,
} from "../../actions/taskActions";
import { MULTITENANCY_ENABLED } from "../../constants";
import { useHistory, useParams } from "react-router-dom";
import {
  fetchServiceTaskList, 
} from "../../api/services/filterServices";
import TaskAssigneeManager from "../Assigne/Assigne";
import { buildDynamicColumns, optionSortBy } from "../../helper/tableHelper";
import { createReqPayload } from "../../helper/taskHelper";
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
    candidateGroups?: Array<{ groupId: string }>;
  };
}

const getCellValue = (column: Column, task: Task) => {
  const { sortKey } = column;
  const { name: taskName, created, _embedded } = task ?? {};
  const variables = _embedded?.variable ?? [];
  const candidateGroups = _embedded?.candidateGroups ?? [];

  if (column.sortKey === "applicationId") {
    return variables.find((v) => v.name === "applicationId")?.value ?? "-";
  }



  switch (sortKey) {
    case "name":
      return taskName ?? "-";
    case "created":
      return created ? HelperServices.getLocaldate(created) : "N/A";
    case "assignee":
      return <TaskAssigneeManager task={task} />;
     case "roles": {
    return candidateGroups.length > 0 ? candidateGroups[0]?.groupId ?? "-" : "-";
  }
    default:
      return variables.find((v) => v.name === sortKey)?.value ?? "-";
  }
};

const TaskListTable = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const {
    tasksCount,
    selectedFilter,
    tasksList,
    activePage,
    limit,
    dateRange,
    selectedAttributeFilter,
    filterListSortParams,
    isAssigned
  } = useSelector((state: any) => state.task);
  const { tenantId } = useParams();
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId || state.tenants?.tenantKey || tenantId);
  const isTaskListLoading = useSelector((state: any) => state.task.isTaskListLoading);

  const taskvariables = selectedFilter?.variables ?? []; 
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );
  const [columns, setColumns] = useState([]);
  // Constants
  const SORTABLE_COLUMNS = optionSortBy.keys;

  const PAGE_SIZE_OPTIONS = [
    { text: "5", value: 5 },
    { text: "25", value: 25 },
    { text: "50", value: 50 },
    { text: "100", value: 100 },
    { text: "All", value: tasksCount },
  ];

  // checking is column is sortable
  const isSortableColumn = (columnKey) => SORTABLE_COLUMNS.includes(columnKey);
 

  const handleColumnResize = (column: Column, newWidth: number) => {
    /**
     * this function handle column resize
     * It updates the width of the column in the selected filter's variables
     * and dispatches the updated filter to the store.
     */
    const updatedData = cloneDeep(selectedFilter);
    const variables = updatedData.variables.map((variable: any) => {
      if (variable.name === column.sortKey) {
        return { ...variable, width: newWidth };
      }
      return variable;
    });
    dispatch(resetTaskListParams({selectedFilter:{ ...updatedData, variables },isUnsavedFilter: true}));

  };

  useEffect(() => {
    const dynamicColumns = buildDynamicColumns(taskvariables);
    // Only update if columns are different
    setColumns((prevColumns) => {
      if (!isEqual(prevColumns, dynamicColumns)) {
        return dynamicColumns;
      }
      return prevColumns;
    });
  }, [taskvariables]);

  const getCellAriaLabel = (column, task) => {
    const columnName = t(column.name);
    const cellValue = getCellValue(column, task);
    return `${columnName}: ${cellValue}`;
  };

  // Render Functions
  const renderHeaderCell = (
    column,
    index,
    columnsLength,
    currentResizingColumn,
    handleMouseDown
  ) => {
    const isSortable = isSortableColumn(column.sortKey);
    const isResizable = column.resizable && index < columnsLength - 1;
    const isResizing = currentResizingColumn?.sortKey === column.sortKey;

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
        {renderHeaderContent(column, isSortable)}
        {isResizable &&
          renderColumnResizer(column, isResizing, handleMouseDown, index)}
      </th>
    );
  };
  const handleSort = (key) => {
    const resetSortOrders = HelperServices.getResetSortOrders(
      optionSortBy.options
    );
    const updatedFilterListSortParams = {
      ...resetSortOrders,
      [key]: {
        sortOrder:
          filterListSortParams[key]?.sortOrder === "asc" ? "desc" : "asc",
      },
      activeKey: key,
    };

    dispatch(setFilterListSortParams(updatedFilterListSortParams));
    const payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      updatedFilterListSortParams,
      dateRange,
      isAssigned
    );
    dispatch(fetchServiceTaskList(payload, null, activePage, limit));
  };

  const renderHeaderContent = (column, isSortable) => {
    if (!isSortable) {
      return t(column.name);
    }
    return (
      <SortableHeader
        columnKey={column.sortKey}
        title={t(column.name)}
        currentSort={filterListSortParams}
        handleSort={() => handleSort(column.sortKey)}
        className="w-100 d-flex justify-content-between align-items-center"
        dataTestId={`sort-header-${column.sortKey}`}
        ariaLabel={t("Sort by {{columnName}}", {
          columnName: t(column.name),
        })}
      />
    );
  };

  const renderColumnResizer = (column, isResizing, handleMouseDown, index) => (
    <div
      className={`column-resizer ${isResizing ? "resizing" : ""}`}
      onMouseDown={(e) => handleMouseDown(index, column, e)}
      data-testid={`column-resizer-${column.sortKey}`}
      aria-label={t("Resize {{columnName}} column", {
        columnName: t(column.name),
      })}
    />
  );

  const renderRow = (task, columns) => (
    <tr
      key={`row-${task.id}`}
      data-testid={`task-row-${task.id}`}
      aria-label={t("Task row for task {{taskName}}", {
        taskName: task.name ?? t("unnamed"),
      })}
    >
      {columns.map((column, colIndex) => renderCell(task, column, colIndex))}
    </tr>
  );

  const renderCell = (task, column, colIndex) => {
    if (column.sortKey === "actions") {
      return renderActionCell(task, colIndex);
    }
    return renderDataCell(task, column,colIndex);
  };

  const renderActionCell = (task, colIndex) => (
    <td key={`action-${task.id}-${colIndex}`}>
      <CustomButton
        size="table-sm"
        variant="secondary"
        label={t("View")}
        onClick={() => history.push(`${redirectUrl.current}review/${task.id}`)}
        dataTestId={`view-task-${task.id}`}
        ariaLabel={t("View details for task {{taskName}}", {
          taskName: task.name ?? t("unnamed"),
        })}
      />
    </td>
  );

  const renderDataCell = (task, column, colIndex) => (
    <td
      key={`cell-${task.id}-${column.sortKey}-${colIndex}`}
      data-testid={`task-${task.id}-${column.sortKey}`}
      aria-label={getCellAriaLabel(column, task)}
    >
      <div
        className={`${column.sortKey !== "assignee" ? "customizable_td_row" : ""} `}
        style={{
          WebkitLineClamp: selectedFilter?.properties?.displayLinesCount ?? 1, //here displayLines count is not there we will show 1 lines of content
        }}
      >
        {getCellValue(column, task)}
      </div>
    </td>
  );


  const renderEmptyTable = () => (
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

  /* --------------- this is handling the page change and limit --------------- */
  const handlePageChange = (page) => dispatch(setBPMTaskListActivePage(page));
  const handleLimitChange = (newLimit) => {
    batch(() => {
      const calculateNextValue = activePage * newLimit - newLimit;
      if (calculateNextValue > tasksCount)
        dispatch(setBPMTaskListActivePage(1));
      dispatch(setTaskListLimit(newLimit));
    });
  };

  /* ----------------------------------- --- ---------------------------------- */
  const renderTableContainer = () => (
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
        <ReusableResizableTable 
              columns={columns}
              data={tasksList}
              renderRow={renderRow}
              renderHeaderCell={renderHeaderCell}
              emptyMessage={t(
                "No tasks have been found. Try a different filter combination or contact your admin."
              )}
              onColumnResize={handleColumnResize}
              loading={isTaskListLoading}
              tableClassName="resizable-table"
              headerClassName="resizable-header"
              containerClassName="resizable-table-container"
              scrollWrapperClassName="table-scroll-wrapper resizable-scroll"
              dataTestId="task-resizable-table"
              ariaLabel={t("Tasks data table with resizable columns")}
            />
      </div>
      {renderTableFooter()}
    </div>
  );

  const renderTableFooter = () => (
    <table
      className="custom-tables"
      data-testid="table-footer-container"
      aria-label={t("Table footer container")}
    >
      <tfoot>
        {tasksCount > 0 && tasksList?.length > 0 && (
          <TableFooter
            limit={limit}
            activePage={activePage}
            totalCount={tasksCount}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageOptions={PAGE_SIZE_OPTIONS}
            dataTestId="task-table-footer"
            ariaLabel={t("Table pagination controls")}
            pageSizeDataTestId="task-page-size-selector"
            pageSizeAriaLabel={t("Select number of tasks per page")}
            paginationDataTestId="task-pagination-controls"
            paginationAriaLabel={t("Navigate between task pages")}
            loader={isTaskListLoading}
          />
        )}
      </tfoot>
    </table>
  );



  if (columns.length === 0) {
    return renderEmptyTable();
  }

  return renderTableContainer();
};

export default TaskListTable;
