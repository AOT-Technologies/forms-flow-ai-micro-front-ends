import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  DownloadPDFButton,
  BreadCrumbs,
  BreadcrumbVariant,
  V8CustomButton,
  ProcessDiagram,
  ReusableTable,
  Alert,
  AlertVariant,
  CustomProgressBar,
  useProgressBar,
  FormViewModal
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
  const { appHistory, isHistoryListLoading } = useSelector(
    useMemo(
      () => (state: any) => ({
        appHistory: state.taskAppHistory.appHistory,
        isHistoryListLoading: state.taskAppHistory.isHistoryListLoading,
      }),
      []
    )
  );
  const [historyPaginationModel, setHistoryPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [bundleFormData, setBundleFormData] = useState<{ formId: string; submissionId: string }>({
    formId: "",
    submissionId: "",
  });

  const [formType, setFormType] = useState('');
  const [selectedTab, setSelectedTab] = useState({ id: "form", label: t("Form") });
  const [showExportAlert, setShowExportAlert] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedSubmissionData, setSelectedSubmissionData] = useState<any>(null);

  const { progress: publishProgress, start, complete, reset } = useProgressBar({
    increment: 10,
    interval: 150,
    useCap: true,
    capProgress: 90,
  });


  // Callbacks for DownloadPDFButton
  const handlePreDownload = useCallback(() => {
    setShowExportAlert(true);
    reset();
    start();
  }, [reset, start, setShowExportAlert]);

  const handlePostDownload = useCallback(() => {
    complete();
    setShowExportAlert(false);
  }, [complete, setShowExportAlert]);


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

  // Define viewSubmission before useMemo hooks (must be before early return)
  const viewSubmission = useCallback((data: any) => {
    const { formId, submissionId } = data;
    setSelectedSubmissionData(data);
    setShowFormModal(true);
    
    // Load form and submission data
    if (formId && submissionId) {
      Formio.clearCache();
      dispatch(resetFormData("form"));
      dispatch(getForm("form", formId));
      if (CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE) {
        dispatch(getCustomSubmission(submissionId, formId));
      } else {
        dispatch(getSubmission("submission", submissionId, formId));
      }
    }
  }, [dispatch]);

  // Prepare history table data - must be before early return (Rules of Hooks)
  const historyColumns = useMemo(
    () => [
      {
        field: "status",
        headerName: t("Status"),
        flex: 2,
        sortable: false,
        cellClassName: 'action-cell-stretch',
        renderCell: (params: any) => {
          const entry = params.row;
          return (
              <span className="status-text">
                {entry.applicationStatus || "N/A"}
              </span>
          );
        },
      },
      {
        field: "submittedBy",
        headerName: t("Submitted By"),
        flex: 2,
        sortable: false
      },
      {
        field: "created",
        headerName: t("Created On"),
        flex: 2,
        renderCell: (params: any) => HelperServices.getLocaldate(params.value), 
        sortable: false 
      },
      {
        field: "actions",
         renderHeader: () => (
          <V8CustomButton
            variant="secondary"
            onClick={() => dispatch(fetchApplicationAuditHistoryList(applicationId))}
            dataTestId="submission-history-refresh-button"
            label={t("Refresh")}
            ariaLabel={t("Refresh History Table")}
          />
        ),
        headerName: "",
        sortable: false,
        filterable: false,
  
        headerClassName: "sticky-column-header last-column",
        cellClassName: "sticky-column-cell",
  
        width: 100,
        renderCell: (params: any) => (
          <V8CustomButton
            label={t("View")}
            dataTestId="task-view-button"
            variant="secondary"
            onClick={() => viewSubmission(params.row)}
          />
        ),
      },
    ],
    [t, viewSubmission, dispatch, applicationId]
  );

  const historyRows = useMemo(() => {
    return (appHistory || []).map((entry: any, index: number) => ({
      id: entry.submissionId ?? `row-${index}`, // Unique and stable id for data grid
      status: entry.submissionId || index,
      submittedBy: entry.submittedBy || "N/A",
      created: entry.created || "",
      ...entry,
    }));
  }, [appHistory]);

  if (isApplicationDetailLoading) {
    return <Loading />;
  }

  const backToSubmissionList = () => {
    dispatch(push(`${redirectUrl}submissions`));
  };

  const breadcrumbItems = [
    { id: "analyze", label: t("Analyze") },
    { id: "submissions", label: t("Submissions") },
    { id: "submission", label: t("Submission") },
  ];

  const handleBreadcrumbClick = (item: any) => {
    if (item.id === "analyze" || item.id === "submissions") {
      backToSubmissionList();
    }
  };

  const tabConfig = [
    {
      label: t("Form"),
      id: "form",
    },
    {
      label: t("Flow"),
      id: "flow",
    },
    {
      label: t("History"),
      id: "history",
    }
  ];


  const handlePaginationModelChange = ({ page, pageSize }: any) => {
    setHistoryPaginationModel({ page, pageSize });
    dispatch(fetchApplicationAuditHistoryList(applicationId, page, pageSize));
  };


  const renderTabContent = () => {
    if (selectedTab?.id === "form") {
      return (!formTypeCheckLoading &&
        formType === "bundle") ? (
          <BundleSubmissionView bundleFormData={bundleFormData} />
        ) : (
          <View page="application-detail" />
        );
    }
    if (selectedTab?.id === "flow" && analyze_submissions_view_history) {
      return (
        <div>
          <ProcessDiagram
            diagramXML={diagramXML ?? ""}
            activityId={markers?.[0]?.activityId ?? ""}
            showDiagramTools={false}
            isProcessDiagramLoading={isDiagramLoading}
          />
        </div>
      );
    }
    if (selectedTab?.id === "history" && analyze_submissions_view_history) {
      return (
        <div>
          <ReusableTable
            columns={historyColumns}
            rows={historyRows}
            loading={isHistoryListLoading}
            noRowsLabel={t("No submission history found")}
            paginationModel={historyPaginationModel}
            onPaginationModelChange={handlePaginationModelChange}
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
            }}
            disableColumnResize={true}
            disableColumnMenu={true}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="toast-section">
              <Alert
                message="Exporting PDF"
                variant={AlertVariant.DEFAULT}
                isShowing={showExportAlert}
                rightContent={<CustomProgressBar progress={publishProgress} color="default"/>}
              />
            </div>
      {/* Header Section */}
        <div className="header-section-1">
          <div className="section-seperation-left d-block">
              <BreadCrumbs 
                items={breadcrumbItems}
                variant={BreadcrumbVariant.MINIMIZED}
                underline
                onBreadcrumbClick={handleBreadcrumbClick} 
              /> 
              {/* <h4>{applicationId}</h4> */}
          </div>
      </div>
      <div className="header-section-2">
          <div className="section-seperation-left">
              {tabConfig.map((tab) => (
                <V8CustomButton
                  key={tab.id}
                  label={tab.label}
                  selected={selectedTab?.id === tab.id}
                  onClick={() => setSelectedTab(tab)}
                  disabled={
                    ((tab.id === "flow" && !analyze_process_view) || (tab.id === "history" && !analyze_submissions_view_history))
                  }
                />
              ))}
          </div>
          {(applicationDetail?.formId && applicationDetail?.submissionId && selectedTab?.id != "history") && (
          <div className="section-seperation-right">
            <DownloadPDFButton
              form_id={applicationDetail?.formId}
              submission_id={applicationDetail?.submissionId}
              title={applicationDetail?.applicationName}
              onPreDownload={handlePreDownload}
              onPostDownload={handlePostDownload}
              disabled={selectedTab?.id === "flow"}
            />
          </div>
            )}
        </div>
        <div className="body-section">
          {renderTabContent()}
        </div>
        
        {/* Form View Modal */}
        <FormViewModal
          show={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedSubmissionData(null);
          }}
          title={selectedSubmissionData?.created ? HelperServices.getLocaldate(selectedSubmissionData.created) : ""}
        >
        {selectedSubmissionData && (
            <View page="application-detail" />
          )}
        </FormViewModal>
    </div>
  );
});

export default ViewApplication;