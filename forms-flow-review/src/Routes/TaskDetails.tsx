import { useEffect, useCallback, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { textTruncate } from "../helper/helper.js";
import {fetchTaskVariables, executeRule} from "../api/services/filterServices"
import BundleTaskForm from "../components/BundleTaskForm";
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
import { BackToPrevIcon, CustomButton, BreadCrumbs } from "@formsflow/components";
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
  setBundleSelectedForms,
  setBundleLoading,
  setBundleErrors,
  setTaskFormSubmissionReload,
  } from "../actions/taskActions";
import { getFormioRoleIds } from "../api/services/userSrvices";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
  CUSTOM_EVENT_TYPE,
} from "../constants/index";
import TaskForm from "../components/TaskForm";
import { TaskHistoryModal } from "../components/TaskHistory";
import { navigateToTaskListingFromReview, getRedirectUrl } from "@formsflow/service";
import { userRoles } from "../helper/permissions";
import TaskAssigneeManager from "../components/Assigne/Assigne";

const TaskDetails = () => {
  const { t } = useTranslation();
  const { taskId } = useParams();
  const dispatch = useDispatch();
  const {viewTaskHistory} = userRoles();
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [bundleFormData, setBundleFormData] = useState<{ formId: string; submissionId: string }>({
    formId: "",
    submissionId: "",
  });
  
  // Redux State Selectors
  const tenantKeyFromState = useSelector(
    (state: any) => state.tenants?.tenantData?.key
  );
  // Conditionally select tenantKey from state or localStorage
  const tenantKey = tenantKeyFromState || localStorage.getItem("tenantKey");
  const task = useSelector((state: any) => state.task.taskDetail);
  const bpmTaskId = useSelector((state: any) => state.task.taskId);
  const taskFormSubmissionReload = useSelector(
    (state: any) => state.task.taskFormSubmissionReload
  );
  const selectedForms = useSelector((state: any) => state.task.selectedForms || []);
  const [bundleName, setBundleName] = useState('');

  const currentUser = JSON.parse(
    localStorage.getItem("UserDetails") || "{}"
  )?.preferred_username;
  const taskAssignee = useSelector(
    (state: any) => state?.task?.taskAssignee
  );
  const disabledMode = taskAssignee !== currentUser;
  // Redirection URL
  const redirectUrl = getRedirectUrl(tenantKey);

  // Track previous assignee to detect changes
  const previousAssignee = useRef<string | undefined>(taskAssignee);

  // Watch for assignee changes and trigger form reload when assignee changes
  useEffect(() => {
    // Only reload form if assignee actually changed and we have a form URL
    if (
      previousAssignee.current !== taskAssignee &&
      taskAssignee !== undefined &&
      previousAssignee.current !== undefined &&
      task?.formUrl &&
      task?.formType !== "bundle"
    ) {
      previousAssignee.current = taskAssignee;
      // Trigger form reload by dispatching the reload action
      dispatch(setTaskFormSubmissionReload(true));
      // Reset the flag after a short delay to allow the effect to trigger again if needed
      setTimeout(() => {
        dispatch(setTaskFormSubmissionReload(false));
      }, 100);
    } else if (taskAssignee !== undefined) {
      // Update ref even if we don't reload (for initial load)
      previousAssignee.current = taskAssignee;
    }
  }, [taskAssignee, task?.formUrl, task?.formType, dispatch]);

  //disable the form if task not assigned to himself

    //test to see task assignee data is captured
    useEffect(() => {
      console.log("task test",task);
    }, [task]);

    useEffect(() => {
      if (task?.formType === "bundle") {
        Formio.clearCache();
        dispatch(resetFormData("form"));
        setBundleLoading(false);
    
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
                setBundleErrors(err);
              })
              .finally(() => {
                setBundleLoading(false);
              });
          });
    
        return () => {
          dispatch(setBundleSelectedForms([]));
        };
      }
    }, [task?.formType, task?.formId]);
    

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
    if (task?.formUrl && task?.formType !== "bundle") {
      getFormSubmissionData(task.formUrl);
    }
  }, [task?.formUrl, task?.formType, getFormSubmissionData]);
 
  useEffect(() => {
    if (task?.formUrl && taskFormSubmissionReload && task?.formType !== "bundle") {
      dispatch(setFormSubmissionLoading(true));
      getFormSubmissionData(task.formUrl);
    }
  }, [
    task?.formUrl,
    task?.formType,
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
    navigateToTaskListingFromReview(dispatch, tenantKey);
  };

  //Application History
  const handleHistory = () => {
    dispatch(setAppHistoryLoading(true));
    dispatch(getApplicationHistory(task?.applicationId));
    setShowHistoryModal(true);
  };
  // Breadcrumb configuration
  const breadcrumbItems = [
    { label: t("Tasks"), id: "tasks" },
    { label: t("Submission"), id: "submission" }
  ];

  const handleBreadcrumbClick = (item: { label: string; id?: string }) => {
    if (item.id === "tasks") {
      handleBack();
    }
  };

  // Main Renderor
  return (
    <>
      {showHistoryModal && (
        <TaskHistoryModal
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          task={task}
        />
      )}
      
      <div className="nav-bar">
        <div style={{ marginBottom: "10px" }}>
          <BreadCrumbs
            items={breadcrumbItems}
            variant="default"
            onBreadcrumbClick={handleBreadcrumbClick}
            dataTestId="task-details-breadcrumbs"
          />
        </div>
        <div className="icon-back" onClick={handleBack}>
          <BackToPrevIcon data-testid="back-to-prev"/>
        </div>

        <div className="description">
          <p className="text-main">
            {textTruncate(75, 75, task?.formType === "bundle" ? bundleName : task?.name)}
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

      {task?.formType === "bundle" && selectedForms?.length ? <BundleTaskForm
         bundleId={task?.formId}
         currentUser={currentUser}
         onFormSubmit={onFormSubmitCallback}
         bundleFormData={bundleFormData}
         onCustomEvent={onCustomEventCallBack}
       /> : 
      <div className={`scrollable-overview-with-header bg-white ps-3 pe-3 m-0 form-border ${disabledMode ? "disabled-mode":"bg-white"}`}>
       <TaskForm
       currentUser={currentUser}
       onFormSubmit={onFormSubmitCallback}
       onCustomEvent={onCustomEventCallBack}
     /> 
      </div>}
    </>
  );
};

TaskDetails.propTypes = {};

export default TaskDetails;