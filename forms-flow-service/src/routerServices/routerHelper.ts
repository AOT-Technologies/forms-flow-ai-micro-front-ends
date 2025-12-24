import { push } from "connected-react-router";
import { getRoute, getRedirectUrl } from "../routerServices/routerConstants";

const navigateTo = (dispatch, baseUrl) => {
  dispatch(push(baseUrl));
};  

// ========== NEW FUNCTION TO ADD ==========

/**
 * Navigate using history.push (for react-router-dom)
 * Replaces: history.push(url)
 */
 const navigateWithHistory = (history, url) => {
  history.push(url);
};

/**
 * Sync router path (for BaseRouting.jsx)
 * Replaces: dispatch(push(window.location.pathname))
 */
 const syncRouterPath = (dispatch, pathname) => {
  navigateTo(dispatch, pathname);
};

/* ---------------------------  Designer Routes --------------------------- */

const navigateToDesignFormsListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).FORMFLOW);
};

const navigateToDesignFormCreate = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORMFLOW}/create`);
};

const navigateToDesignFormBuild = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORMFLOW}/build`);
};

const navigateToDesignFormEdit = (dispatch, tenantId, formId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORMFLOW}/${formId}/edit`);
};

const navigateToDesignFormEditWithParams = (dispatch, tenantId, formId, queryParams = {}) => {
  const params = new URLSearchParams(queryParams).toString();
  const url = params 
    ? `${getRoute(tenantId).FORMFLOW}/${formId}/edit?${params}`
    : `${getRoute(tenantId).FORMFLOW}/${formId}/edit`;
  navigateTo(dispatch, url);
};

const navigateToDesignFormPath = (dispatch, tenantId, formId, path) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORMFLOW}/${formId}/${path}`);
};

/* ---------------------------  Client Submission Routes --------------------------- */

const navigateToSubmitFormsApplication = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).APPLICATION);
};

const navigateToSubmitFormsDraft = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).DRAFT);
};

const navigateToSubmitFormsListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).FORM);
};

// new navigations for client journey
const navigateToFormEntries = (dispatch, tenantId, formId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORM}/${formId}/entries`);
};

const navigateToNewSubmission = (dispatch, tenantId, formId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORM}/${formId}`);
};

const navigateToDraftEdit = (dispatch, tenantId, formId, applicationId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORM}/${formId}/draft/${applicationId}/edit`);
};

const navigateToViewSubmission = (
  dispatch,
  tenantId,
  formId,
  applicationId
) => {
  dispatch(
    push(`${getRoute(tenantId).APPLICATION}/${applicationId}?from=formEntries`)
  );
};

const navigateToResubmit = (dispatch, tenantId, formId, submissionId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORM}/${formId}/submissions/${submissionId}/resubmit`);
};

const navigateToSubmissionView = (dispatch, tenantId, formId, submissionId) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORM}/${formId}/submission/${submissionId}`);
};

/* ---------------------------  Application Routes --------------------------- */

const navigateToApplicationDetail = (dispatch, tenantId, applicationId) => {
  navigateTo(dispatch, `${getRoute(tenantId).APPLICATION}/${applicationId}`);
};

/* ---------------------------  Draft Routes --------------------------- */

const navigateToDraftDetail = (dispatch, tenantId, draftId) => {
  navigateTo(dispatch, `${getRoute(tenantId).DRAFT}/${draftId}`);
};

/* ---------------------------  Task Routes --------------------------- */

const navigateToTaskListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).TASK);
};

const navigateToTaskDetail = (dispatch, tenantId, taskId) => {
  navigateTo(dispatch, `${getRoute(tenantId).TASK}/${taskId}`);
};

const navigateToTaskOldListing = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).TASK_OLD}/`);
};

const navigateToTaskOldDetail = (dispatch, tenantId, taskId) => {
  navigateTo(dispatch, `${getRoute(tenantId).TASK_OLD}/${taskId}`);
};

/* ---------------------------  Process Creation Routes --------------------------- */

const navigateToSubflowBuild = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).SUBFLOW}/build`);
};

const navigateToDecisionTableBuild = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).DECISIONTABLE}/build`);
};

