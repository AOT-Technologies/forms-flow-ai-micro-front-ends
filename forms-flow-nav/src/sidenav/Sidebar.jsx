import "./Sidebar.scss";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  APPLICATION_NAME,
  MULTITENANCY_ENABLED,
  ENABLE_FORMS_MODULE,
  ENABLE_PROCESSES_MODULE,
  ENABLE_DASHBOARDS_MODULE,
  ENABLE_APPLICATIONS_MODULE,
  ENABLE_TASKS_MODULE,
  IS_ENTERPRISE,
  LANGUAGE,
} from "../constants/constants";
import {
  navigateToBaseUrl,
  getRedirectUrl,
  StorageService,
  StyleServices,
  storeChecklistItems,
} from "@formsflow/service";
import i18n from "../resourceBundles/i18n";
import {
  fetchTenantDetails,
  handleTenantSubscription,
} from "../services/tenant";
import { setShowApplications } from "../constants/userConstants";
import { PERMISSIONS } from "../constants/permissions";
import { checkIntegrationEnabled } from "../services/integration";
import {
  fetchUserLoginDetails,
  getOnBoardingUserRole,
  fetchChecklist,
  getOnboardingDetails
} from "../services/user";
import MenuComponent from "./MenuComponent";
import {
  ApplicationLogoFull,
  LogoutIcon,
  MenuToggleIcon,
  NavbarUserIcon,
} from "@formsflow/components";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import PropTypes from "prop-types";

// Pure constants hoisted to module scope so they are not rebuilt on every
// Sidebar render (N.1.3). Values are byte-identical to the previous inline
// literals — route paths are contracts.

// Rail widths, published to the document root as --navbar-width so the theme's
// .nav-space gutter tracks the rail. The collapsed value must stay in sync with
// the theme default in forms-flow-theme `scss/v8-scss/_theme.scss`.
const NAV_WIDTH_COLLAPSED = "3rem";
const NAV_WIDTH_EXPANDED = "11rem";

const SectionKeys = {
  HOME: {
    value: "home",
    supportedRoutes: ["home"],
  },
  BUILD: {
    value: "build",
    supportedRoutes: [
      "formflow",
      "bundleflow",
      "subflow",
      "decision-table",
      "integration/recipes",
      "integration/connected-apps",
      "integration/library",
    ],
  },
  SUBMIT: {
    value: "submit",
    supportedRoutes: ["form", "bundle", "application", "draft"],
  },
  TASK: {
    value: "task",
    supportedRoutes: ["task"],
  },
  ANALYZE: {
    value: "analyze",
    supportedRoutes: ["metrics", "dashboards", "submissions"],
  },
  MANAGE: {
    value: "manage",
    supportedRoutes: ["admin/dashboard", "admin/roles", "admin/users"],
  },
};

// Static subMenu definitions (N.1.3): stable identities avoid re-allocating
// these arrays on every render.
const HOME_SUBMENU = [
  {
    name: "Home",
    path: "home",
    supportedSubRoutes: ["home"],
  },
];

const TASKS_SUBMENU = [
  {
    name: "Tasks",
    path: "task",
  },
];

const SUBMIT_SUBMENU = [
  {
    name: "Forms",
    path: "form",
    supportedSubRoutes: ["form", "bundle", "application", "draft"],
    unsupportedSubRoutes: ["formflow", "bundleflow"],
  },
];

const WORKFLOW_SUBMENU = [
  {
    name: "Subflows",
    path: "subflow",
  },
  {
    name: "Decision Tables",
    path: "decision-table",
  },
];

const MANAGE_SUBMENU = [
  {
    name: "Manage",
    path: "admin",
    supportedSubRoutes: ["admin"],
  },
];

const UserProfile = ({
  userDetail,
  handleProfileModal,
  logout,
  t,
  collapsed,
}) => (
  <div className={`user-container${collapsed ? " collapsed" : ""}`}>
    <button
      onClick={handleProfileModal}
      data-testid="sidenav-user-profile-btn"
      aria-label={t("Profile settings")}
    >
      <span className="user-icon" data-testid="user-icon" aria-hidden="true">
        <NavbarUserIcon />
      </span>
      {!collapsed && (
        <div className="user-info">
          <div>
            <p className="user-name" data-testid="user-name">
              {userDetail?.name}
            </p>
          </div>
        </div>
      )}
    </button>
    <button
      className="sign-out-button"
      onClick={logout}
      data-testid="sign-out-button"
      aria-label={t("Logout")}
    >
      <span className="menu-icon" aria-hidden="true">
        <LogoutIcon />
      </span>
      {!collapsed && <p className="m-0">{t("Logout")}</p>}
    </button>
  </div>
);

