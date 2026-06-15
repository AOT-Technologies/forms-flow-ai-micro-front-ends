import {
  getRoute,
  getRedirectUrl,
  getOrigin,
} from "../routerServices/routerConstants";

const navigateTo = (navigate: (path: string) => void, baseUrl: string) => {
  navigate(baseUrl);
};

/** @param navigate - React Router v6 navigate function from useNavigate(), NOT a v5 history object */
const navigateWithHistory = (navigate: (path: string) => void, url: string) => {
  navigate(url);
};

const syncRouterPath = (navigate: (path: string) => void, pathname: string) => {
  navigate(pathname);
};

/* ---------------------------  Designer Routes --------------------------- */

const navigateToDesignFormsListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).FORMFLOW);
};

const navigateToDesignFormCreate = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORMFLOW}/create`);
};

const navigateToDesignFormBuild = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORMFLOW}/build`);
};

const navigateToDesignFormEdit = (navigate: (path: string) => void, tenantId: string, formId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORMFLOW}/${formId}/edit`);
};

const navigateToDesignFormEditWithParams = (
  navigate: (path: string) => void,
  tenantId: string,
  formId: string,
  queryParams = {}
) => {
  const params = new URLSearchParams(queryParams).toString();
  const url = params
    ? `${getRoute(tenantId).FORMFLOW}/${formId}/edit?${params}`
    : `${getRoute(tenantId).FORMFLOW}/${formId}/edit`;
  navigateTo(navigate, url);
};

const navigateToDesignFormPath = (navigate: (path: string) => void, tenantId: string, formId: string, path: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORMFLOW}/${formId}/${path}`);
};

/* ---------------------------  Client Submission Routes --------------------------- */

const navigateToSubmitFormsApplication = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).APPLICATION);
};

const navigateToSubmitFormsDraft = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).DRAFT);
};

const navigateToSubmitFormsListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).FORM);
};

// new navigations for client journey
const navigateToFormEntries = (navigate: (path: string) => void, tenantId: string, formId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORM}/${formId}/entries`);
};

const navigateToNewSubmission = (navigate: (path: string) => void, tenantId: string, formId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).FORM}/${formId}`);
};

const navigateToDraftEdit = (navigate: (path: string) => void, tenantId: string, formId: string, applicationId: string) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).FORM}/${formId}/draft/${applicationId}/edit`
  );
};

const navigateToViewSubmission = (
  navigate: (path: string) => void,
  tenantId: string,
  formId: string,
  applicationId: string
) => {
  navigate(
    `${getRoute(tenantId).APPLICATION}/${applicationId}?from=formEntries`
  );
};

const navigateToResubmit = (navigate: (path: string) => void, tenantId: string, formId: string, submissionId: string) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).FORM}/${formId}/submissions/${submissionId}/resubmit`
  );
};

const navigateToSubmissionView = (navigate: (path: string) => void, tenantId: string, formId: string, submissionId: string) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).FORM}/${formId}/submission/${submissionId}`
  );
};

/* ---------------------------  Application Routes --------------------------- */

const navigateToApplicationDetail = (navigate: (path: string) => void, tenantId: string, applicationId) => {
  navigateTo(navigate, `${getRoute(tenantId).APPLICATION}/${applicationId}`);
};

/* ---------------------------  Draft Routes --------------------------- */

const navigateToDraftDetail = (navigate: (path: string) => void, tenantId: string, draftId) => {
  navigateTo(navigate, `${getRoute(tenantId).DRAFT}/${draftId}`);
};

/* ---------------------------  Task Routes --------------------------- */

const navigateToTaskListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).TASK);
};

const navigateToTaskDetail = (navigate: (path: string) => void, tenantId: string, taskId) => {
  navigateTo(navigate, `${getRoute(tenantId).TASK}/${taskId}`);
};

const navigateToTaskOldListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).TASK_OLD}/`);
};

const navigateToTaskOldDetail = (navigate: (path: string) => void, tenantId: string, taskId) => {
  navigateTo(navigate, `${getRoute(tenantId).TASK_OLD}/${taskId}`);
};

/* ---------------------------  Process Creation Routes --------------------------- */

const navigateToSubflowBuild = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).SUBFLOW}/build`);
};

const navigateToDecisionTableBuild = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).DECISIONTABLE}/build`);
};

const navigateToSubflowCreate = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).SUBFLOW}/create`);
};

const navigateToDecisionTableCreate = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).DECISIONTABLE}/create`);
};

const navigateToSubflowEdit = (navigate: (path: string) => void, tenantId: string, processKey) => {
  navigateTo(navigate, `${getRoute(tenantId).SUBFLOW}/edit/${processKey}`);
};