const navigateToSubflowCreate = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).SUBFLOW}/create`);
};

const navigateToDecisionTableCreate = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).DECISIONTABLE}/create`);
};

const navigateToSubflowEdit = (dispatch, tenantId, processKey) => {
  navigateTo(dispatch, `${getRoute(tenantId).SUBFLOW}/edit/${processKey}`);
};

const navigateToDecisionTableEdit = (dispatch, tenantId, processKey) => {
  navigateTo(dispatch, `${getRoute(tenantId).DECISIONTABLE}/edit/${processKey}`);
};

const navigateToSubflowListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).SUBFLOW);
};

const navigateToDecisionTableListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).DECISIONTABLE);
};

const navigateToProcessListing = (dispatch, tenantId, isBPMN) => {
  if (isBPMN) {
    navigateToSubflowListing(dispatch, tenantId);
  } else {
    navigateToDecisionTableListing(dispatch, tenantId);
  }
};

const navigateToProcessCreate = (dispatch, tenantId, processRoute) => {
  navigateTo(dispatch, `${getRoute(tenantId).FORMFLOW.replace('/formflow', '')}${processRoute}/create`);
};

const navigateToProcessEditWithParams = (
  dispatch, tenantId, processRoute, processKey, queryParams = {}
) => {
  const params = new URLSearchParams(queryParams).toString();
  const baseRoute = getRoute(tenantId).FORMFLOW.replace('/formflow', '');
  const url = params 
    ? `${baseRoute}${processRoute}/edit/${processKey}?${params}`
    : `${baseRoute}${processRoute}/edit/${processKey}`;
  navigateTo(dispatch, url);
};

const navigateToProcessRoute = (dispatch, tenantId, processRoute) => {
  const baseRoute = getRoute(tenantId).FORMFLOW.replace('/formflow', '');
  navigateTo(dispatch, `${baseRoute}${processRoute}`);
};

const navigateToImportedProcess = (dispatch, tenantId, baseUrl, processKey) => {
  const baseRoute = getRoute(tenantId).FORMFLOW.replace('/formflow', '');
  navigateTo(dispatch, `${baseRoute}${baseUrl}${processKey}`);
};

// ========== NEW FUNCTIONS TO ADD ==========

/**
 * Navigate to process edit page
 * Replaces: dispatch(push(`${redirectUrl}${viewType}/edit/${data.processKey}`))
 * Used in: ProcessTable.js
 */
const navigateToProcessEdit = (dispatch, tenantId, viewType, processKey) => {
  const redirectUrl = getRedirectUrl(tenantId);
  navigateTo(dispatch, `${redirectUrl}${viewType}/edit/${processKey}`);
};

/**
 * Navigate to template preview/edit page
 * Replaces: dispatch(push(`${redirectUrl}formflow/${mapperData.formId}/view-edit/`))
 * Used in: Preview.js
 */
const navigateToTemplatePreview = (dispatch, tenantId, formId) => {
  const redirectUrl = getRedirectUrl(tenantId);
  navigateTo(dispatch, `${redirectUrl}formflow/${formId}/view-edit/`);
};

/**
 * Navigate to submission view (direct path without tenant)
 * Replaces: dispatch(push(`/form/${formId}/submission/${submissionId}`))
 * Used in: View.js (Submission/Item)
 */
const navigateToSubmissionViewDirect = (dispatch, formId, submissionId) => {
  navigateTo(dispatch, `/form/${formId}/submission/${submissionId}`);
};

/* ---------------------------  Error Routes --------------------------- */

const navigateToNotFound = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).NOTFOUND);
};

const navigateToNotFoundAbsolute = (dispatch) => {
  navigateTo(dispatch, '/404');
};

/* ---------------------------  EE Specific Routes --------------------------- */

const navigateToDesignBundleCreate = (dispatch, tenantId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLEFLOW}/create`);
};

const navigateToDesignBundleListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).BUNDLEFLOW);
};

const navigateToDesignBundleEdit = (dispatch, tenantId, bundleId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/edit`);
};

const navigateToDesignBundleViewEdit = (dispatch, tenantId, bundleId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/view-edit`);
};

const navigateToDesignBundlePath = (dispatch, tenantId, bundleId, path) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLEFLOW}/${bundleId}/${path}`);
};

