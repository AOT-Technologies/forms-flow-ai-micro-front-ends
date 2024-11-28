import "./Sidebar.scss";
import Accordion from "react-bootstrap/Accordion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, BrowserRouter, useHistory } from "react-router-dom";
import { getUserRoleName, getUserRolePermission } from "../helper/user";
import createURLPathMatchExp from "../helper/regExp/pathMatch";
import { useTranslation } from "react-i18next";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import {
  CLIENT,
  STAFF_REVIEWER,
  APPLICATION_NAME,
  STAFF_DESIGNER,
  MULTITENANCY_ENABLED,
  ADMIN_ROLE,
  ENABLE_FORMS_MODULE,
  ENABLE_PROCESSES_MODULE,
  ENABLE_DASHBOARDS_MODULE,
  ENABLE_APPLICATIONS_MODULE,
  ENABLE_TASKS_MODULE,
  ENABLE_INTEGRATION_PREMIUM,
  IS_ENTERPRISE
} from "../constants/constants";
import { StorageService } from "@formsflow/service";
import { fetchSelectLanguages, updateUserlang } from "../services/language";
import i18n from "../resourceBundles/i18n";
import { fetchTenantDetails } from "../services/tenant";
import { setShowApplications } from "../constants/userContants";
import { LANGUAGE } from "../constants/constants";
import { Helmet } from "react-helmet";
import { checkIntegrationEnabled } from "../services/integration";
import MenuComponent from "./MenuComponent";
// import Appname from "./formsflow.svg";
import { ApplicationLogo } from "@formsflow/components";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import PropTypes from 'prop-types';

const Sidebar = React.memo(({ props }) => {
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

  const { t } = useTranslation();

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
  const { pathname } = location;
  const isAuthenticated = instance?.isAuthenticated();
  const showApplications = setShowApplications(userDetail?.groups);

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
      JSON.parse(StorageService.get(StorageService.User.USER_DETAILS))
    );
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

  React.useEffect(() => {
    const data = JSON.parse(StorageService.get("TENANT_DATA"));
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
    history.push(baseUrl);
    instance.userLogout();
  };

  const manageOptions = () => {
    return (
      [
        {
          name: "Dashboards",
          path: DASHBOARD_ROUTE,
          matchExps: [
            createURLPathMatchExp("admin/dashboard", baseUrl),
          ],
        },
        {
          name: "Roles",
          path: ROLE_ROUTE,
          matchExps: [createURLPathMatchExp("admin/roles", baseUrl)],
        },
        {
          name: "Users",
          path: USER_ROUTE,
          matchExps: [createURLPathMatchExp("admin/users", baseUrl)],
        },
      ]
    )
  }

  return (
      <div className="sidenav">
        <div className="logo-container">
          {/* <img
            className=""
            src={Appname}
            alt="applicationName"
            data-testid="app-logo"
          /> */}
          <ApplicationLogo data-testid="application-logo" />
        </div>
        <div className="options-container" data-testid="options-container">
          <Accordion defaultActiveKey="">
            {ENABLE_FORMS_MODULE &&
              (isCreateDesigns || isViewDesigns) && (
                <MenuComponent
                  eventKey="0"
                  optionsCount="5"
                  mainMenu="Design"
                  subMenu={[
                    {
                      name: "Forms",
                      path: "formflow",
                      matchExps: [
                        createURLPathMatchExp("formflow", baseUrl),
                      ]
                    },
                    ...(IS_ENTERPRISE
                      ? [
                          {
                            name: "Bundle",
                            path: "bundle",
                            matchExps: [
                              createURLPathMatchExp("bundle", baseUrl),
                            ],
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
                            matchExps: [
                              createURLPathMatchExp(
                                "integration/recipes",
                                baseUrl
                              ),
                            ],
                          },
                        ]
                      : []),
                    ...(isCreateDesigns && ENABLE_PROCESSES_MODULE) ? [
                      {
                        name: "Sub - flows",
                        path: "subflow",
                        matchExps: [createURLPathMatchExp("subflow", baseUrl)],
                      },
                      {
                        name: "Decision Tables",
                        path: "decision-table",
                        matchExps: [createURLPathMatchExp("decision-table", baseUrl)],
                      },
                    ] : [],
                  ]}
                  subscribe={props.subscribe}
                />
              )}
            {showApplications &&
              isViewSubmissions &&
              ENABLE_APPLICATIONS_MODULE && (
                <MenuComponent
                  eventKey="1"
                  optionsCount="1"
                  mainMenu="Submit"
                  subMenu={[
                    {
                      name: "Forms",
                      path: "form",
                      matchExps: [
                        createURLPathMatchExp("form", baseUrl),
                        createURLPathMatchExp("application", baseUrl),
                        createURLPathMatchExp("draft", baseUrl),
                      ],
                    },
                  ]}
                  subscribe={props.subscribe}
                />
              )}
              {(isViewTask || isManageTask) && ENABLE_TASKS_MODULE && (
              <MenuComponent
                eventKey="2"
                optionsCount="1"
                mainMenu="Review"
                subMenu={[
                  {
                    name: "Task",
                    path: "task",
                    matchExps: [createURLPathMatchExp("task", baseUrl)],
                  },
                ]}
                subscribe={props.subscribe}
              />
            )}
            {isViewDashboard && ENABLE_DASHBOARDS_MODULE && (
              <MenuComponent
                eventKey="3"
                optionsCount="2"
                mainMenu="Analyze"
                subMenu={[
                  {
                    name: "Metrics",
                    path: "metrics",
                    matchExps: [
                      createURLPathMatchExp("metrics", baseUrl),
                    ],
                  },
                  {
                    name: "Insights",
                    path: "insights",
                    matchExps: [
                      createURLPathMatchExp("insights", baseUrl),
                    ],
                  }
                ]}
                subscribe={props.subscribe}
              />
            )}
            {isAdmin && (
              <MenuComponent
                eventKey="4"
                optionsCount="3"
                mainMenu="Manage"
                subMenu={manageOptions()}
                subscribe={props.subscribe}
              />
            )}
          </Accordion>
        </div>
        {isAuthenticated && (<div className="user-container">
          <div className="username">
            <div className="user-icon" data-testid="user-icon">
              {initials}
            </div>
            <div>
            <p
                className="user-name"
                data-testid="user-name"
                onClick={handleProfileModal}  //profile settings modal for language selection
              >
                {userDetail?.name}
              </p>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="email-tooltip" className="custom-tooltip">
                    {userDetail?.preferred_username}
                  </Tooltip>
                }
              >
                <p className="user-email" data-testid="user-email">
                  {userDetail?.preferred_username}
                </p>
              </OverlayTrigger>
            </div>
          </div>
          <div
            className="sign-out-button"
            onClick={logout}
            data-testid="sign-out-button"
          >
            <p className="m-0">{t("Sign Out")}</p>
          </div>
        </div>)}
        <ProfileSettingsModal 
        show={showProfile} 
        onClose={handleProfileClose} 
        tenant={tenant}
        publish={props.publish}
      />
      </div>
  );
});

Sidebar.propTypes = {
  props: PropTypes.shape({
    subscribe: PropTypes.func.isRequired, 
    getKcInstance: PropTypes.func.isRequired, 
  }).isRequired,
};

export default Sidebar;
