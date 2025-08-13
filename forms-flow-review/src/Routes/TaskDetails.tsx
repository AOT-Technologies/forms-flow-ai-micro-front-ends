import React, { useEffect, useCallback, useState } from "react";
import { Card } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { textTruncate } from "../helper/helper.js";
import {
  getBPMTaskDetail,
  getBPMGroups,
  onBPMTaskFormSubmit,
  getCustomSubmission,
  getApplicationHistory,
} from "../api/services/bpmTaskServices";
import {
  getForm,
  getSubmission,
  Formio,
  resetSubmission,
} from "@aot-technologies/formio-react";
import { BackToPrevIcon, CustomButton } from "@formsflow/components";
import {
  getFormIdSubmissionIdFromURL,
  getFormUrlWithFormIdSubmissionId,
} from "../api/services/formatterService";
import {
  resetFormData,
  setFormSubmissionLoading,
  setBPMTaskDetailLoader,
  setSelectedTaskID,
  setAppHistoryLoading,
  setTaskDetailsLoading,
  } from "../actions/taskActions";
import { getFormioRoleIds } from "../api/services/userSrvices";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
  CUSTOM_EVENT_TYPE,
  MULTITENANCY_ENABLED,
} from "../constants/index";
import TaskForm from "../components/TaskForm";
import { TaskHistoryModal } from "../components/TaskHistory";
import { push } from "connected-react-router";
import { userRoles } from "../helper/permissions";
import TaskAssigneeManager from "../components/Assigne/Assigne";

const TaskDetails = () => {
  const { t } = useTranslation();
  const { taskId } = useParams();
  const dispatch = useDispatch();
  const {viewTaskHistory} = userRoles();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  // Redux State Selectors
  const tenantKey = useSelector(
    (state: any) => state.tenants?.tenantData?.key
  );
  const task = useSelector((state: any) => state.task.taskDetail);
  const bpmTaskId = useSelector((state: any) => state.task.taskId);
  const taskFormSubmissionReload = useSelector(
    (state: any) => state.task.taskFormSubmissionReload
  );

  const currentUser = JSON.parse(
    localStorage.getItem("UserDetails") || "{}"
  )?.preferred_username;
  const taskAssignee = useSelector(
    (state: any) => state?.task?.taskAssignee
  );
  console.log("taskAssignee",taskAssignee,'currentUser',currentUser);
  const disabledMode = taskAssignee !== currentUser;
  // Redirection URL
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  //disable the form if task not assigned to himself

    //test to see task assignee data is captured
    useEffect(() => {
      console.log("task test",task);
    }, [task]);


  // Set selected task ID on mount
  useEffect(() => {
    if (taskId) dispatch(setSelectedTaskID(taskId));
  }, [taskId, dispatch]);

  // Load BPM task details and groups
  useEffect(() => {
    if (bpmTaskId) {
      dispatch(setBPMTaskDetailLoader(true));
      dispatch(getBPMTaskDetail(bpmTaskId));
      dispatch(setTaskDetailsLoading(true));
      dispatch(getBPMGroups(bpmTaskId));
    }
    return () => Formio.clearCache();
  }, [bpmTaskId, dispatch]);

  // Flattened retry logic for token errors
  const handleFormRetry = (fetchForm: () => void) => (retryErr: any) => {
    if (!retryErr) {
      fetchForm();
    } else {
      dispatch(setFormSubmissionLoading(false));
    }
  };

  // Handles submission fetching after form is successfully fetched
  const handleSuccessfulFormFetch = (formId: string, submissionId: string) => {
    if (CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE) {
      dispatch(getCustomSubmission(submissionId, formId));
    } else {
      dispatch(getSubmission("submission", submissionId, formId));
    }
    dispatch(setFormSubmissionLoading(false));
  };

  // Load form and submission
  const getFormSubmissionData = useCallback(
    (formUrl) => {
      const { formId, submissionId } = getFormIdSubmissionIdFromURL(formUrl);
      Formio.clearCache();
      dispatch(resetFormData("form"));

      const fetchForm = () => {
        dispatch(
          //getform takes the project url from fromsflow-review.tsx file internally.
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

  useEffect(() => {
    if (task?.formUrl) {
      getFormSubmissionData(task.formUrl);
    }
  }, [task?.formUrl, getFormSubmissionData]);

  useEffect(() => {
    if (task?.formUrl && taskFormSubmissionReload) {
      dispatch(setFormSubmissionLoading(false));
      getFormSubmissionData(task.formUrl);
    }
  }, [
    task?.formUrl,
    taskFormSubmissionReload,
    getFormSubmissionData,
    dispatch,
  ]);

  // Form submission callback
  const onFormSubmitCallback = (actionType = "") => {
    if (!bpmTaskId || !task?.formUrl) return;

    dispatch(setBPMTaskDetailLoader(true));
    const { formId, submissionId } = getFormIdSubmissionIdFromURL(task.formUrl);
    const formUrl = getFormUrlWithFormIdSubmissionId(formId, submissionId);
    const webFormUrl = `${window.location.origin}/form/${formId}/submission/${submissionId}`;
    const payload = {
      variables:{
        formUrl:{value:formUrl},
        applicationId:{value:task.applicationId},
        webFormUrl:{value:webFormUrl},
        action:{value:actionType}
      }
    }
    dispatch(
      onBPMTaskFormSubmit(
        bpmTaskId,payload,
        () => dispatch(setBPMTaskDetailLoader(false))
      )
    );
    handleBack();
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

  const handleBack = () => {
    Formio.clearCache();
    dispatch(setSelectedTaskID(null));
    dispatch(resetSubmission("submission"));
    dispatch(push(`${redirectUrl}task`));
  };

  //Application History
  const handleHistory = () => {
    dispatch(setAppHistoryLoading(true));
    dispatch(getApplicationHistory(task?.applicationId));
    setShowHistoryModal(true);
  };
  // Main Renderor
  return (
    <>
      {showHistoryModal && (
        <TaskHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
      
      <div className="nav-bar">
        <div className="icon-back" onClick={handleBack}>
          <BackToPrevIcon data-testid="back-to-prev"/>
        </div>

        <div className="description">
          <p className="text-main">
            {textTruncate(75, 75, task?.name)}
          </p>
        </div>
        {/* Right Section: TaskAssigneeManager + History Button */}
        {/* <TaskAssigneeManager task={task} isFromTaskDetails={true} /> */}
        <div className="buttons">
          <TaskAssigneeManager task={task} isFromTaskDetails={true} />

          {viewTaskHistory && <CustomButton
            label={t("History")}
            onClick={handleHistory}
            dataTestId="handle-task-details-history-testid"
            ariaLabel={t("Submission History Button")}
            dark
          />
          }
        </div>
      </div>


      <div className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border ${disabledMode ? "disabled-mode":"bg-white"}`}>
        <TaskForm
          currentUser={currentUser}
          onFormSubmit={onFormSubmitCallback}
          onCustomEvent={onCustomEventCallBack}
        />
      </div>
    </>
  );
};

TaskDetails.propTypes = {};

export default TaskDetails;
