import { useMemo, useState, useEffect } from "react";
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

interface HistoryPaginationModel {
  page: number;
  pageSize: number;
}

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
  historyPaginationModel: HistoryPaginationModel;
  onHistoryPaginationModelChange: (model: HistoryPaginationModel) => void;
  appHistory: any[];
  statusValue?: string;
  onStatusChange?: (value: string | number) => void;
  onUpdate?: () => void;
  onCancel?: () => void;
  isUpdateDisabled?: boolean;
  isUpdateLoading?: boolean;
  isCancelDisabled?: boolean;
  isCancelLoading?: boolean;
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
  historyPaginationModel,
  onHistoryPaginationModelChange,
  appHistory,
  statusValue,
  onStatusChange,
  onUpdate,
  onCancel,
  isUpdateDisabled,
  isUpdateLoading,
  isCancelDisabled,
  isCancelLoading,
}: TaskDetailsModalProps) => {
  const { t } = useTranslation();
  const [notesText, setNotesText] = useState("");
  const [currentStatusValue, setCurrentStatusValue] = useState<string>("Pending");
  console.log("taskDetail",taskDetail);

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
        id: entry.submissionId || index,
        created: entry.created || "",
        submittedBy: entry.submittedBy || "N/A",
        applicationStatus: entry.applicationStatus || "N/A",
        formId: entry.formId,
        submissionId: entry.submissionId,
        notes: entry.notes || "sample notes lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
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

  const headerStatusControl = (
    <SelectDropdown
      options={statusOptions}
      value={resolvedStatusValue}
      defaultValue="Pending"
      onChange={handleStatusChange}
      dataTestId="modal-status-dropdown"
      ariaLabel="status"
      style={{ width: "7.75rem" }}
    />
  );

  const handleCancel = onCancel ?? onClose;
  const handleUpdate = onUpdate ?? (() => {});

  const renderHistoryContent = () => (
    <ReusableTable
      columns={historyColumns}
      rows={historyRows}
      loading={isAppHistoryLoading}
      noRowsLabel={t("No submission history found")}
      paginationModel={historyPaginationModel}
      onPaginationModelChange={onHistoryPaginationModelChange}
      paginationMode="client"
      sortingMode="client"
      pageSizeOptions={[5, 10, 25, 50]}
      rowHeight={60}
      enableRowExpansion={true}  // ✅ Add this line
      notesField="notes"          // ✅ Add this line (if your field name is different, change it)
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
    <div className="ps-3 pe-3 m-0 pb-3">
      <h5 className="mb-4">{taskDetail?.taskDefinitionKey && `${taskDetail.taskDefinitionKey} Approval`}</h5>
      <div className="mb-3">
        <CustomTextArea
          value={notesText}
          setValue={setNotesText}
          dataTestId="task-notes-textarea"
          disabled={disabledMode}
          ariaLabel="Task notes"
          rows={6}
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
        />
      </div>
    );
  };

  return (
    <ReusableLargeModal
      show={show}
      onClose={onClose}
      title={taskDetail?.applicationId}
      headerControl={taskDetail?.taskDefinitionKey ? headerStatusControl : undefined}
      primaryBtnText="Update"
      primaryBtnAction={handleUpdate}
      primaryBtnDisable={isUpdateButtonDisabled}
      buttonLoading={isUpdateLoading}
      secondaryBtnText="Cancel"
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
            <V8CustomButton
              label={t("Notes")}
              onClick={onNotesClick}
              className="mr-2"
              dataTestId="modal-notes-button"
              selected={modalViewType === "notes"}
            />
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
      content={
        modalViewType === "history"
          ? renderHistoryContent()
          : modalViewType === "notes"
          ? renderNotesContent()
          : renderSubmissionContent()
      }
    />
  );
};

export default TaskDetailsModal;
