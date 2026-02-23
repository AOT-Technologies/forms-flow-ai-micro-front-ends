declare global {
    interface Window {
      _env_?: any;
    }
  }
  
  const MULTITENANCY_ENABLED_VARIABLE =
    window._env_?.REACT_APP_MULTI_TENANCY_ENABLED ||
    process.env.REACT_APP_MULTI_TENANCY_ENABLED ||
    false;
  
  export const MULTITENANCY_ENABLED =
    MULTITENANCY_ENABLED_VARIABLE === "true" || MULTITENANCY_ENABLED_VARIABLE === true;
  
  export const MAIN_ROUTE = {
    DRAFT: "draft",
    FORM: "form",
    FORM_ENTRIES: "form/:formId/entries",
    FORMFLOW: "formflow",
    TASK_OLD: "task-old",
    TASK: "task",
    APPLICATION: "application",
    SUBFLOW: "subflow",
    DECISIONTABLE: "decision-table",
    METRICS: "metrics",
    DASHBOARDS: "dashboards",
    ANALYZESUBMISSIONS: "submissions",
    ADMIN: "admin",
    FORM_CREATE: "formflow/create",
    BUNDLE: "bundle",
    BUNDLEFLOW: "bundleflow",
    TEMPLATE: "template",
    NOTFOUND: "404",
    INTEGRETIONS: "integration/recipes",
  };
  
  const getBaseRoute = (tenantId) => {
    return MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : `/`;
  };
  
  export const getRoute = (tenantId) => ({
    DRAFT: getBaseRoute(tenantId) + MAIN_ROUTE.DRAFT,
    FORM: getBaseRoute(tenantId) + MAIN_ROUTE.FORM,
    FORMFLOW: getBaseRoute(tenantId) + MAIN_ROUTE.FORMFLOW,
    TASK_OLD: getBaseRoute(tenantId) + MAIN_ROUTE.TASK_OLD,
    TASK: getBaseRoute(tenantId) + MAIN_ROUTE.TASK,
    APPLICATION: getBaseRoute(tenantId) + MAIN_ROUTE.APPLICATION,
    SUBFLOW: getBaseRoute(tenantId) + MAIN_ROUTE.SUBFLOW,
    DECISIONTABLE: getBaseRoute(tenantId) + MAIN_ROUTE.DECISIONTABLE,
    METRICS: getBaseRoute(tenantId) + MAIN_ROUTE.METRICS,
    ANALYZESUBMISSIONS: getBaseRoute(tenantId) + MAIN_ROUTE.ANALYZESUBMISSIONS,
    DASHBOARDS: getBaseRoute(tenantId) + MAIN_ROUTE.DASHBOARDS,
    ADMIN: getBaseRoute(tenantId) + MAIN_ROUTE.ADMIN,
    BUNDLE: getBaseRoute(tenantId) + MAIN_ROUTE.BUNDLE,
    BUNDLEFLOW: getBaseRoute(tenantId) + MAIN_ROUTE.BUNDLEFLOW,
    TEMPLATE: getBaseRoute(tenantId) + MAIN_ROUTE.TEMPLATE,
    NOTFOUND: getBaseRoute(tenantId) + MAIN_ROUTE.NOTFOUND,
    FORM_ENTRIES: getBaseRoute(tenantId) + MAIN_ROUTE.FORM_ENTRIES,
    INTEGRETIONS: getBaseRoute(tenantId) + MAIN_ROUTE.INTEGRETIONS,
    FORM_CREATE: getBaseRoute(tenantId) + MAIN_ROUTE.FORM_CREATE
  });
  
  
  /**
   * Get redirectUrl (base route with tenant)
   * Replaces: const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
   */
  export const getRedirectUrl = (tenantKey) => {
    return getBaseRoute(tenantKey);
  };
  
  /**
   * Get window.location.origin
   * Replaces: window.location.origin
   */
  export const getOrigin = () => {
    return window.location.origin;
  };
  
  /**
   * Get full URL with origin + redirectUrl + path
   * Replaces: `${window.location.origin}${redirectUrl}${path}`
   */
  export const getFullUrl = (tenantKey, path = "") => {
    return `${getOrigin()}${getRedirectUrl(tenantKey)}${path}`;
  };
  
  /**
   * Get Link 'to' prop value
   * Replaces: <Link to={`${redirectUrl}path`}>
   */
  export const getLinkTo = (tenantKey, path) => {
    const redirectUrl = getRedirectUrl(tenantKey);
    // Remove leading slash from path if redirectUrl already ends with /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${redirectUrl}${cleanPath}`;
  };