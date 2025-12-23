import KeycloakService from "./keycloak/KeycloakService";
import StorageService from "./storage/storageService";
import RequestService from "./request/requestService";
import i18nService from "./resourceBundles/i18n";
import HelperServices from "./helpers/helperServices";
import StyleServices from "./helpers/styleService";
import {applyCompactFormStyles}from "./helpers/compactViewFormService";
import formioResourceBundle from "./resourceBundles/formioResourceBundle";
import { fetchAndStoreFormioRoles } from "./apiManager/services/formioRoleService";
import { getRoute, MAIN_ROUTE, MULTITENANCY_ENABLED, getRedirectUrl, getOrigin, getFullUrl, getLinkTo } from "./routerServices/routerConstants";

// Re-export router helpers
export {
  navigateToDesignFormsListing,
  navigateToDesignFormCreate,
  navigateToDesignFormBuild,
  navigateToDesignFormEdit,
  navigateToDesignFormEditWithParams,
  navigateToDesignFormPath,
  navigateToSubmitFormsApplication,
  navigateToSubmitFormsDraft,
  navigateToSubmitFormsListing,
  navigateToFormEntries,
  navigateToNewSubmission,
  navigateToDraftEdit,
  navigateToViewSubmission,
  navigateToResubmit,
  navigateToSubmissionView,
  navigateToApplicationDetail,
  navigateToDraftDetail,
  navigateToTaskListing,
  navigateToTaskDetail,
  navigateToTaskOldListing,
  navigateToTaskOldDetail,
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
  navigateToProcessEdit,
  navigateToNotFound,
  navigateToNotFoundAbsolute,
  navigateToDesignBundleCreate,
  navigateToDesignBundleListing,
  navigateToDesignBundleEdit,
  navigateToDesignBundleViewEdit,
  navigateToDesignBundlePath,
  navigateToNewBundleSubmission,
  navigateToBundleEntries,
  navigateToViewBundleSubmission,
  navigateToViewBundleReSubmission,
  navigateToTenant,
  navigateToPath,
  navigateToTaskListingFromReview,
  navigateToTaskListingFromReviewWithHistory,
  navigateToSubmissionsListing,
  navigateToSubmissionDetail,
  navigateToAdminRoles,
  navigateToAdminUsers,
  navigateToAdminDashboard,
  navigateToIntegrationRecipes,
  navigateToIntegrationConnectedApps,
  navigateToIntegrationLibrary,
  navigateToBaseUrl,
  navigateWithHistory,
  syncRouterPath,
  navigateToTemplatePreview,
  navigateToSubmissionViewDirect
} from "./routerServices/routerHelper";

export { 
  KeycloakService, 
  StorageService, 
  RequestService, 
  i18nService, 
  HelperServices, 
  StyleServices, 
  formioResourceBundle, 
  applyCompactFormStyles, 
  fetchAndStoreFormioRoles,
  getRoute,
  MAIN_ROUTE,
  MULTITENANCY_ENABLED,
  getRedirectUrl,
  getOrigin,
  getFullUrl,
  getLinkTo
};
