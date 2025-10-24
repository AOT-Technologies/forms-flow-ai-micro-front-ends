import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import startCase from "lodash/startCase";
import { Card } from "react-bootstrap";
import {
  CustomButton,
  BackToPrevIcon,
  // FormSubmissionHistoryModal,
  SubmissionHistoryWithViewButton,
  DownloadPDFButton,
} from "@formsflow/components";
import Loading from "./Loading";
import {
  setApplicationDetailLoading,
  setUpdateHistoryLoader,
} from "../actions/applicationActions";
import {
  setBundleSelectedForms,
  setSubmissionBundleErrors,
  setBundleLoading,
  resetFormData,
} from "../actions/bundleSubmissionActions";
import View from "./View";
import { getForm, getSubmission, Formio } from "@aot-technologies/formio-react";
import { useTranslation } from "react-i18next";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
  MULTITENANCY_ENABLED,
} from "../constants/constants";
import {
  getCustomSubmission,
  getRoles,
  getApplicationById,
  fetchApplicationAuditHistoryList
} from "../services/applicationServices";

import {
  fetchFormVariables,
  executeRule,
} from "../api/queryServices/analyzeSubmissionServices"
import { HelperServices } from "@formsflow/service";
import {
  getProcessActivities,
  getProcessDetails,
} from "../services/processServices";
import { push } from "connected-react-router";
import BundleSubmissionView from "../components/BundleSubmissionView";


