import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ReusableLargeModal,
  V8CustomButton,
  ReusableTable,
  FormStatusIcon,
  SelectDropdown,
  CustomTextArea,
  CustomInfo,
} from "@formsflow/components";
import { HelperServices, StyleServices } from "@formsflow/service";
import TaskAssigneeManager from "../Assigne/Assigne";
import BundleTaskForm from "../BundleTaskForm";
import TaskForm from "../TaskForm";
import Loading from "../Loading/Loading";
import type { Task } from "./TasklistTable";
import { getFormIdSubmissionIdFromURL, getFormUrlWithFormIdSubmissionId } from "../../api/services/formatterService";
import { onBPMTaskFormUpdate } from "../../api/services/bpmTaskServices";
import { setBPMTaskDetailLoader } from "../../actions/taskActions";

interface BundleFormData {
  formId: string;
  submissionId: string;
}

interface TaskDetailsModalProps {
  show: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  taskDetail: any;
  taskAssignee: string | undefined;
  modalViewType: "submission" | "history" | "notes";
  onSubmissionClick: () => void;
  onNotesClick?: () => void;
  onHistoryClick: () => void;
  onFormSubmitCallback: (actionType?: string) => void;
  onCustomEventCallBack: (event: { type: string; actionType: string }) => void;
  currentUser: string;
  disabledMode: boolean;
  bundleFormData: BundleFormData;
  selectedForms: any[];
  isTaskDetailsLoading: boolean;
  isAppHistoryLoading: boolean;
  appHistory: any[];
  statusValue?: string;
  onStatusChange?: (value: string | number) => void;
  onUpdate?: () => void;
  onCancel?: () => void;
  isUpdateDisabled?: boolean;
  isUpdateLoading?: boolean;
  isCancelDisabled?: boolean;
  isCancelLoading?: boolean;
  onRefresh?: () => void;
}

