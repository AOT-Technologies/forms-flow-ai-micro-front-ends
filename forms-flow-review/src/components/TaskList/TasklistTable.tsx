import {
  CustomButton,
  ReusableResizableTable,
  SortableHeader,
  TableFooter,
  ReusableLargeModal,
  V8CustomButton,
  ReusableTable,
  FormStatusIcon
} from "@formsflow/components";
import { HelperServices } from "@formsflow/service";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import { isEqual, cloneDeep } from "lodash";
import {
  resetTaskListParams,
  setBPMTaskListActivePage,
  setBPMTaskLoader,
  setFilterListSortParams,
  setTaskListLimit,
  setSelectedTaskID,
  setBPMTaskDetailLoader,
  setTaskDetailsLoading,
  setFormSubmissionLoading,
  resetFormData,
  setBundleSelectedForms,
  setBundleLoading,
  setAppHistoryLoading,
  setTaskAssignee,
} from "../../actions/taskActions";
import { MULTITENANCY_ENABLED } from "../../constants";
import { useHistory, useParams } from "react-router-dom";
import {
  fetchServiceTaskList,
  fetchTaskVariables,
  executeRule,
} from "../../api/services/filterServices";
import {
  getBPMTaskDetail,
  getBPMGroups,
  onBPMTaskFormSubmit,
  getApplicationHistory,
  getCustomSubmission,
} from "../../api/services/bpmTaskServices";
import {
  getForm,
  getSubmission,
  Formio,
  resetSubmission,
} from "@aot-technologies/formio-react";
import {
  getFormIdSubmissionIdFromURL,
  getFormUrlWithFormIdSubmissionId,
} from "../../api/services/formatterService";
import { getFormioRoleIds } from "../../api/services/userSrvices";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
  CUSTOM_EVENT_TYPE,
} from "../../constants/index";
import TaskAssigneeManager from "../Assigne/Assigne";
import { buildDynamicColumns, optionSortBy } from "../../helper/tableHelper";
import { createReqPayload,sortableKeysSet } from "../../helper/taskHelper";
import { removeTenantKey } from "../../helper/helper";
import Loading from "../Loading/Loading";
import TaskForm from "../TaskForm";
import BundleTaskForm from "../BundleTaskForm";

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

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalViewType, setModalViewType] = useState<"submission" | "history">("submission");
  const [bundleFormData, setBundleFormData] = useState<{ formId: string; submissionId: string }>({
    formId: "",
    submissionId: "",
  });
  const [bundleName, setBundleName] = useState("");
  const [historyPaginationModel, setHistoryPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Redux selectors for task details
  const task = useSelector((state: any) => state.task.taskDetail);
  const taskDetailsLoading = useSelector((state: any) => state.task.taskDetailsLoading);
  const selectedForms = useSelector((state: any) => state.task.selectedForms || []);
  const appHistory = useSelector((state: any) => state.task?.appHistory || []);
  const isAppHistoryLoading = useSelector((state: any) => state.task?.isAppHistoryLoading || false);
  const taskAssignee = useSelector((state: any) => state?.task?.taskAssignee);

  const currentUser = JSON.parse(
    localStorage.getItem("UserDetails") || "{}"
  )?.preferred_username;
  const disabledMode = taskAssignee !== currentUser;

  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setModalViewType("submission");
    setShowModal(true);
    // Set task ID and load task details
    if (task.id) {
      dispatch(setSelectedTaskID(task.id));
      dispatch(setBPMTaskDetailLoader(true));
      dispatch(setTaskDetailsLoading(true));
      dispatch(getBPMTaskDetail(task.id));
      dispatch(getBPMGroups(task.id));
      
      // Also load history data upfront to avoid lag when switching views
      const applicationId = task._embedded?.variable?.find(
        (v: { name: string; value: any }) => v.name === "applicationId"
      )?.value;
      if (applicationId) {
        dispatch(setAppHistoryLoading(true));
        dispatch(getApplicationHistory(applicationId));
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setShowModal(false);
    setModalViewType("submission");
    Formio.clearCache();
    dispatch(setSelectedTaskID(null));
    dispatch(resetSubmission("submission"));
    dispatch(setBundleSelectedForms([]));
  };

  const handleSubmissionClick = () => {
    setModalViewType("submission");
  };

  const handleHistoryClick = () => {
    setModalViewType("history");
  };

  const taskvariables = selectedFilter?.variables ?? [];

  const getCellValue = (column: Column, task: Task) => {
  const { sortKey } = column;
  const { name: taskName, created, _embedded } = task ?? {};
  const variables = _embedded?.variable ?? [];
  const candidateGroups = _embedded?.candidateGroups ?? [];

  if (column.sortKey === "applicationId") {
    return variables.find((v) => v.name === "applicationId")?.value ?? "-";
  }

  //checking isFormVariable to avoid the inappropriate value setting when static and dynamic varibales are same
  if (!column.isFormVariable) {
    switch (sortKey) {
      case "name":
        return taskName ?? "-";
      case "created":
        return created ? HelperServices.getLocaldate(created) : "N/A";
      case "assignee":
        return <TaskAssigneeManager task={task} />;
      case "roles": {
  const validGroups = candidateGroups.filter(group => group?.groupId);

  const roleValues = validGroups.length > 0
    ? validGroups.map(group =>
        removeTenantKey(group.groupId, tenantKey, MULTITENANCY_ENABLED)
      )
    : ["-"];

  const allRoles = roleValues.join(",");

  return allRoles;
}



    }
  }

  const matchingVar = variables.find((v) => v.name === sortKey);
  if (!matchingVar) return "-";

  // check if this is a datetime field & date field
  const dateTimeField = taskvariables.find(
    (taskVar) => taskVar.key === sortKey && taskVar.type === "datetime"
  );
  const dateField = taskvariables.find(
    (taskVar) => taskVar.key === sortKey && taskVar.type === "day"
  )
  const selectBoxes = taskvariables.find(
    (taskVar) =>  taskVar.key === sortKey && taskVar.type === "selectboxes"
  )
  
  if (dateTimeField) {
    return matchingVar.value
      ? HelperServices.getLocalDateAndTime(matchingVar.value)
      : "-";
  }
  if (selectBoxes) {
    const obj = JSON.parse(matchingVar.value);
    const trueKeys = Object.keys(obj).filter((key) => obj[key]);
    const displayValue = trueKeys.length ? trueKeys.join(", ") : "-";
    return displayValue;
  }
  if (dateField) {
  return matchingVar.value
    ? new Date(matchingVar.value).toLocaleDateString("en-GB") // format date as dd/mm/yyyy
        .replace(/\//g, "-") // convert `/` to `-`
    : "-";
}
// return matchingVar.value ?? "-";

if (typeof matchingVar.value === "boolean") {
  return matchingVar.value ? "True" : "False"; 
}

return matchingVar.value ?? "-";
  }
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );

  // Load form and submission for task details
  const handleFormRetry = (fetchForm: () => void) => (retryErr: any) => {
    if (!retryErr) {
      fetchForm();
    } else {
      dispatch(setFormSubmissionLoading(false));
    }
  };

  const handleSuccessfulFormFetch = (formId: string, submissionId: string) => {
    if (CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE) {
      dispatch(getCustomSubmission(submissionId, formId));
    } else {
      dispatch(getSubmission("submission", submissionId, formId));
    }
    dispatch(setFormSubmissionLoading(false));
  };

  const getFormSubmissionData = useCallback(
    (formUrl: string) => {
      const { formId, submissionId } = getFormIdSubmissionIdFromURL(formUrl);
      Formio.clearCache();
      dispatch(resetFormData("form"));

      const fetchForm = () => {
        dispatch(
          getForm("form", formId, ((err: any) => {
            if (!err) {
              handleSuccessfulFormFetch(formId, submissionId);
            } else if (err === "Bad Token" || err === "Token Expired") {
              dispatch(resetFormData("form"));
              dispatch(getFormioRoleIds(handleFormRetry(fetchForm)) as any);
            } else {
              dispatch(setFormSubmissionLoading(false));
            }
          }) as any)
        );
      };

      fetchForm();
    },
    [dispatch]
  );

  // Load form and submission when task details are loaded
  useEffect(() => {
    if (task?.formUrl && task?.formType !== "bundle" && modalViewType === "submission") {
      getFormSubmissionData(task.formUrl);
    }
  }, [task?.formUrl, task?.formType, modalViewType, getFormSubmissionData]);

  // Handle bundle form setup
  useEffect(() => {
    if (task?.formType === "bundle" && modalViewType === "submission") {
      Formio.clearCache();
      dispatch(resetFormData("form"));
      dispatch(setBundleLoading(false));

      const { formId, submissionId } = getFormIdSubmissionIdFromURL(task.formUrl);
      setBundleFormData({ formId, submissionId });

      fetchTaskVariables(task?.formId)
        .then((res) => {
          setBundleName(res.data.formName);
          executeRule(
            {
              submissionType: "fetch",
              formId: formId,
              submissionId: submissionId,
            },
            res.data.id
          )
            .then((res: { data: unknown }) => {
              dispatch(setBundleSelectedForms(res.data));
            })
            .catch((err: unknown) => {
              console.error("Bundle error:", err);
            })
            .finally(() => {
              dispatch(setBundleLoading(false));
            });
        })
        .catch((err) => {
          console.error("Error fetching bundle:", err);
          dispatch(setBundleLoading(false));
        });

      return () => {
        dispatch(setBundleSelectedForms([]));
      };
    }
  }, [task?.formType, task?.formId, task?.formUrl, modalViewType, dispatch]);

  // Form submission callback
  const onFormSubmitCallback = (actionType = "") => {
    if (!selectedTask?.id || !task?.formUrl) return;
    dispatch(setBPMTaskDetailLoader(true));
    const { formId, submissionId } = getFormIdSubmissionIdFromURL(task.formUrl);
    const formUrl = getFormUrlWithFormIdSubmissionId(formId, submissionId);
    const webFormUrl = `${window.location.origin}/form/${formId}/submission/${submissionId}`;
    const payload = {
      variables: {
        formUrl: { value: formUrl },
        applicationId: { value: task.applicationId },
        webFormUrl: { value: webFormUrl },
        action: { value: actionType },
      },
    };
    dispatch(
      onBPMTaskFormSubmit(
        selectedTask.id,
        payload,
        () => dispatch(setBPMTaskDetailLoader(false))
      )
    );
    handleCloseModal();
  };

  // Custom event handler for form
  const onCustomEventCallBack = (customEvent: {
    type: string;
    actionType: string;
  }) => {
    if (customEvent.type === CUSTOM_EVENT_TYPE.ACTION_COMPLETE) {
      onFormSubmitCallback(customEvent.actionType);
    }
  };

  // Prepare history table data
  const historyColumns = useMemo(
    () => [
      {
        field: "created",
        headerName: t("Created On"),
        flex: 2,
        renderCell: (params: any) => HelperServices.getLocaldate(params.value), 
        sortable: false 
      },
      {
        field: "submittedBy",
        headerName: t("User"),
        flex: 2,
        sortable: false
      },
      {
        field: "action",
        headerName: t("Action"),
        flex: 2,
        sortable: false,
        cellClassName: 'action-cell-stretch',
        renderCell: (params: any) => {
          const entry = params.row;
          return (
            <div
              className="task-status"
              data-testid={`form-status-${entry.submissionId || "new"}`}
            >
              <FormStatusIcon color={entry.applicationStatus === "New" ? "#F7DF82" : "#00C49A"} />
              <span className="status-text">
                {entry.applicationStatus || "N/A"}
              </span>
            </div>
          );
        },
      },
    ],
    [t]
  );

  const historyRows = useMemo(() => {
    return (appHistory || []).map((entry: any, index: number) => ({
      id: entry.submissionId || index,
      created: entry.created || "",
      submittedBy: entry.submittedBy || "N/A",
      applicationStatus: entry.applicationStatus || "N/A",
      formId: entry.formId,
      submissionId: entry.submissionId,
    }));
  }, [appHistory]);
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


  const renderReusableModal = () => {
    if (!selectedTask) return null;

    const taskName = task?.formType === "bundle" ? bundleName : task?.name || selectedTask.name || selectedTask.id;

    const renderContent = () => {
      if (modalViewType === "history") {
        return (
              <ReusableTable
                columns={historyColumns}
                rows={historyRows}
                loading={isAppHistoryLoading}
                noRowsLabel={t("No submission history found")}
                paginationModel={historyPaginationModel}
                onPaginationModelChange={setHistoryPaginationModel}
                paginationMode="client"
                sortingMode="client"
                pageSizeOptions={[5, 10, 25, 50]}
                rowHeight={60}
                sx={{ 
                  height: 500, 
                  width: "100%",
                  '& .MuiDataGrid-columnHeader--last .MuiDataGrid-columnHeaderTitleContainer': {
                    justifyContent: 'flex-start !important',
                  },
                  '& .MuiDataGrid-cell.action-cell-stretch': {
                    alignItems: 'stretch !important',
                  },
                }}
                disableColumnResize={true}
                disableColumnMenu={true}
              />
        );
      } else {
        // Submission view
        const isLoading = taskDetailsLoading || (!task?.formUrl && !task?.formType);
        
        if (isLoading) {
          return <Loading />;
        }

        if (task?.formType === "bundle" && selectedForms?.length) {
          return (
            <div className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border ${disabledMode ? "disabled-mode" : "bg-white"}`}>
              <BundleTaskForm
                bundleId={task?.formId}
                currentUser={currentUser || ""}
                onFormSubmit={onFormSubmitCallback}
                bundleFormData={bundleFormData}
                onCustomEvent={onCustomEventCallBack}
              />
            </div>
          );
        } else {
          return (
            <div className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border ${disabledMode ? "disabled-mode" : "bg-white"}`}>
              <TaskForm
                currentUser={currentUser || ""}
                onFormSubmit={onFormSubmitCallback}
                onCustomEvent={onCustomEventCallBack}
              />
            </div>
          );
        }
      }
    };

    return (
      <ReusableLargeModal
        show={showModal}
        onClose={handleCloseModal}
        title={task?.applicationId}
        subtitle={
          <div className="d-flex justify-content-between">
            <div className="d-flex gap-2">
            <V8CustomButton
              label={t("Submission")}
              onClick={handleSubmissionClick}
              className="mr-2"
              dataTestId="modal-submission-button"
              selected={modalViewType === "submission"}
            />
            <V8CustomButton
              label={t("History")}
              onClick={handleHistoryClick}
              dataTestId="modal-history-button"
              selected={modalViewType === "history"}
            />
            </div>
            <div className="d-flex gap-2">
              <div
                className="form-status"
                data-testid={`form-status-${task?._id || "new"}`}
              >
                <FormStatusIcon color={taskAssignee ? "#00C49A" : "#F7DF82"} />
                <span className="status-text">
                  {taskAssignee ? "Assigned" : "Pending"}
                </span>
              </div>
            <TaskAssigneeManager task={task} />
            </div>
          </div>
        }
        content={renderContent()}
      />
    );
  };

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
    const isSortableHeader =["actions", "roles"].includes(column.sortKey) || !column.type ||  !sortableKeysSet.has(column.type);

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
    if (["actions", "roles"].includes(column.sortKey) || !column.type || !sortableKeysSet.has(column.type))
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
        onClick={() => handleOpenModal(task)}
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

  return (
    <>
      {renderTableContainer()}
      {showModal && renderReusableModal()}
    </>
  );
};

export default TaskListTable;