const navigateToDecisionTableEdit = (navigate: (path: string) => void, tenantId: string, processKey) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).DECISIONTABLE}/edit/${processKey}`
  );
};

const navigateToSubflowListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).SUBFLOW);
};

const navigateToDecisionTableListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).DECISIONTABLE);
};

const navigateToProcessListing = (navigate: (path: string) => void, tenantId: string, isBPMN) => {
  if (isBPMN) {
    navigateToSubflowListing(navigate, tenantId);
  } else {
    navigateToDecisionTableListing(navigate, tenantId);
  }
};

const navigateToProcessCreate = (navigate: (path: string) => void, tenantId: string, processRoute) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).FORMFLOW.replace(
      "/formflow",
      ""
    )}${processRoute}/create`
  );
};

const navigateToProcessEditWithParams = (
  navigate: (path: string) => void,
  tenantId: string,
  processRoute: string,
  processKey: string,
  queryParams = {}
) => {
  const params = new URLSearchParams(queryParams).toString();
  const baseRoute = getRoute(tenantId).FORMFLOW.replace("/formflow", "");
  const url = params
    ? `${baseRoute}${processRoute}/edit/${processKey}?${params}`
    : `${baseRoute}${processRoute}/edit/${processKey}`;
  navigateTo(navigate, url);
};

const navigateToProcessRoute = (navigate: (path: string) => void, tenantId: string, processRoute) => {
  const baseRoute = getRoute(tenantId).FORMFLOW.replace("/formflow", "");
  navigateTo(navigate, `${baseRoute}${processRoute}`);
};

const navigateToImportedProcess = (navigate: (path: string) => void, tenantId: string, baseUrl, processKey) => {
  const baseRoute = getRoute(tenantId).FORMFLOW.replace("/formflow", "");
  navigateTo(navigate, `${baseRoute}${baseUrl}${processKey}`);
};

const navigateToProcessEdit = (navigate: (path: string) => void, tenantId: string, viewType, processKey) => {
  const redirectUrl = getRedirectUrl(tenantId);
  navigateTo(navigate, `${redirectUrl}${viewType}/edit/${processKey}`);
};

const navigateToTemplatePreview = (navigate: (path: string) => void, tenantId: string, formId: string) => {
  const redirectUrl = getRedirectUrl(tenantId);
  navigateTo(navigate, `${redirectUrl}formflow/${formId}/view-edit/`);
};

const navigateToSubmissionViewDirect = (navigate: (path: string) => void, formId, submissionId) => {
  navigateTo(navigate, `/form/${formId}/submission/${submissionId}`);
};

/* ---------------------------  Error Routes --------------------------- */

const navigateToNotFound = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).NOTFOUND);
};

const navigateToNotFoundAbsolute = (navigate: (path: string) => void) => {
  navigateTo(navigate, "/404");
};

/* ---------------------------  EE Specific Routes --------------------------- */

const navigateToDesignBundleCreate = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, `${getRoute(tenantId).BUNDLEFLOW}/create`);
};

const navigateToDesignBundleListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).BUNDLEFLOW);
};

const navigateToDesignBundleEdit = (navigate: (path: string) => void, tenantId: string, bundleId) => {
  navigateTo(navigate, `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/edit`);
};

const navigateToDesignBundleViewEdit = (navigate: (path: string) => void, tenantId: string, bundleId) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/view-edit`
  );
};

const navigateToDesignBundlePath = (navigate: (path: string) => void, tenantId: string, bundleId, path) => {
  navigateTo(navigate, `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/${path}`);
};

const navigateToBundleEntries = (navigate: (path: string) => void, tenantId: string, bundleId) => {
  navigateTo(navigate, `${getRoute(tenantId).BUNDLE}/${bundleId}/entries`);
};

const navigateToNewBundleSubmission = (navigate: (path: string) => void, tenantId: string, bundleId) => {
  navigateTo(navigate, `${getRoute(tenantId).BUNDLE}/${bundleId}`);
};

const navigateToViewBundleSubmission = (
  navigate: (path: string) => void,
  tenantId,
  bundleId,
  submissionId,
  fromBundleEntries = false
) => {
  const baseUrl = `${
    getRoute(tenantId).BUNDLE
  }/${bundleId}/submission/${submissionId}`;
  const url = fromBundleEntries ? `${baseUrl}?from=bundleEntries` : baseUrl;
  navigateTo(navigate, url);
};

const navigateToViewBundleReSubmission = (
  navigate: (path: string) => void,
  tenantId,
  bundleId,
  submissionId
) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).BUNDLE}/${bundleId}/submission/${submissionId}/edit`
  );
};

/* ---------------------------  Multi-tenant Routes --------------------------- */

const navigateToTenant = (navigate: (path: string) => void, username) => {
  navigateTo(navigate, `/tenant/${username}`);
};

/* ---------------------------  Generic/Custom Route --------------------------- */

const navigateToPath = (navigate: (path: string) => void, path) => {
  navigateTo(navigate, path);
};

/* ---------------------------  Review/Task Routes --------------------------- */

const navigateToTaskListingFromReview = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).TASK);
};

const navigateToTaskListingFromReviewWithHistory = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, getRoute(tenantId).TASK);
};