const TaskDetailsModal = ({
  show,
  onClose,
  selectedTask,
  taskDetail,
  taskAssignee,
  modalViewType,
  onSubmissionClick,
  onNotesClick = () => {},
  onHistoryClick,
  onFormSubmitCallback,
  onCustomEventCallBack,
  currentUser,
  disabledMode,
  bundleFormData,
  selectedForms,
  isTaskDetailsLoading,
  isAppHistoryLoading,
  appHistory,
  statusValue,
  onStatusChange,
  onUpdate,
  onCancel,
  isUpdateDisabled,
  isUpdateLoading,
  isCancelDisabled,
  isCancelLoading,
  onRefresh,
}: TaskDetailsModalProps) => {
  const { t } = useTranslation();
  const [notesText, setNotesText] = useState("");
  const [currentStatusValue, setCurrentStatusValue] = useState<string>("Pending");
  const task = useSelector((state: any) => state.task.taskDetail);
  const submission = useSelector((state: any) => state.submission);
  const isBPMTaskDetailLoading = useSelector((state: any) => state.task.isBPMTaskDetailLoading);
  const dispatch = useDispatch();

  // Sync local state with prop when it changes
  useEffect(() => {
    const validValues = ["Pending", "Approve", "Decline"];
    if (statusValue && validValues.includes(statusValue)) {
      setCurrentStatusValue(statusValue);
    } else if (!statusValue) {
      setCurrentStatusValue("Pending");
    }
  }, [statusValue]);
  const historyColumns = useMemo(
    () => [
      {
        field: "created",
        headerName: t("Created On"),
        flex: 2,
        renderCell: (params: any) => HelperServices.getLocaldate(params.value),
        sortable: false,
      },
      {
        field: "submittedBy",
        headerName: t("User"),
        flex: 2,
        sortable: false,
      },
      {
        field: "applicationStatus",
        headerName: t("Status"),
        flex: 2,
        sortable: false,
        renderCell: (params: any) => {
          const entry = params.row;
          return <span className="status-text">{entry.applicationStatus || "N/A"}</span>;
        },
      },
    ],
    [t]
  );

  const historyRows = useMemo(
    () =>
      (appHistory || []).map((entry: any, index: number) => ({
        id: entry.created || index,
        created: entry.created || "",
        submittedBy: entry.submittedBy || "N/A",
        applicationStatus: entry.applicationStatus || "N/A",
        formId: entry.formId,
        submissionId: entry.submissionId,
        notes: entry.privateNotes,
      })),
    [appHistory]
  );

  const statusColorMap = useMemo(
    () => ({
      Pending: StyleServices.getCSSVariable("--yellow-200"),
      Approve: StyleServices.getCSSVariable("--green-100"),
      Decline: StyleServices.getCSSVariable("--red-100"),
    }),
    []
  );

  const statusOptions = useMemo(
    () =>
      ["Pending", "Approve", "Decline"].map((status) => ({
        label: t(status),
        value: status,
        icon: <FormStatusIcon color={statusColorMap[status as keyof typeof statusColorMap]} />,
      })),
    [statusColorMap, t]
  );

  const resolvedStatusValue = useMemo(() => {
    const validValues = statusOptions.map((option) => option.value);
    return currentStatusValue && validValues.includes(currentStatusValue) ? currentStatusValue : "Pending";
  }, [statusOptions, currentStatusValue]);

  const isUpdateButtonDisabled = useMemo(() => {
    return isUpdateDisabled || resolvedStatusValue === "Pending";
  }, [isUpdateDisabled, resolvedStatusValue]);

  const handleStatusChange = (value: string | number) => {
    const newStatus = String(value);
    setCurrentStatusValue(newStatus);
    onStatusChange?.(value);
  };

  // task update callback
  const onTaskUpdate = (actionType = "") => {
    if (!selectedTask?.id || !task?.formUrl) return;
    dispatch(setBPMTaskDetailLoader(true));
    const { formId, submissionId } = getFormIdSubmissionIdFromURL(task.formUrl);
    const formUrl = getFormUrlWithFormIdSubmissionId(formId, submissionId);
    const webFormUrl = `${globalThis.location.origin}/form/${formId}/submission/${submissionId}`;
    // Extract formId and data from submission Redux state
    const submissionFormId = submission?.formId || formId;
    const submissionData = submission?.submission?.data || {};

    // Map SelectDropdown value to applicationStatus
    const statusMapping: Record<string, string> = {
      "Approve": "Approved",
      "Decline": "Rejected",
      "Pending": "Pending",
    };
    const selectedStatus = resolvedStatusValue || statusValue || "Pending";
    const applicationStatus = statusMapping[selectedStatus] || selectedStatus;
    
    // Get submittedBy from submission owner or currentUser
    const submittedBy = submission?.owner || currentUser || "";
    
    const payload = {
      formData: {
        formId: submissionFormId,
        data: submissionData,
      },
      bpmnData: {
        variables: {
          formUrl: { value: formUrl },
          applicationId: { value: task.applicationId },
          webFormUrl: { value: webFormUrl },
          action: { value: applicationStatus },
        },
      },
      applicationData: {
        applicationId: task.applicationId,
        applicationStatus: applicationStatus,
        formUrl: formUrl,
        submittedBy: submittedBy,
        privateNotes: notesText || null,
      },
    };
    dispatch(
      onBPMTaskFormUpdate(
        selectedTask.id,
        payload,
        (error: any) => {
          dispatch(setBPMTaskDetailLoader(false));
          if (!error) {
            // Success: Close modal and refresh task list
            onClose();
            onRefresh?.();
          }
        }
      )
    );
  };

  const handleUpdateClick = () => {
    onTaskUpdate();
  };

  const isApprovalTask =
    taskDetail?.taskDefinitionKey?.startsWith("ApprovalTask-") ?? false;

  const headerStatusControl = (
    <SelectDropdown
      options={statusOptions}
      value={resolvedStatusValue}
      defaultValue="Pending"
      disabled={disabledMode}
      onChange={handleStatusChange}
      dataTestId="modal-status-dropdown"
      ariaLabel="status"
      style={{ width: "7.75rem" }}
    />
  );

  const handleCancel = onCancel ?? onClose;

  const renderHistoryContent = () => (
    <ReusableTable
      columns={historyColumns}
      rows={historyRows}
      loading={isAppHistoryLoading}
      noRowsLabel={t("No submission history found")}
      paginationMode="client"
      sortingMode="client"
      hideFooter
      rowHeight={60}
      enableRowExpansion={true}
      notesField="notes"
      sx={{
        height: 500,
        width: "100%",
        "& .MuiDataGrid-columnHeader--last .MuiDataGrid-columnHeaderTitleContainer": {
          justifyContent: "flex-start !important",
        },
        "& .MuiDataGrid-cell.action-cell-stretch": {
          alignItems: "stretch !important",
        },
      }}
      disableColumnResize
      disableColumnMenu
    />
  );

  const renderNotesContent = () => (
    <div className="p-3">
      <h5 className="mb-4">{taskDetail && `${taskDetail.name}`}</h5>
      <div className="mb-3">
        <div className="notes-label mb-2">Notes</div>
        <CustomTextArea
          value={notesText}
          setValue={setNotesText}
          dataTestId="task-notes-textarea"
          disabled={disabledMode}
          ariaLabel="Task notes"
          rows={6}
          className="text-area-full-width"
        />
      </div>
      <CustomInfo
        content="These notes will be visible to internal users only."
        variant="secondary"
        dataTestId="notes-info-message"
      />
    </div>
  );

  const renderSubmissionContent = () => {
    if (isTaskDetailsLoading || (!taskDetail?.formUrl && !taskDetail?.formType)) {
      return <Loading />;
    }

    if (taskDetail?.formType === "bundle" && selectedForms?.length) {
      return (
        <div
          className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border pb-0 ${
            disabledMode ? "disabled-mode" : "bg-white"
          }`}
        >
          <BundleTaskForm
            bundleId={taskDetail?.formId}
            currentUser={currentUser}
            onFormSubmit={onFormSubmitCallback}
            bundleFormData={bundleFormData}
            onCustomEvent={onCustomEventCallBack}
          />
        </div>
      );
    }

    return (
      <div
        className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border pb-0 ${
          disabledMode ? "disabled-mode" : "bg-white"
        }`}
      >
        <TaskForm
          currentUser={currentUser}
          onFormSubmit={onFormSubmitCallback}
          onCustomEvent={onCustomEventCallBack}
          isApprovalTask={isApprovalTask}
        />
      </div>
    );
  };

  const renderModalContent = () => {
    if (modalViewType === "history") {
      return renderHistoryContent();
    }
    if (modalViewType === "notes") {
      return renderNotesContent();
    }
    return renderSubmissionContent();
  };

  return (
    <ReusableLargeModal
      show={show}
      onClose={onClose}
      title={taskDetail?.applicationId}
      headerControl={isApprovalTask && headerStatusControl}      
      primaryBtnText={isApprovalTask && "Update"}      
      primaryBtnAction={handleUpdateClick}
      primaryBtnDisable={isUpdateButtonDisabled}
      buttonLoading={isBPMTaskDetailLoading}
      secondaryBtnText={isApprovalTask && "Cancel"}      
      secondaryBtnAction={handleCancel}
      secondaryBtnDisable={isCancelDisabled}
      secondaryBtnLoading={isCancelLoading}
      subtitle={
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex gap-2">
            <V8CustomButton
              label={t("Submission")}
              onClick={onSubmissionClick}
              className="mr-2"
              dataTestId="modal-submission-button"
              selected={modalViewType === "submission"}
            />
            {isApprovalTask && <V8CustomButton
              label={t("Notes")}
              onClick={onNotesClick}
              className="mr-2"
              dataTestId="modal-notes-button"
              selected={modalViewType === "notes"}
            />}
            <V8CustomButton
              label={t("History")}
              onClick={onHistoryClick}
              dataTestId="modal-history-button"
              selected={modalViewType === "history"}
            />
          </div>
          <div className="d-flex gap-2 align-items-center ms-auto">
            <div className="task-assignee-wrapper">
              <TaskAssigneeManager task={selectedTask} isFromTaskDetails={true} />
            </div>
          </div>
        </div>
      }
      content={renderModalContent()}
    />
  );
};

export default TaskDetailsModal;
