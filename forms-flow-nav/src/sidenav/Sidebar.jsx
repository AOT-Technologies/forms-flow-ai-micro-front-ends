import "./Sidebar.scss";
import Accordion from "react-bootstrap/Accordion";
import React, { useEffect, useState } from "react";
import { useHistory ,useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  APPLICATION_NAME,
  MULTITENANCY_ENABLED,
  ENABLE_FORMS_MODULE,
  ENABLE_PROCESSES_MODULE,
  ENABLE_DASHBOARDS_MODULE,
  ENABLE_APPLICATIONS_MODULE,
  ENABLE_TASKS_MODULE,
  ENABLE_INTEGRATION_PREMIUM,
  IS_ENTERPRISE
} from "../constants/constants";
import { StorageService, StyleServices } from "@formsflow/service";
import i18n from "../resourceBundles/i18n";
import { fetchTenantDetails } from "../services/tenant";
import { setShowApplications } from "../constants/userContants";
import { LANGUAGE } from "../constants/constants";
import { checkIntegrationEnabled } from "../services/integration";
import MenuComponent from "./MenuComponent";
// import Appname from "./formsflow.svg";
import { ApplicationLogo } from "@formsflow/components";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import PropTypes from 'prop-types';

const UserProfile = ({ userDetail, initials, handleProfileModal, logout, t }) => (
  <div className="user-container">
    <button className="button-as-div justify-content-start m-2" onClick={handleProfileModal}>
      <div className="user-icon cursor-pointer" data-testid="user-icon">
        {initials}
      </div>
      <div>
        <p className="user-name" data-testid="user-name">{userDetail?.name}</p>
        <p className="user-email" data-testid="user-email">
          {userDetail?.email || userDetail?.preferred_username}
        </p>
      </div>
    </button>
    <button className="button-as-div sign-out-button" onClick={logout} data-testid="sign-out-button">
      <p className="m-0">{t("Sign Out")}</p>
    </button>
  </div>
);

const renderLogo = (hideLogo) => {
  if (hideLogo === "true") return null;

  return (
    <div className="logo-container">
      <ApplicationLogo data-testid="application-logo" />
    </div>
  );
};