const navigateToBundleEntries = (dispatch, tenantId, bundleId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLE}/${bundleId}/entries`);
};

const navigateToNewBundleSubmission = (dispatch, tenantId, bundleId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLE}/${bundleId}`);
};

const navigateToViewBundleSubmission = (
  dispatch,
  tenantId,
  bundleId,
  submissionId,
  fromBundleEntries = false
) => {
  const baseUrl = `${
    getRoute(tenantId).BUNDLE
  }/${bundleId}/submission/${submissionId}`;
  const url = fromBundleEntries ? `${baseUrl}?from=bundleEntries` : baseUrl;
  navigateTo(dispatch, url);
};

const navigateToViewBundleReSubmission = (dispatch, tenantId, bundleId, submissionId) => {
  navigateTo(dispatch, `${getRoute(tenantId).BUNDLE}/${bundleId}/submission/${submissionId}/edit`);
};

/* ---------------------------  Multi-tenant Routes --------------------------- */

const navigateToTenant = (dispatch, username) => {
  navigateTo(dispatch, `/tenant/${username}`);
};

/* ---------------------------  Generic/Custom Route --------------------------- */

const navigateToPath = (dispatch, path) => {
  navigateTo(dispatch, path);
};

/* ---------------------------  Review/Task Routes --------------------------- */

/**
 * Navigate to task listing (for review microfrontend)
 * Replaces: dispatch(push(`${redirectUrl}task`)) or history.push(`${redirectUrl}task`)
 */
const navigateToTaskListingFromReview = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).TASK);
};

/**
 * Navigate to task listing using history (for review microfrontend)
 * Replaces: history.push(`${redirectUrl}task`)
 */
const navigateToTaskListingFromReviewWithHistory = (history, tenantId) => {
  navigateWithHistory(history, getRoute(tenantId).TASK);
};

/* ---------------------------  Submissions Routes --------------------------- */

/**
 * Navigate to submissions listing
 * Replaces: dispatch(push(`${redirectUrl}submissions`))
 */
const navigateToSubmissionsListing = (dispatch, tenantId) => {
  navigateTo(dispatch, getRoute(tenantId).ANALYZESUBMISSIONS);
};

/**
 * Navigate to submission detail view
 * Replaces: dispatch(push(`${redirectUrl}submissions/${submissionId}`))
 */
const navigateToSubmissionDetail = (dispatch, tenantId, submissionId) => {
  navigateTo(dispatch, `${getRoute(tenantId).ANALYZESUBMISSIONS}/${submissionId}`);
};

/* ---------------------------  Admin Routes --------------------------- */

/**
 * Navigate to admin roles listing
 * Replaces: history.push(`${baseUrl}admin/roles`)
 */
const navigateToAdminRoles = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).ADMIN}/roles`);
};

/**
 * Navigate to admin users listing
 * Replaces: history.push(`${baseUrl}admin/users`)
 */
const navigateToAdminUsers = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).ADMIN}/users`);
};

/**
 * Navigate to admin dashboard
 * Replaces: history.push(`${baseUrl}admin/dashboard`)
 */
const navigateToAdminDashboard = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).ADMIN}/dashboard`);
};

/* ---------------------------  Integration Routes --------------------------- */

/**
 * Navigate to integration recipes
 * Replaces: history.push(`${baseUrl}integration/recipes`)
 */
const navigateToIntegrationRecipes = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).INTEGRETIONS}`);
};

/**
 * Navigate to integration connected apps
 * Replaces: history.push(`${baseUrl}integration/connected-apps`)
 */
const navigateToIntegrationConnectedApps = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).INTEGRETIONS.replace('/recipes', '/connected-apps')}`);
};

/**
 * Navigate to integration library
 * Replaces: history.push(`${baseUrl}integration/library`)
 */
const navigateToIntegrationLibrary = (history, tenantId) => {
  navigateWithHistory(history, `${getRoute(tenantId).INTEGRETIONS.replace('/recipes', '/library')}`);
};

/* ---------------------------  Navigation Routes --------------------------- */

/**
 * Navigate to base URL (for logout/navigation)
 * Replaces: history.push(baseUrl)
 */
const navigateToBaseUrl = (history, tenantId) => {
  navigateWithHistory(history, getRedirectUrl(tenantId));
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