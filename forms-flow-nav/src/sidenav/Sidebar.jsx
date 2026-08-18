import "./Sidebar.scss";
import Accordion from "react-bootstrap/Accordion";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { navigateToBaseUrl, getRedirectUrl } from "@formsflow/service";
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
  USER_NAME_DISPLAY_CLAIM,
} from "../constants/constants";
import {
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
import { LANGUAGE } from "../constants/constants";
import { checkIntegrationEnabled } from "../services/integration";
import {
  fetchUserLoginDetails,
  getOnBoardingUserRole,
  fetchChecklist,
  getOnboardingDetails
} from "../services/user";
import MenuComponent from "./MenuComponent";
import {
  ApplicationLogo,
  LogoutIcon,
  MenuToggleIcon,
} from "@formsflow/components";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import PropTypes from "prop-types";

// Pure constants hoisted to module scope so they are not rebuilt on every
// Sidebar render (N.1.3). Values are byte-identical to the previous inline
// literals — route paths are contracts.
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
  initials,
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
      <div className="user-icon cursor-pointer" data-testid="user-icon">
        {initials}
      </div>
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
      <LogoutIcon />
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

  initials: PropTypes.string.isRequired,
  handleProfileModal: PropTypes.func.isRequired,
  logout: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  collapsed: PropTypes.bool,
};

const renderLogo = (hideLogo, collapsed) => {
  if (hideLogo === "true") return null;

  return (
    <div className={`logo-container${collapsed ? " collapsed" : ""}`}>
      <ApplicationLogo data-testid="application-logo" />
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
  const currentLocation = useLocation();

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
  const [activeKey, setActiveKey] = useState(null);
  // Theme CSS variable is set at app bootstrap; read it once instead of per
  // render (N.1.3).
  const hideLogo = useMemo(
    () => StyleServices?.getCSSVariable("--hide-formsflow-logo")?.toLowerCase(),
    []
  );

  // Collapsible sidebar state
  const getInitialCollapsedState = () => {
    return window.innerWidth <= 1200;
  };

  const [persistentCollapsed, setPersistentCollapsed] = useState(
    getInitialCollapsedState()
  );
  const [hoverToggled, setHoverToggled] = useState(false);
  const collapsed = persistentCollapsed !== hoverToggled;
  const sidebarRef = useRef(null);
  const hoverTimeout = useRef(null);

  const handleToggleClick = () => {
    setPersistentCollapsed(!persistentCollapsed);
    setHoverToggled(false);
  };

  const handleMouseEnter = () => {
    if (persistentCollapsed) {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      setHoverToggled(true);
    }
  };

  const handleMouseLeave = () => {
    if (persistentCollapsed) {
      hoverTimeout.current = setTimeout(() => {
        setHoverToggled(false);
      }, 120);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    const initials = nameParts.map((part) => part[0]).join("");
    return initials.substring(0, 2).toUpperCase(); // Get the first two initials
  };

  // fetch the username form the user details
  const userName = useMemo(() => {
    const value =
      userDetail[USER_NAME_DISPLAY_CLAIM] ||
      userDetail?.name ||
      userDetail?.preferred_username ||
      "";
    if (Array.isArray(value)) {
      return value.length > 0 ? value[0] : "";
    }
    return value;
  }, [userDetail]);

  const initials = getInitials(userName);

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
    const sections = [
      {
        key: SectionKeys.HOME.value,
        supportedRoutes: SectionKeys.HOME.supportedRoutes,
      },
      {
        key: SectionKeys.BUILD.value,
        supportedRoutes: SectionKeys.BUILD.supportedRoutes,
      },
      {
        key: SectionKeys.SUBMIT.value,
        supportedRoutes: SectionKeys.SUBMIT.supportedRoutes,
      },
      {
        key: SectionKeys.TASK.value,
        supportedRoutes: SectionKeys.TASK.supportedRoutes,
      },
      {
        key: SectionKeys.ANALYZE.value,
        supportedRoutes: SectionKeys.ANALYZE.supportedRoutes,
      },
      {
        key: SectionKeys.MANAGE.value,
        supportedRoutes: SectionKeys.MANAGE.supportedRoutes,
      },
    ];

    const activeSection = sections.find((section) =>
      section.supportedRoutes.some((exp) =>
        currentLocation.pathname.includes(exp)
      )
    ) || { key: "0" }; // Default to key "0" if no match

    setActiveKey(activeSection.key);
  }, [currentLocation.pathname]);

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
    // if (isLinkManager) {
    //     options.push({
    //       name: "Links",
    //       path: LINK_ROUTE,
    //     });
    //   }

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1200) {
        setPersistentCollapsed(false);
      } else {
        setPersistentCollapsed(true);
      }
      setHoverToggled(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={sidebarClass}
      style={{
        height: sidenavHeight,
        "--navbar-width": collapsed ? "3rem" : "10rem",
      }}
      data-testid="sidenav"
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
    >
      <div
        className={`menu-toggle-icon${collapsed ? "" : " open"}`}
        role="button"
        aria-label={t("Toggle sidebar")}
      >
        <span onClick={handleToggleClick} data-testid="sidenav-toggle-btn">
          <MenuToggleIcon />
        </span>
      </div>
      {renderLogo(hideLogo, collapsed)}
      <div
        className={`options-container${collapsed ? " collapsed" : ""}`}
        data-testid="options-container"
      >
        <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
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

          {ENABLE_FORMS_MODULE &&
            (isCreateDesigns || isViewDesigns || isManageIntegrations) && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.BUILD.value}
                optionsCount="5"
                mainMenu={t("Build")}
                subMenu={buildSubMenu}
                collapsed={collapsed}
                isExpanded={activeKey === SectionKeys.BUILD.value}
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
                isExpanded={activeKey === SectionKeys.BUILD.value}
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
              isExpanded={activeKey === SectionKeys.ANALYZE.value}
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
        </Accordion>
      </div>
      {isAuthenticated && (
        <UserProfile
          userDetail={userDetail}
          initials={initials}
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