const Sidebar = React.memo(({ props, sidenavHeight="100%" }) => {
  const [tenantLogo, setTenantLogo] = React.useState("");
  const [tenantName, setTenantName] = React.useState("");
  const [userDetail, setUserDetail] = React.useState({});
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState({ pathname: "/" });
  const [integrationEnabled, setIntegrationEnabled] = React.useState(false);
  const [form, setForm] = React.useState({});
  const history = useHistory();
  const tenantKey = tenant?.tenantId;
  const formTenant = form?.tenantKey;
  const [showProfile, setShowProfile] = useState(false);
  const hideLogo =  StyleServices?.getCSSVariable("--hide-formsflow-logo");
  const { t } = useTranslation();
  const currentLocation = useLocation();

  // const [activeLink, setActiveLink] = useState("");
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  // const defaultLogoPath =
  //   document.documentElement.style.getPropertyValue("--navbar-logo-path") ||
  //   "/logo.svg";
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE));
  const isCreateSubmissions = userRoles?.includes("create_submissions");
  const isViewSubmissions = userRoles?.includes("view_submissions");
  const isCreateDesigns = userRoles?.includes("create_designs");
  const isViewDesigns = userRoles?.includes("view_designs");
  const isManageSubflows = userRoles?.includes("manage_subflows");
  const isManageDmn = userRoles?.includes("manage_decision_tables");
  const isAdmin = userRoles?.includes("admin");
  const isViewTask = userRoles?.includes("view_tasks");
  const isManageTask = userRoles?.includes("manage_tasks");
  const isViewDashboard = userRoles?.includes("view_dashboards");
  const isDashboardManager = userRoles?.includes(
    "manage_dashboard_authorizations"
  );
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");
  const DASHBOARD_ROUTE = isDashboardManager ? "admin/dashboard" : null;
  const ROLE_ROUTE = isRoleManager ? "admin/roles" : null;
  const USER_ROUTE = isUserManager ? "admin/users" : null;
  const isAuthenticated = instance?.isAuthenticated();
  const showApplications = setShowApplications(userDetail?.groups);
  const [activeKey,setActiveKey] = useState(0);

  const getInitials = (name) => {
    if (!name) return "";
    const nameParts = name.split(" ");
    const initials = nameParts.map((part) => part[0]).join("");
    return initials.substring(0, 2).toUpperCase(); // Get the first two initials
  };

  const userName = userDetail?.name || userDetail?.preferred_username || "";
  const initials = getInitials(userName);

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
      if (data) {
        setTenant(data);
        if (!JSON.parse(StorageService.get("TENANT_DATA"))?.name) {
          StorageService.save("TENANT_DATA", JSON.stringify(data.tenantData));
        }
      }
    });
    props.subscribe("ES_ROUTE", (msg, data) => {
      if (data) {
        setLocation(data);
      }
    });
    props.subscribe("ES_FORM", (msg, data) => {
      if (data) {
        setForm(data);
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
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
        const locale = userDetail?.locale || tenant?.tenantData?.details?.locale || LANGUAGE;
        i18n.changeLanguage(locale);
    }, [userDetail]);

  React.useEffect(() => {
    const data = JSON.parse(StorageService.get("TENANT_DATA"));
    if (MULTITENANCY_ENABLED && data?.details) {
      setTenantName(data?.details?.applicationTitle);
      const logo = data?.details?.customLogo?.logo;
      setTenantLogo(logo);
    }
  }, [tenant]);


  const SectionKeys = { 
    DESIGN: {
      value: "design",
      supportedRoutes: ["formflow", "bundleflow", "subflow", "decision-table","integration/recipes","integration/connected-apps","integration/library"],
    },
    SUBMIT: {
      value: "submit",
      supportedRoutes: ["form", "bundle", "application", "draft"],
    },
    REVIEW: {
      value: "review",
      supportedRoutes: ["task"],
    },
    ANALYZE: {
      value: "analyze",
      supportedRoutes: ["metrics", "insights"],
    },
    MANAGE: {
      value: "manage",
      supportedRoutes: ["admin/dashboard", "admin/roles", "admin/users"],
    },
  };  
  
  useEffect((()=>{
    const sections = [
      { key: SectionKeys.DESIGN.value, supportedRoutes: SectionKeys.DESIGN.supportedRoutes },
      { key: SectionKeys.SUBMIT.value, supportedRoutes: SectionKeys.SUBMIT.supportedRoutes },
      { key: SectionKeys.REVIEW.value, supportedRoutes: SectionKeys.REVIEW.supportedRoutes },
      { key: SectionKeys.ANALYZE.value, supportedRoutes: SectionKeys.ANALYZE.supportedRoutes },
      { key: SectionKeys.MANAGE.value, supportedRoutes: SectionKeys.MANAGE.supportedRoutes },
    ];
    
    const activeSection =
    sections.find((section) =>
      section.supportedRoutes.some((exp) => currentLocation.pathname.includes(exp))
    ) || { key: "0" }; // Default to key "0" if no match
  
    setActiveKey(activeSection.key);
  }),[currentLocation.pathname]);
  
  useEffect(() => {
    if (!isAuthenticated && formTenant && MULTITENANCY_ENABLED) {
      setLoginUrl(`/tenant/${formTenant}/`);
    }
  }, [isAuthenticated, formTenant]);

  const handleProfileModal = () => setShowProfile(true); 
  const handleProfileClose = () => setShowProfile(false);

  const logout = () => {
    history.push(baseUrl);
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
  

  return (
      <div className="sidenav" style={{ height: sidenavHeight }}>
        {renderLogo(hideLogo)} 
        <div className="options-container" data-testid="options-container">
          <Accordion activeKey={activeKey} onSelect={(key) => setActiveKey(key)}>
            {ENABLE_FORMS_MODULE &&
              (isCreateDesigns || isViewDesigns) && (
                <MenuComponent
                  baseUrl={baseUrl}
                  eventKey={SectionKeys.DESIGN.value}
                  optionsCount="5"
                  mainMenu="Design"
                  subMenu={[
                    {
                      name: "Forms",
                      path: "formflow",
                    },
                    ...(IS_ENTERPRISE
                      ? [
                          {
                            name: "Bundle",
                            path: "bundleflow",
                            isPremium:true
                          },
                        ]
                    : []),
                    // { name: "Templates", path: "forms-template-library" }, // TBD : Templates to be added on a later stage
                    ...(IS_ENTERPRISE && userRoles?.includes("manage_integrations") &&
                    (integrationEnabled || ENABLE_INTEGRATION_PREMIUM)
                      ? [
                          {
                            name: "Integrations",
                            path: "integration/recipes",
                            supportedSubRoutes: ["integration/recipes","integration/connected-apps", "integration/library"],
                            isPremium:true
                          },
                        ]
                      : []),
                      ...(isManageSubflows && ENABLE_PROCESSES_MODULE
                        ? [
                          {
                            name: "Subflows",
                            path: "subflow",
                          },
                          ]
                        : []),
                      ...(isManageDmn && ENABLE_PROCESSES_MODULE
                        ? [
                          {
                            name: "Decision Tables",
                            path: "decision-table",
                          },
                          ]
                        : []),
                  ]}
                  subscribe={props.subscribe}
                />
              )}
          {(isCreateSubmissions || (showApplications && isViewSubmissions && ENABLE_APPLICATIONS_MODULE)) && (
            <MenuComponent
              baseUrl={baseUrl}
              eventKey={SectionKeys.SUBMIT.value}
              optionsCount="1"
              mainMenu="Submit"
              subMenu={[
                {
                  name: "Forms",
                  path: "form",
                  supportedSubRoutes: ["form", "bundle", "application", "draft"],
                  unsupportedSubRoutes: ["formflow", "bundleflow"],
                },
              ]}
              subscribe={props.subscribe}
            />
          )}

              {(isViewTask || isManageTask) && ENABLE_TASKS_MODULE && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.REVIEW.value}
                optionsCount="1"
                mainMenu="Review"
                subMenu={[
                  {
                    name: "Tasks",
                    path: "task",
                  },
                ]}
                subscribe={props.subscribe}
              />
            )}
            {isViewDashboard  && ENABLE_DASHBOARDS_MODULE && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.ANALYZE.value}
                optionsCount="2"
                mainMenu="Analyze"
                subMenu={[
                  {
                    name: "Metrics",
                    path: "metrics",
                  },
                  {
                    name: "Insights",
                    path: "insights",
                  }
                ]}
                subscribe={props.subscribe}
              />
            )}
            {isAdmin && (
              <MenuComponent
                baseUrl={baseUrl}
                eventKey={SectionKeys.MANAGE.value}
                optionsCount="3"
                mainMenu="Manage"
                subMenu={manageOptions()}
                subscribe={props.subscribe}
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
        />)}
        {
          showProfile && <ProfileSettingsModal 
          show={showProfile}  
          onClose={handleProfileClose} 
          tenant={tenant}
          publish={props.publish}
        />
        }
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