UserProfile.propTypes = {
  userDetail: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    preferred_username: PropTypes.string,
  }).isRequired,

  handleProfileModal: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

const renderLogo = (hideLogo, collapsed) => {
  if (hideLogo === "true") return null;

  return (
    <div className={`logo-container${collapsed ? " collapsed" : ""}`}>
      <ApplicationLogoFull
        width={107}
        height={20}
        data-testid="application-logo"
      />
    </div>
  );
};

const Sidebar = React.memo(({ props, sidenavHeight = "100%" }) => {
  const [tenantLogo, setTenantLogo] = React.useState("");
  const [tenantName, setTenantName] = React.useState("");
  const [applicationTitle, setApplicationTitle] = React.useState("");
  const [userDetail, setUserDetail] = React.useState({});
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [integrationEnabled, setIntegrationEnabled] = React.useState(false);
  const [form, setForm] = React.useState({});
  const navigate = useNavigate();
  const tenantKey = tenant?.tenantId;
  const formTenant = form?.tenantKey;
  const [showProfile, setShowProfile] = useState(false);
  const { t } = useTranslation();

  const baseUrl = getRedirectUrl(tenantKey || userDetail?.tenantKey);
  // Read once per auth change instead of on every render (N.1.3): the value
  // is only consumed inside the mount-time FF_PUBLIC subscription closure.
  const defaultLogoPath = useMemo(
    () =>
      document.documentElement.style.getPropertyValue("--navbar-logo-path") ||
      "/logo.svg",
    []
  );
  // Roles are written to storage on auth events only, so re-parse the JSON and
  // re-scan the role list when the auth instance changes rather than on every
  // render (N.1.2). The derived values are byte-identical to the previous
  // per-render computations — role strings are contracts.
  const {
    userRoles,
    isCreateSubmissions,
    isViewSubmissions,
    isCreateDesigns,
    isViewDesigns,
    isManageWorkflows,
    isManageBundles,
    isManageIntegrations,
    isViewTask,
    isManageTask,
    isViewDashboard,
    isDashboardManager,
    isAnalyzeSubmissionView,
    isAnalyzeMetricsView,
    isRoleManager,
    isUserManager,
  } = useMemo(() => {
    const roles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
    return {
      userRoles: roles,
      isCreateSubmissions: roles?.includes(PERMISSIONS.CREATE_SUBMISSIONS),
      isViewSubmissions: roles?.includes(PERMISSIONS.VIEW_SUBMISSIONS),
      isCreateDesigns: roles?.includes(PERMISSIONS.CREATE_DESIGNS),
      isViewDesigns: roles?.includes(PERMISSIONS.VIEW_DESIGNS),
      isManageWorkflows: roles?.includes(PERMISSIONS.MANAGE_ADVANCE_WORKFLOWS),
      isManageBundles: roles?.includes(PERMISSIONS.MANAGE_BUNDLES),
      isManageIntegrations: roles?.includes(PERMISSIONS.MANAGE_INTEGRATIONS),
      isViewTask: roles?.includes(PERMISSIONS.VIEW_TASKS),
      isManageTask: roles?.includes(PERMISSIONS.MANAGE_TASKS),
      isViewDashboard: roles?.includes(PERMISSIONS.VIEW_DASHBOARDS),
      isDashboardManager: roles?.includes(
        PERMISSIONS.MANAGE_DASHBOARD_AUTHORIZATIONS
      ),
      isAnalyzeSubmissionView: roles?.includes(
        PERMISSIONS.ANALYZE_SUBMISSIONS_VIEW
      ),
      isAnalyzeMetricsView: roles?.includes(PERMISSIONS.ANALYZE_METRICS_VIEW),
      isRoleManager: roles?.includes(PERMISSIONS.MANAGE_ROLES),
      isUserManager: roles?.includes(PERMISSIONS.MANAGE_USERS),
    };
  }, [instance]);
  const isAdmin = isDashboardManager || isRoleManager || isUserManager;
  const isAnalyzeManager =
    isAnalyzeMetricsView || isViewDashboard || isAnalyzeSubmissionView;

  const DASHBOARD_ROUTE = isDashboardManager ? "admin/dashboard" : null;

  const ROLE_ROUTE = isRoleManager ? "admin/roles" : null;
  const USER_ROUTE = isUserManager ? "admin/users" : null;
  const METRICS_ROUTE = isAnalyzeMetricsView ? "metrics" : null;
  const SUBMISSION_ROUTE = isAnalyzeSubmissionView ? "submissions" : null;
  const VIEW_DASHBOARD_ROUTE = isViewDashboard ? "dashboards" : null;

  const isAuthenticated = instance?.isAuthenticated();
  const showApplications = setShowApplications(userDetail?.groups);
  // Theme CSS variable is set at app bootstrap; read it once instead of per
  // render (N.1.3).
  const hideLogo = useMemo(
    () => StyleServices?.getCSSVariable("--hide-formsflow-logo")?.toLowerCase(),
    []
  );

  // Collapsible sidebar state
  // Collapsed is the default state at every width, and the expanded state is
  // deliberately NOT persisted: every page load starts collapsed again.
  // Viewport size does not decide this either — below the tablet breakpoint the
  // rail is hidden by CSS and the hamburger overlay takes over.
  // The rail expands only when the toggle is clicked. Hovering a collapsed icon
  // shows that row's tooltip instead (see .menu-flyout) and never widens the nav.
  const [collapsed, setCollapsed] = useState(true);

  const handleToggleClick = () => {
    setCollapsed((prev) => !prev);
  };

  // The rail is position:fixed, so the gutter that keeps it off the page content
  // is reserved by the theme's `.base-container > .nav-space` column, which sizes
  // itself from --navbar-width. Publishing the width on the document root (not as
  // an inline style on .sidenav, where nothing outside this MFE could read it) is
  // what keeps the two in step — otherwise the gutter stays at the theme's 3rem
  // default while the expanded rail grows to 11rem and covers the canvas, which
  // bites hardest at tablet/desktop-sm where the canvas has the least slack.
  useEffect(() => {
    StyleServices?.setCSSVariable(
      "--navbar-width",
      collapsed ? NAV_WIDTH_COLLAPSED : NAV_WIDTH_EXPANDED
    );
    // The rail is unmounted on preview routes; hand the gutter back to the
    // collapsed default so the page does not keep an 11rem hole where it was.
    return () => {
      StyleServices?.setCSSVariable("--navbar-width", NAV_WIDTH_COLLAPSED);
    };
  }, [collapsed]);

  // checklistSkipped is hydrated into shared localStorage by forms-flow-web
  // (PrivateRoute) at login, so we read it here instead of making a duplicate
  // /user/info call. Fetch the checklist items only when it hasn't been skipped.
  const loadChecklistFromOnboarding = () => {
    const { checklistSkipped } = getOnboardingDetails();
    if (checklistSkipped) {
      // Clear any items fetched optimistically before the skipped flag arrived.
      storeChecklistItems(null);
      return;
    }
    fetchChecklist()
      .then((res) => {
        const data = res.data || res;
        const next = Array.isArray(data) ? data : [];
        storeChecklistItems(next);
      })
      .catch(() => {
        storeChecklistItems(null);
      });
  };

  React.useEffect(() => {
    setUserDetail(
      JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {}
    );
  }, [instance]);

  React.useEffect(() => {
    if (MULTITENANCY_ENABLED && !tenant.tenantId && instance?.isAuthenticated) {
      fetchTenantDetails(setTenant);
    }
  }, [instance]);

  React.useEffect(() => {
    props.subscribe("FF_AUTH", (msg, data) => {
      setInstance(data);
    });

    props.subscribe("FF_PUBLIC", () => {
      if (MULTITENANCY_ENABLED) {
        setApplicationTitle(APPLICATION_NAME);
        setTenantLogo(defaultLogoPath);
      }
    });

    props.subscribe("ES_TENANT", (msg, data) => {
      handleTenantSubscription(data, setTenant);
    });
    props.subscribe("ES_FORM", (msg, data) => {
      if (data) {
        setForm(data);
      }
    });

    // Subscribe to profile updates to refresh user details in navbar
    props.subscribe("profileUpdated", () => {
      const updatedUserDetail =
        JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};
      setUserDetail(updatedUserDetail);
    });

    // forms-flow-web publishes this after it writes onboarding details to
    // localStorage. Covers the case where web writes them after we mount, so
    // we can re-evaluate the checklist without our own /user/info call.
    props.subscribe("FF_ONBOARDING_DETAILS", () => {
      loadChecklistFromOnboarding();
    });
  }, []);

  // On successful authentication, load federated login details and integration config
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch federated login details (saves into localStorage)]
      fetchUserLoginDetails();
      getOnBoardingUserRole().then((onboarding) => {
        if (onboarding?.checklistSkipped) {
          return;
        }
        return fetchChecklist()
          .then((res) => {
            const data = res.data || res;
            const next = Array.isArray(data) ? data : [];
            storeChecklistItems(next);
          })
          .catch(() => {
            storeChecklistItems(null);
          });
      });
      loadChecklistFromOnboarding();
      checkIntegrationEnabled()
        .then((res) => {
          setIntegrationEnabled(res.data?.enabled);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const locale =
      userDetail?.locale || tenant?.tenantData?.details?.locale || LANGUAGE;
    i18n.changeLanguage(locale);
  }, [userDetail]);

  React.useEffect(() => {
    const data = JSON.parse(StorageService.get("tenantData"));
    if (MULTITENANCY_ENABLED && data?.details) {
      setTenantName(data?.details?.applicationTitle);
      const logo = data?.details?.customLogo?.logo;
      setTenantLogo(logo);
    }
  }, [tenant]);

  useEffect(() => {
    if (!isAuthenticated && formTenant && MULTITENANCY_ENABLED) {
      setLoginUrl(`/tenant/${formTenant}/`);
    }
  }, [isAuthenticated, formTenant]);

  const handleProfileModal = () => setShowProfile(true);
  const handleProfileClose = () => setShowProfile(false);

  const logout = () => {
    navigateToBaseUrl(navigate, tenantKey || userDetail?.tenantKey);
    instance.userLogout();
  };

  const manageOptions = () => {
    const options = [];

    if (isDashboardManager) {
      options.push({
        name: "Dashboards",
        path: DASHBOARD_ROUTE,
      });
    }

    if (isRoleManager) {
      options.push({
        name: "Roles",
        path: ROLE_ROUTE,
      });
    }

    if (isUserManager) {
      options.push({
        name: "Users",
        path: USER_ROUTE,
      });
    }

    return options;
  };
  // Analyze menu options depend only on role flags; rebuild them when those
  // change instead of on every render (N.1.3). Entries are unchanged.
  const analyzeSubMenu = useMemo(() => {
    const options = [];

    if (isAnalyzeMetricsView) {
      options.push({
        name: "Metrics",
        path: METRICS_ROUTE,
      });
    }
    if (isViewDashboard) {
      options.push({
        name: "Dashboards",
        path: VIEW_DASHBOARD_ROUTE,
      });
    }
    if (isAnalyzeSubmissionView) {
      options.push({
        name: "Submissions",
        path: SUBMISSION_ROUTE,
      });
    }

    return options;
  }, [
    isAnalyzeMetricsView,
    isViewDashboard,
    isAnalyzeSubmissionView,
    METRICS_ROUTE,
    VIEW_DASHBOARD_ROUTE,
    SUBMISSION_ROUTE,
  ]);

  // Build menu entries depend only on role flags; rebuild them when those
  // change instead of on every render (N.1.3). The constant-false ternary and
  // the commented-out v8 submenu variants that used to wrap this array were
  // removed (N.6.4) — the live entries are unchanged.
  const buildSubMenu = useMemo(
    () => [
      {
        name: "Forms",
        path: "formflow",
      },
      ...(IS_ENTERPRISE && isManageBundles
        ? [
            {
              name: "Bundles",
              path: "bundleflow",
              isPremium: true,
            },
          ]
        : []),
      ...(isManageWorkflows && ENABLE_PROCESSES_MODULE
        ? [
            {
              name: "Subflows",
              path: "subflow",
            },
            {
              name: "Decision Tables",
              path: "decision-table",
            },
          ]
        : []),
    ],
    [isManageBundles, isManageWorkflows]
  );

  // Collapsible sidebar class
  const sidebarClass = `sidenav${collapsed ? " collapsed" : ""}`;

  return (
    <div
      className={sidebarClass}
      // --navbar-width is deliberately NOT set here: it lives on the document
      // root (see the effect above) so the rail and the theme's .nav-space
      // gutter are driven by one value. .sidenav reads it by inheritance.
      style={{ height: sidenavHeight }}
      data-testid="sidenav"
    >
      {/* Logo and the collapse toggle share one header row (Figma 8.3): logo
          at the left inset, toggle pinned right. */}
      <div className="sidenav-header">
        {renderLogo(hideLogo, collapsed)}
        {/* The toggle is now the only way to expand the nav, so it has to be a
            real button: the span it replaces was not focusable or key-operable. */}
        <div className={`menu-toggle-icon${collapsed ? "" : " open"}`}>
          <button
            type="button"
            className="menu-toggle-btn"
            onClick={handleToggleClick}
            data-testid="sidenav-toggle-btn"
            aria-label={t("Toggle sidebar")}
            aria-expanded={!collapsed}
          >
            <MenuToggleIcon />
          </button>
        </div>
      </div>
      <div
        className={`options-container${collapsed ? " collapsed" : ""}`}
        data-testid="options-container"
      >
        <ul className="menu-list">
          {userRoles !== null && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.HOME.value}
              optionsCount="0"
              mainMenu="Home"
              subMenu={HOME_SUBMENU}
              collapsed={collapsed}
            />
          )}
          {(isViewTask || isManageTask) && ENABLE_TASKS_MODULE && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.TASK.value}
              optionsCount="0"
              mainMenu="Tasks"
              subMenu={TASKS_SUBMENU}
              collapsed={collapsed}
            />
          )}

          {ENABLE_FORMS_MODULE &&
            (isCreateDesigns || isViewDesigns || isManageIntegrations) && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.BUILD.value}
                optionsCount="5"
                mainMenu={t("Build")}
                subMenu={buildSubMenu}
                collapsed={collapsed}
              />
            )}

          {isManageWorkflows &&
            !isCreateDesigns &&
            !isViewDesigns &&
            ENABLE_PROCESSES_MODULE && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.BUILD.value}
                optionsCount="2"
                mainMenu="Build"
                subMenu={WORKFLOW_SUBMENU}
                collapsed={collapsed}
              />
            )}
          {isAnalyzeManager && ENABLE_DASHBOARDS_MODULE && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.ANALYZE.value}
              optionsCount="2"
              mainMenu="Analyze"
              subMenu={analyzeSubMenu}
              collapsed={collapsed}
            />
          )}
          {isAdmin && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.MANAGE.value}
              optionsCount="0"
              mainMenu="Manage"
              subMenu={MANAGE_SUBMENU}
              collapsed={collapsed}
            />
          )}

          {(isCreateSubmissions ||
            (showApplications &&
              isViewSubmissions &&
              ENABLE_APPLICATIONS_MODULE)) && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.SUBMIT.value}
              optionsCount="0"
              mainMenu="Submit"
              subMenu={SUBMIT_SUBMENU}
              collapsed={collapsed}
            />
          )}
        </ul>
      </div>
      {isAuthenticated && (
        <UserProfile
          userDetail={userDetail}
          handleProfileModal={handleProfileModal}
          logout={logout}
          t={t}
          collapsed={collapsed}
        />
      )}
      {showProfile && (
        <ProfileSettingsModal
          show={showProfile}
          onClose={handleProfileClose}
          tenant={tenant}
          publish={props.publish}
        />
      )}
    </div>
  );
});

Sidebar.propTypes = {
  subscribe: PropTypes.func,
  getKcInstance: PropTypes.func,
  publish: PropTypes.func,
  sidenavHeight: PropTypes.string,
};

export default Sidebar;
