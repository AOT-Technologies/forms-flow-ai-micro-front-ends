import KeycloakService from "./keycloak/KeycloakService";
import StorageService from "./storage/storageService";
import RequestService from "./request/requestService";
import i18nService from "./resourceBundles/i18n";
import HelperServices from "./helpers/helperServices";
import StyleServices from "./helpers/styleService";
import { applyCompactFormStyles } from "./helpers/compactViewFormService";
import { getColumnPresetSizing } from "./helpers/columnPresetService";
import formioResourceBundle from "./resourceBundles/formioResourceBundle";
import { fetchAndStoreFormioRoles } from "./apiManager/services/formioRoleService";
import { fetchFeatureUsage } from "./apiManager/services/usageService";
import {
  getRoute,
  MAIN_ROUTE,
  MULTITENANCY_ENABLED,
  getRedirectUrl,
  getOrigin,
  getFullUrl,
  getLinkTo,
} from "./routerServices/routerConstants";

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
  navigateToAdminOrganization,
  navigateToAdminPlans,
  getAdminOrganizationReturnUrl,
  navigateToIntegrationRecipes,
  navigateToIntegrationConnectedApps,
  navigateToIntegrationLibrary,
  navigateToBaseUrl,
  navigateWithHistory,
  syncRouterPath,
  navigateToTemplatePreview,
  navigateToSubmissionViewDirect,
} from "./routerServices/routerHelper";

export {
  BREAKPOINTS,
  CONTAINERS,
  BREAKPOINT_TIERS,
  mediaFrom,
  mediaBelow,
  resolveTier,
} from "./constants/breakpoints";
export type { BreakpointTier } from "./constants/breakpoints";

export {
  getStoredChecklistItems,
  storeChecklistItems,
  completeChecklistByRouteKey,
} from "./helpers/checklistService";

// Usage metering: pure calculation helpers shared by the usage card (forms-flow-admin) and
// the usage banner (forms-flow-web). The components live in their hosts; only the logic that
// must not diverge between them lives here.
export {
  BILLING_CYCLE_DAYS,
  USAGE_THRESHOLDS,
  FREE_PLAN_LABEL,
  PRO_PLAN_LABEL,
  NEXT_TIER_SUBMISSIONS,
  SUBMISSION_FEATURE_KEY,
  getUsagePercentage,
  getUsageVariant,
  isOverLimit,
  formatResetLabel,
  formatBillingDate,
  getUsageCtaLabel,
  mapUsageResponse,
} from "./helpers/usageHelpers";

export type {
  UsageData,
  TenantRecord,
  UsageVariant,
  UsageResponseFields,
} from "./helpers/usageHelpers";

export {
  KeycloakService,
  StorageService,
  RequestService,
  i18nService,
  HelperServices,
  StyleServices,
  formioResourceBundle,
  applyCompactFormStyles,
  getColumnPresetSizing,
  fetchAndStoreFormioRoles,
  fetchFeatureUsage,
  getRoute,
  MAIN_ROUTE,
  MULTITENANCY_ENABLED,
  getRedirectUrl,
  getOrigin,
  getFullUrl,
  getLinkTo,
};
