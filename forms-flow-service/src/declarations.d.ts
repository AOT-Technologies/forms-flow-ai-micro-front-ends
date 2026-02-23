declare module "*.html" {
  const rawHtmlFile: string;
  export = rawHtmlFile;
}

declare module "*.bmp" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "@formsflow/service" {
  export const {
    KeycloakService,
    RequestService,
    StorageService,
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
    getLinkTo,
    // Router Helper Functions
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
  }: any;
}
