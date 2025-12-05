import {
  V8CustomButton,
  ReusableTable
} from "@formsflow/components";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { HelperServices } from "@formsflow/service";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import { isEqual } from "lodash";
import TaskDetailsModal from "./TaskDetailsModal";
import {
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
  setSelectedFilter,
} from "../../actions/taskActions";
import { MULTITENANCY_ENABLED } from "../../constants";
import { useHistory, useParams } from "react-router-dom";
import {
  fetchServiceTaskList,
  fetchTaskVariables,
  executeRule
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

export interface Task {
  id: string;
  name?: string;
  created?: string;
  assignee?: string;
  _embedded?: {
    variable?: Array<{ name: string; value: any }>;
    candidateGroups?: Array<{ groupId: string }>;
  };
}

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number;
  isFormVariable?: boolean;
  type?: string;
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
  const [modalViewType, setModalViewType] = useState<"submission" | "history" | "notes">("submission");
  const [bundleFormData, setBundleFormData] = useState<{ formId: string; submissionId: string }>({
    formId: "",
    submissionId: "",
  });
  const [bundleName, setBundleName] = useState("");

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

  const handleOpenModal = useCallback((task: Task) => {
    setSelectedTask(task);
    setModalViewType("submission");
    setShowModal(true);
    // Set task ID and load task details
    if (task.id) {
      dispatch(setSelectedTaskID(task.id));
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
  }, [dispatch]);

  const handleCloseModal = useCallback(() => {
    setSelectedTask(null);
    setShowModal(false);
    setModalViewType("submission");
    Formio.clearCache();
    dispatch(setSelectedTaskID(null));
    dispatch(resetSubmission("submission"));
    dispatch(setBundleSelectedForms([]));
  }, [dispatch]);

  const handleSubmissionClick = useCallback(() => {
    setModalViewType("submission");
  }, []);

  const handleHistoryClick = useCallback(() => {
    setModalViewType("history");
  }, []);

  const handleNotesClick = useCallback(() => {
    setModalViewType("notes");
  }, []);

  const taskvariables = selectedFilter?.variables ?? [];
  const redirectUrl = useRef(
    MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/"
  );
  const [columns, setColumns] = useState<Column[]>([]);

  // Max number of text lines to display in a cell before truncating
  const maxTextLines = useMemo(() => {
    const lines = Number(
      selectedFilter?.properties?.displayLinesCount ??
      1
    );
    if (isNaN(lines)) return 1;
    // Clamp between 1 and 5 lines to avoid excessive row heights
    return Math.max(1, Math.min(5, lines));
  }, [selectedFilter?.properties?.dataLineValue, selectedFilter?.properties?.displayLinesCount]);

  const isMultiLineEnabled = maxTextLines > 1;

  const getCellValue = (column: Column, task: Task) => {
    const { sortKey } = column;
    const { name: taskName, created, _embedded } = task ?? {};
    const variables = _embedded?.variable ?? [];
    const candidateGroups = _embedded?.candidateGroups ?? [];

    const textClassName = isMultiLineEnabled
      ? "text-multiline-ellipsis"
      : "text-overflow-ellipsis";
    // Apply all multi-line ellipsis styles inline to ensure they override any CSS
    const textStyle: React.CSSProperties | undefined = isMultiLineEnabled
      ? {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical' as const,
          WebkitLineClamp: maxTextLines,
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        }
      : undefined;

    if (sortKey === "applicationId") {
      const value = variables.find((v) => v.name === "applicationId")?.value ?? "-";
      return (
        <div className={textClassName} style={textStyle}>
          {value}
        </div>
      );
    }

  //checking isFormVariable to avoid the inappropriate value setting when static and dynamic varibales are same
  if (!column.isFormVariable) {
    switch (sortKey) {
      case "name":
        return (
          <div className={textClassName} style={textStyle}>
            {taskName ?? "-"}
          </div>
        );
      case "created":
        return (
          <div className={textClassName} style={textStyle}>
            {created ? HelperServices.getLocaldate(created) : "N/A"}
          </div>
        );
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

  return (
    <div className={textClassName} style={textStyle}>
      {allRoles}
    </div>
  );
}



    }
  }

  const matchingVar = variables.find((v) => v.name === sortKey);
  if (!matchingVar) return "-";

    const dateTimeField = taskvariables.find(
      (v) => v.key === sortKey && v.type === "datetime"
    );
    const dateField = taskvariables.find(
      (v) => v.key === sortKey && v.type === "day"
    );
    const selectBoxes = taskvariables.find(
      (v) => v.key === sortKey && v.type === "selectboxes"
    );

    if (dateTimeField) {
      const value = matchingVar?.value
        ? HelperServices.getLocalDateAndTime(matchingVar?.value)
        : "-";
      return (
        <div className={textClassName} style={textStyle}>
          {value}
        </div>
      );
    }
    if (selectBoxes) {
      let obj: Record<string, any> | null = null;
      if (typeof matchingVar?.value === "string") {
        try {
          obj = JSON.parse(matchingVar.value);
        } catch (e) {
          obj = null;
        }
      }
      if (obj && typeof obj === "object") {
        const trueKeys = Object.keys(obj).filter((key) => obj[key]);
        const value = trueKeys.length ? trueKeys.join(", ") : "-";
        return (
          <div className={textClassName} style={textStyle}>
            {value}
          </div>
        );
      } else {
        return (
          <div className={textClassName} style={textStyle}>
            -
          </div>
        );
      }
    }
    if (dateField) {
      const value = matchingVar?.value
        ? new Date(matchingVar.value)
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-")
        : "-";
      return (
        <div className={textClassName} style={textStyle}>
          {value}
        </div>
      );
    }
    if (typeof matchingVar.value === "boolean") {
      return (
        <div className={textClassName} style={textStyle}>
          {matchingVar?.value ? "True" : "False"}
        </div>
      );
    }
    return (
      <div className={textClassName} style={textStyle}>
        {matchingVar?.value ?? "-"}
      </div>
    );
  };
  const handleRefresh = useCallback(() => {
    dispatch(setBPMTaskLoader(true));
    const payload = createReqPayload(
      selectedFilter,
      selectedAttributeFilter,
      filterListSortParams,
      dateRange,
      isAssigned,
      false
    );
    dispatch(fetchServiceTaskList(payload, null, activePage, limit));
  }, [dispatch, selectedFilter, selectedAttributeFilter, filterListSortParams, dateRange, isAssigned, activePage, limit]);

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
  const onFormSubmitCallback = useCallback((actionType = "") => {
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
  }, [selectedTask?.id, task?.formUrl, task?.applicationId, dispatch, handleCloseModal]);

  // Custom event handler for form
  const onCustomEventCallBack = useCallback((customEvent: {
    type: string;
    actionType: string;
  }) => {
    if (customEvent.type === CUSTOM_EVENT_TYPE.ACTION_COMPLETE) {
      onFormSubmitCallback(customEvent.actionType);
    }
  }, [onFormSubmitCallback]);

  // Prepare history table data
  useEffect(() => {
    const dynamicColumns = buildDynamicColumns(taskvariables);
    setColumns((prev) => (!isEqual(prev, dynamicColumns) ? dynamicColumns : prev));
  }, [taskvariables]);

  const handleSortModelChange = useCallback((model: any) => {
    const column = columns.find((col) => col.sortKey === model?.[0]?.field);
    if (!column) return;
    dispatch(setBPMTaskLoader(true));
    
    const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
    const enabledSort = new Set(["applicationId", "submitterName", "formName"]);
    
    const updatedFilterListSortParams = {
      ...resetSortOrders,
      [column.sortKey]: {
        sortOrder: model?.[0]?.sort,
        ...((column.isFormVariable || enabledSort.has(column.sortKey)) && {
          type: column.type,
        }),
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
  }, [columns, dispatch, selectedFilter, selectedAttributeFilter, dateRange, isAssigned, activePage, limit]);

  const paginationModel = useMemo(
    () => ({ page: activePage - 1, pageSize: limit }),
    [activePage, limit]
  );

  const handlePaginationModelChange = useCallback(({ page, pageSize }: any) => {
    batch(() => {
      dispatch(setBPMTaskListActivePage(page + 1));
      dispatch(setTaskListLimit(pageSize));
    });
  }, [dispatch]);

  const sortModel = useMemo(
    () => [
      filterListSortParams.activeKey
        ? {
            field: filterListSortParams.activeKey,
            sort: filterListSortParams[filterListSortParams.activeKey]?.sortOrder || "asc",
          }
        : {},
    ],
    [filterListSortParams]
  );
  const nonSortableKeys = ['roles']
  const muiColumns = useMemo(() => {
  // Filter out any existing "actions" column that might come from dynamic columns
  const filteredColumns = columns.filter(col => col.sortKey !== 'actions');

  return [
    ...filteredColumns.map((col, idx) => ({
      field: col.sortKey,
      headerName: t(col.sortKey === 'assignee' ? 'Assigned to' : col.name),
      // If a saved width exists, honor it and disable flex; otherwise allow flex
      ...(col.width ? { width: col.width, flex: 0 } : { flex: 1 }),
      sortable: col.sortKey && !nonSortableKeys.includes(col.sortKey) ? true : false,
      // Do not lock minWidth to the last saved width; allow shrinking after expand
      minWidth: col.sortKey === 'assignee' ? 190 : 90,
      headerClassName: idx === filteredColumns.length - 1 ? 'no-right-separator' : '',
      renderCell: (params: any) => getCellValue(col, params.row),
    })),
    // Filler column to push actions column to the right when there are fewer columns
    {
      field: "__filler__",
      headerName: "",
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      flex: 1,
      minWidth: 0,
      headerClassName: "filler-column",
      cellClassName: "filler-column",
      renderCell: () => null,
      valueGetter: () => null,
    },
    {
      field: "actions",
       renderHeader: () => (
        <V8CustomButton
          variant="secondary"
          label={t("Refresh")}
          onClick={handleRefresh}
          dataTestId="task-refresh-button"
        />
      ),
      headerName: "",
      sortable: false,
      filterable: false,
      resizable: false,

      headerClassName: "sticky-column-header last-column",
      cellClassName: "sticky-column-cell",

      width: 100,
      minWidth: 100,
      maxWidth: 100,
      flex: 0,
      renderCell: (params: any) => (
        <V8CustomButton
          label={t("View")}
          dataTestId="task-view-button"
          variant="secondary"
          onClick={() => handleOpenModal(params.row)}
        />
      ),
    },
  ];
}, [columns, t, handleRefresh, handleOpenModal]);



  const memoizedRows = useMemo(() => tasksList || [], [tasksList]);

  // Base row height
  const baseRowHeight = 55;

  // When multi-line is enabled, use 'auto' height so rows adjust to content
  // The CSS will handle the max height constraint via -webkit-line-clamp
  const getRowHeight = useCallback(() => {
    if (!isMultiLineEnabled) return baseRowHeight;
    // Return 'auto' to let row height adjust based on content
    return 'auto';
  }, [isMultiLineEnabled]);

  if (!columns?.length) {
    return isTaskListLoading ? <Loading /> : (
      <div className="custom-table-wrapper-outter">
        <p className="empty-message" data-testid="empty-columns-message">
          {t("No tasks have been found. Try a different filter combination or contact your admin.")}
        </p>
      </div>
    );
  }

  // Wrapper class to enable multi-line cell styles via CSS
  const tableWrapperClass = isMultiLineEnabled ? 'task-table-multiline' : '';

  return (
    <>
      <div className={tableWrapperClass}>
        <ReusableTable
          columns={muiColumns}
          disableColumnResize={false}
          rows={memoizedRows}
          rowCount={tasksCount}
          loading={isTaskListLoading}
          rowHeight={baseRowHeight}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          noRowsLabel={t("No tasks found")}
          disableColumnMenu
          disableRowSelectionOnClick
          dataGridProps={{
            getRowId: (row: any) => row.id,
            getRowHeight: getRowHeight as any,
            onColumnWidthChange: (params: any) => {
              try {
                const field = params?.colDef?.field || params?.field;
                const width = params?.width;
                if (!field || !width || !selectedFilter?.id) return;
                const updatedVariables = (selectedFilter?.variables || []).map((v: any) =>
                  (v.key === field || v.name === field) ? { ...v, width } : v               
               );
                const updatedFilter = { ...selectedFilter, variables: updatedVariables } as any;
                // Update locally so future saves carry widths
                dispatch(setSelectedFilter(updatedFilter));
                // Do not persist here; widths are saved when the user saves the filter
              } catch (e) {
                // no-op
              }
            }
          }}
          enableStickyActions={true}
          disableVirtualization
          autoHeight={true}
        />
      </div>
      {showModal && (
        <TaskDetailsModal
          show={showModal}
          onClose={handleCloseModal}
          selectedTask={selectedTask}
          taskDetail={task}
          taskAssignee={taskAssignee}
          modalViewType={modalViewType}
          onSubmissionClick={handleSubmissionClick}
          onNotesClick={handleNotesClick}
          onHistoryClick={handleHistoryClick}
          onFormSubmitCallback={onFormSubmitCallback}
          onCustomEventCallBack={onCustomEventCallBack}
          currentUser={currentUser || ""}
          disabledMode={disabledMode}
          bundleFormData={bundleFormData}
          selectedForms={selectedForms}
          isTaskDetailsLoading={taskDetailsLoading}
          isAppHistoryLoading={isAppHistoryLoading}
          appHistory={appHistory}
          statusValue={task?.applicationStatus || "Pending"}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
};

export default TaskListTable;