/* ---------------------------  Submissions Routes --------------------------- */

const navigateToSubmissionsListing = (navigate: (path: string) => void, tenantId: string) => {
  navigateTo(navigate, getRoute(tenantId).ANALYZESUBMISSIONS);
};

const navigateToSubmissionDetail = (navigate: (path: string) => void, tenantId: string, submissionId) => {
  navigateTo(
    navigate,
    `${getRoute(tenantId).ANALYZESUBMISSIONS}/${submissionId}`
  );
};

/* ---------------------------  Admin Routes --------------------------- */

const navigateToAdminRoles = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).ADMIN}/roles`);
};

const navigateToAdminUsers = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).ADMIN}/users`);
};

const navigateToAdminDashboard = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).ADMIN}/dashboard`);
};

const navigateToAdminOrganization = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).ADMIN}/organization`);
};

const navigateToAdminPlans = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).ADMIN}/plans`);
};

/**
 * Absolute URL to admin organization (subscription) — e.g. Stripe Billing Portal return_url.
 * Matches the path used by navigateToAdminOrganization; respects multitenant vs single-tenant base.
 */
const getAdminOrganizationReturnUrl = (tenantId) => {
  return `${getOrigin()}${getRoute(tenantId).ADMIN}/organization`;
};

/* ---------------------------  Integration Routes --------------------------- */

const navigateToIntegrationRecipes = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, `${getRoute(tenantId).INTEGRETIONS}`);
};

const navigateToIntegrationConnectedApps = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(
    navigate,
    `${getRoute(tenantId).INTEGRETIONS.replace("/recipes", "/connected-apps")}`
  );
};

const navigateToIntegrationLibrary = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(
    navigate,
    `${getRoute(tenantId).INTEGRETIONS.replace("/recipes", "/library")}`
  );
};

/* ---------------------------  Navigation Routes --------------------------- */

const navigateToBaseUrl = (navigate: (path: string) => void, tenantId: string) => {
  navigateWithHistory(navigate, getRedirectUrl(tenantId));
};

/* ---------------------------  EE Specific Routes end --------------------------- */

export {
  // Designer Routes
  navigateToDesignFormsListing,
  navigateToDesignFormCreate,
  navigateToDesignFormBuild,
  navigateToDesignFormEdit,
  navigateToDesignFormEditWithParams,
  navigateToDesignFormPath,

  // Client Submission Routes
  navigateToSubmitFormsApplication,
  navigateToSubmitFormsDraft,
  navigateToSubmitFormsListing,
  navigateToFormEntries,
  navigateToNewSubmission,
  navigateToDraftEdit,
  navigateToViewSubmission,
  navigateToResubmit,
  navigateToSubmissionView,

  // Application Routes
  navigateToApplicationDetail,

  // Draft Routes
  navigateToDraftDetail,

  // Task Routes
  navigateToTaskListing,
  navigateToTaskDetail,
  navigateToTaskOldListing,
  navigateToTaskOldDetail,

  // Process Routes
  navigateToSubflowBuild,
  navigateToDecisionTableBuild,
  navigateToSubflowCreate,
  navigateToDecisionTableCreate,
  navigateToSubflowEdit,
  navigateToDecisionTableEdit,
  navigateToSubflowListing,
  navigateToDecisionTableListing,
  navigateToProcessListing,
  navigateToProcessCreate,
  navigateToProcessEditWithParams,
  navigateToProcessRoute,
  navigateToImportedProcess,
  navigateToProcessEdit, // NEW

  // Error Routes
  navigateToNotFound,
  navigateToNotFoundAbsolute,

  // EE Specific Routes
  navigateToDesignBundleCreate,
  navigateToDesignBundleListing,
  navigateToDesignBundleEdit,
  navigateToDesignBundleViewEdit,
  navigateToDesignBundlePath,
  navigateToNewBundleSubmission,
  navigateToBundleEntries,
  navigateToViewBundleSubmission,
  navigateToViewBundleReSubmission,

  // Multi-tenant Routes
  navigateToTenant,

  // Generic
  navigateToPath,

  // Review/Task Routes
  navigateToTaskListingFromReview,
  navigateToTaskListingFromReviewWithHistory,

  // Submissions Routes
  navigateToSubmissionsListing,
  navigateToSubmissionDetail,

  // Admin Routes
  navigateToAdminRoles,
  navigateToAdminUsers,
  navigateToAdminDashboard,
  navigateToAdminOrganization,
  navigateToAdminPlans,
  getAdminOrganizationReturnUrl,

  // Integration Routes
  navigateToIntegrationRecipes,
  navigateToIntegrationConnectedApps,
  navigateToIntegrationLibrary,

  // Navigation Routes
  navigateToBaseUrl,

  // NEW EXPORTS
  navigateWithHistory,
  syncRouterPath,
  navigateToTemplatePreview,
  navigateToSubmissionViewDirect,
};
