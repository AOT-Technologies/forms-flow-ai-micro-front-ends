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
    getRoute,
    MAIN_ROUTE,
    MULTITENANCY_ENABLED,
    getRedirectUrl,
    getOrigin,
    getFullUrl,
    getLinkTo,
    navigateToAdminRoles,
    navigateToAdminUsers,
    navigateToAdminDashboard,
    navigateToBaseUrl,
    navigateWithHistory,
    syncRouterPath
  }: any;
}

declare module "@formsflow/components" {
  export const {
    TableFooter,
    CustomSearch,
    CloseIcon,
    CustomTabs,
    FormInput,
    FormTextArea,
    CustomButton,
    DeleteIcon,
    ConfirmModal,
    CustomInfo,
    PromptModal,
    CustomUrl,
    Switch,
    V8CustomButton,
    BreadCrumbs
  }: any;
}
