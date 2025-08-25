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
  setBPMTaskLoader,
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
import Loading from "../Loading/Loading";
interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number;
  isFormVariable?:boolean;
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
  //checking isFormVariable to avoid the inappropriate value setting when static and dynamic varibales are same
  if(!column.isFormVariable){
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
    }
  }
  //if the variable is dynamic
  return variables.find((v) => v.name === sortKey)?.value ?? "-";

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
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId || state.tenants?.tenantData
?.key || tenantId);
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

  /**
   * checking is column is sortable 
   * passing isFormVariable to avoid sorting of dynamic variables
  **/
  const isSortableColumn = (columnKey, isFormVariable) => !isFormVariable && SORTABLE_COLUMNS.includes(columnKey);


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
    dispatch(resetTaskListParams({selectedFilter:{ ...updatedData, variables }}));

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

  const sortableList = new Set(
      [
      "phoneNumber",
      "checkbox",
      "currency",
      "radio",
      "datetime",
      "select",
      "selectboxes",
      "time",
      "url",
      "day",
      "textfield",
      "number",
      "textarea",
      "address",
      "password",
      "email",
      "tags" 
    ] 
  )
  // Render Functions
  const renderHeaderCell = (
    column,
    index,
    columnsLength,
    currentResizingColumn,
    handleMouseDown
  ) => {
    const isResizable = column.resizable && index < columnsLength - 1;
    const isResizing = currentResizingColumn?.sortKey === column.sortKey;
    const isSortableHeader =["actions", "roles"].includes(column.sortKey) || !column.type ||  !sortableList.has(column.type);

    return (
      <>
        {column.name ? (
          <th
            key={`header-${column.sortKey ?? index}`}
            className={!isSortableHeader? "header-sortable" : ""}
            style={{ 'minWidth': column.width, 'maxWidth': column.width }}
            data-testid={`column-header-${column.sortKey ?? "actions"}`}
          aria-label={`${t(column.name)} ${t("column")}${
            !isSortableHeader ? ", " + t("sortable") : ""
              }`}
          >
            {renderHeaderContent(column)}
            {isResizable &&
              renderColumnResizer(column, isResizing, handleMouseDown, index)}
          </th>
        ) : (
          <th
            key={`header-${column.sortKey ?? index}`}
            data-testid={`column-header-${column.sortKey ?? "actions"}`}
          aria-label={`${t(column.name)} ${t("column")}${
            !isSortableHeader ? ", " + t("sortable") : ""
              }`}
          >
            {renderHeaderContent(column)}
          </th>
        )}


      </>
    );
  };
  const handleSort = (column) => {
      dispatch(setBPMTaskLoader(true));
    const resetSortOrders = HelperServices.getResetSortOrders(
      optionSortBy.options
    );
    const enabledSort = new Set ([
      "applicationId",
      "submitterName",
      "formName"
    ])
    const updatedFilterListSortParams = {
      ...resetSortOrders,
      [column.sortKey]: {
        sortOrder:
          filterListSortParams[column.sortKey]?.sortOrder === "asc" ? "desc" : "asc",
          ...((column.isFormVariable || enabledSort.has(column.sortKey)) && {
            type: column.type ,
          })
      },
      activeKey: column.sortKey,
    };

    dispatch(setFilterListSortParams(updatedFilterListSortParams));
    const payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      updatedFilterListSortParams,
      dateRange,
      isAssigned,
      column.isFormVariable
    );
    dispatch(fetchServiceTaskList(payload, null, activePage, limit));
  };

  const renderHeaderContent = (column) => {
    //If the header is for the View button or the variable type is null, then there should be no sorting option for those columns.
    if (["actions", "roles"].includes(column.sortKey) || !column.type || !sortableList.has(column.type))
      {
      return (
        <span className="text">
          {t(column.name)}
        </span>
      )
    }
    return (
      <SortableHeader
        className="header-sortable"
        columnKey={column.sortKey}
        title={t(column.name)}
        currentSort={filterListSortParams}
        handleSort={() => handleSort(column)}
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
        actionTableSmall
        label={t("View")}
        onClick={() => history.push(`${redirectUrl.current}task/${task.id}`)}
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
      {column.sortKey == "assignee" ? (
        getCellValue(column, task)
      ) : (
        <div className={`content`}
          style={{
            WebkitLineClamp: selectedFilter?.properties?.displayLinesCount ?? 1, //here displayLines count is not there we will show 1 lines of content
          }}
        >
          {getCellValue(column, task)}
        </div>
      )}
    </td>
  );


  const renderEmptyTable = () => (
    <div
      className="custom-table-wrapper-outter"
      data-testid="no-columns-message"
      aria-label={t("No columns message")}
    >
      <div className="custom-table-wrapper-inner resizable">
        <table>
          <tbody className="table-empty">
            <p className="empty-message" data-testid="empty-columns-message">
              {t(
                "No tasks have been found. Try a different filter combination or contact your admin."
              )}
            </p>
          </tbody>
        </table>
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
    <>
      <div className="custom-table-wrapper-outter">
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
          headerClassName="resizable-header"
          scrollWrapperClassName="table-scroll-wrapper resizable-scroll"
          dataTestId="task-resizable-table"
          ariaLabel={t("Tasks data table with resizable columns")}
        />

        {renderTableFooter()}
      </div>
    </>
  );

  const renderTableFooter = () => (
    <>
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
    </>
  );



if (!columns?.length) {
  return isTaskListLoading ? <Loading /> : renderEmptyTable();
}

  return renderTableContainer();
};

export default TaskListTable;