const ViewApplication = React.memo(() => {
  const { t } = useTranslation();
  const { id: applicationId } = useParams();
  const dispatch = useDispatch();
  const [formTypeCheckLoading, setFormTypeCheckLoading] = useState(true);
  const {
    viewSubmissionHistory,
    analyze_submissions_view_history,
    analyze_process_view,
  } = getRoles();
  const applicationDetail = useSelector(
    (state: any) => state?.applications.applicationDetails
  );
  const isApplicationDetailLoading = useSelector(
    (state: any) => state?.applications.isApplicationDetailLoading
  );
  const tenantId = localStorage.getItem("tenantKey");
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId || state.tenants?.tenantData?.key) || tenantId;
  const [isDiagramLoading, setIsDiagramLoading] = useState(false);
  const [diagramXML, setDiagramXML] = useState("");
  const markers = useSelector(
    (state: any) => state.process?.processActivityList
  );

  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { appHistory, isHistoryListLoading } = useSelector(
    useMemo(
      () => (state: any) => ({
        appHistory: state.taskAppHistory.appHistory,
        isHistoryListLoading: state.taskAppHistory.isHistoryListLoading,
      }),
      []
    )
  );

  const [bundleFormData, setBundleFormData] = useState<{ formId: string; submissionId: string }>({
    formId: "",
    submissionId: "",
  });

  const [formType, setFormType] = useState('');


  useEffect(() => {
    if (applicationId) {
      dispatch(setApplicationDetailLoading(true));
      dispatch(getApplicationById(applicationId));
      dispatch(setUpdateHistoryLoader(true));
    }
  }, [dispatch]);


  useEffect(() => {
    if (!applicationDetail) return;
  
    const formId = applicationDetail.formId;
    const submissionId = applicationDetail.submissionId;
  
    Formio.clearCache();
    dispatch(resetFormData("form"));    
    if (formId) {
    setFormTypeCheckLoading(true);
    setBundleFormData({ formId, submissionId });
    fetchFormVariables(formId)
      .then((res) => {
        const formType = res.data?.formType;
        setFormType(formType);
        setFormTypeCheckLoading(false);
  
        if (formType === "bundle") {
          setBundleLoading(true);
  
          executeRule(
            {
              submissionType: "fetch",
              formId,
              submissionId,
            },
            res.data.id
          )
            .then((res: { data: unknown }) => {
              dispatch(setBundleSelectedForms(res.data));
            })
            .catch((err: unknown) => {
              dispatch(setSubmissionBundleErrors(err));
            })
            .finally(() => {
              setBundleLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch form variables:", err);
        setFormTypeCheckLoading(false);
      });
  }
    // ✅ Cleanup should always be at top-level
    return () => {
      dispatch(setBundleSelectedForms([]));
    };
  }, [applicationDetail, dispatch]);
  
  
  useEffect(() => {
    if (formType === "bundle") return;
    const formId = applicationDetail?.formId;
    const submissionId = applicationDetail?.submissionId;
    if (formId && submissionId) {
      dispatch(getForm("form", formId));
      if (CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE) {
        dispatch(getCustomSubmission(submissionId, formId));
      } else {
        dispatch(getSubmission("submission", submissionId, formId));
      }
    }
  }, [applicationId, applicationDetail, dispatch, formType]);
  useEffect(() => {
    if (
      (viewSubmissionHistory || analyze_submissions_view_history) &&
      applicationId &&
      isHistoryListLoading
    ) {
      dispatch(fetchApplicationAuditHistoryList(applicationId));
    }
  }, [applicationId, isHistoryListLoading, dispatch, applicationDetail]);

  useEffect(() => {
    const fetchProcessDetails = async () => {
      const processKey = applicationDetail?.processKey;
      const processInstanceId = applicationDetail?.processInstanceId;

      if (processKey && processInstanceId && analyze_process_view) {
        try {
          setIsDiagramLoading(true);
          dispatch(getProcessActivities(processInstanceId));
          const res = await getProcessDetails({
            processKey,
            tenant_key: tenantKey,
          });
          setDiagramXML(res?.data?.processData || "");
        } catch (error) {
          console.error("Error fetching process details:", error);
        } finally {
          setIsDiagramLoading(false);
        }
      }
    };

    fetchProcessDetails();
  }, [applicationDetail, tenantKey, analyze_process_view]);

  if (isApplicationDetailLoading) {
    return <Loading />;
  }

  const backToSubmissionList = () => {
    dispatch(push(`${redirectUrl}submissions`));
  };

  return (
    <div>
      {/* Header Section */}
      <Card className="editor-header">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            {/* Left: Back Icon & Application Name */}
            <div className="d-flex align-items-center">
              <BackToPrevIcon onClick={backToSubmissionList} />
              <div className="ms-4 editor-header-text">
                {startCase(applicationDetail?.applicationName)}
              </div>
            </div>

            {/* Center: Submitted On Date - Right Aligned */}
            <div
              data-testid="submissions-details"
              className="d-flex align-items-center white-text ms-auto me-4"
            >
              <span className="status-live"></span>
              {t("Submitted On")}:{" "}
              <span data-testid="submissions-date">
                {HelperServices?.getLocalDateAndTime(
                  applicationDetail?.created
                )}
              </span>
            </div>

            {/* Right: Buttons */}
            <div className="form-submission-button">
              { analyze_submissions_view_history && (
                <CustomButton
                  dark
                  size="table"
                  label={t("History")}
                  dataTestId="handle-submission-history-testid"
                  ariaLabel={t("Submission History Button")}
                  onClick={() => setShowHistoryModal(true)}
                />
              )}
              {applicationDetail?.formId && applicationDetail?.submissionId && (
                formType === "bundle" ? (
                  <DownloadPDFButton
                    form_id={applicationDetail.formId}
                    submission_id={applicationDetail.submissionId}
                    title={applicationDetail?.applicationName}
                    isBundle={true}
                    bundleId={applicationDetail?.formProcessMapperId}
                  />
                ) : (<DownloadPDFButton
                  form_id={applicationDetail.formId}
                  submission_id={applicationDetail.submissionId}
                  title={applicationDetail?.applicationName}
                />  
                )
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* View Application Details */}
      {!formTypeCheckLoading && (
        formType === "bundle" ? (
          <BundleSubmissionView bundleFormData={bundleFormData} />
        ) : (
          <View page="application-detail" />
        )
      )}

      {analyze_submissions_view_history && (
        <SubmissionHistoryWithViewButton
          show={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          redirectUrl={redirectUrl}
          histories={appHistory}
          isHistoryListLoading={isHistoryListLoading}
          title={t("History")}
          showBpmnDiagram={analyze_process_view}
          diagramXML={diagramXML}
          activityId={markers?.[0]?.activityId ?? ""}
          isProcessDiagramLoading={isDiagramLoading}
          darkPrimary
          formType={formType}
        />
      )}
    </div>
  );
});

export default ViewApplication;