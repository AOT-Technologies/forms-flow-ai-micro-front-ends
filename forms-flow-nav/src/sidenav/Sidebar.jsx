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
import Appname from "./formsflow.svg";

const Sidebar = React.memo(({ props }) => {
  const [tenantLogo, setTenantLogo] = React.useState("");
  const [tenantName, setTenantName] = React.useState("");
  const [userDetail, setUserDetail] = React.useState({});
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState({ pathname: "/" });
  const [integrationEnabled, setIntegrationEnabled] = React.useState(false);
  const history = useHistory();
  const tenantKey = tenant?.tenantId;
  const { t } = useTranslation();

  // const [activeLink, setActiveLink] = useState("");
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  // const defaultLogoPath =
  //   document.documentElement.style.getPropertyValue("--navbar-logo-path") ||
  //   "/logo.svg";
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  
  const isCreateSubmissions = userRoles.includes("create_submissions");
  const isViewSubmissions = userRoles.includes("view_submissions");
  const isCreateDesigns = userRoles.includes("create_designs");
  const isViewDesigns = userRoles.includes("view_designs");
  const isAdmin = userRoles.includes("admin");
  const isViewTask = userRoles.includes("view_tasks");
  const isManageTask = userRoles.includes("manage_tasks");
  const isViewDashboard = userRoles.includes("view_dashboards");
  const isDashboardManager = userRoles.includes(
    "manage_dashboard_authorizations"
  );
  const isRoleManager = userRoles.includes("manage_roles");
  const isUserManager = userRoles.includes("manage_users");
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

  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };

  return (
    <>
      <div className="sidenav">
        <div className="logo-container">
          <img
            className=""
            src={Appname}
            alt="applicationName"
            data-testid="app-logo"
          />
        </div>
        <div className="options-container" data-testid="options-container">
          <Accordion defaultActiveKey="">
            {ENABLE_FORMS_MODULE &&
              (isCreateSubmissions || isCreateDesigns || isViewDesigns) && (
                <MenuComponent
                  eventKey="0"
                  optionsCount="2"
                  mainMenu="Forms"
                  subMenu={[
                    {
                      name: "All Forms",
                      path: "form",
                      matchExp: createURLPathMatchExp("form", baseUrl),
                    },
                    {
                      name: "Forms Bundle",
                      path: "bundle",
                      matchExp: createURLPathMatchExp("bundle", baseUrl),
                    },
                    { name: "Templates", path: "forms-template-library" },
                  ]}
                />
              )}
            {isCreateDesigns && ENABLE_PROCESSES_MODULE && (
              <MenuComponent
                eventKey="1"
                optionsCount="2"
                mainMenu="Flows"
                subMenu={[
                  {
                    name: "Workflows",
                    path: "processes",
                    matchExp: createURLPathMatchExp("processes", baseUrl),
                  },
                  {
                    name: "Templates",
                    path: "workflow-template-library",
                  },
                ]}
              />
            )}
            {userRoles.includes("manage_integrations")
              ? (integrationEnabled || ENABLE_INTEGRATION_PREMIUM) && (
                  <MenuComponent
                    eventKey="2"
                    optionsCount="3"
                    mainMenu="Integrations"
                    subMenu={[
                      {
                        name: "Recipes",
                        path: "integration/recipes",
                        matchExp: createURLPathMatchExp(
                          "integration/recipes",
                          baseUrl
                        ),
                      },
                      {
                        name: "Connected Apps",
                        path: "integration/connected-apps",
                        matchExp: createURLPathMatchExp(
                          "integration/connected-apps",
                          baseUrl
                        ),
                      },
                      {
                        name: "Templates",
                        path: "integration/library",
                        matchExp: createURLPathMatchExp(
                          "integration/library",
                          baseUrl
                        ),
                      },
                    ]}
                  />
                )
              : null}
            {showApplications &&
              isViewSubmissions &&
              ENABLE_APPLICATIONS_MODULE && (
                <MenuComponent
                  eventKey="3"
                  optionsCount="3"
                  mainMenu="Submissions"
                  subMenu={[
                    {
                      name: "Forms",
                      path: "application",
                      matchExp: createURLPathMatchExp("application", baseUrl),
                    },
                    {
                      name: "Data",
                      path: "data",
                      matchExp: createURLPathMatchExp("data", baseUrl),
                    },
                    {
                      name: "Drafts",
                      path: "draft",
                      matchExp: createURLPathMatchExp("draft", baseUrl),
                    },
                  ]}
                />
              )}
            {isViewDashboard && ENABLE_DASHBOARDS_MODULE && (
              <MenuComponent
                eventKey="4"
                optionsCount="2"
                mainMenu="Dashboards"
                subMenu={[
                  {
                    name: "Metrics",
                    path: "metrics",
                    matchExp: createURLPathMatchExp("metrics", baseUrl),
                  },
                  {
                    name: "Insights",
                    path: "insights",
                    matchExp: createURLPathMatchExp("insights", baseUrl),
                  },
                ]}
              />
            )}
            {(isViewTask || isManageTask) && ENABLE_TASKS_MODULE && (
            <MenuComponent
                eventKey="5"
                optionsCount="0"
                mainMenu="Tasks"
                subMenu={[
                  {
                    path: "task",
                    matchExp: createURLPathMatchExp("task", baseUrl)
                  }
                ]}
              />)}
            {isAdmin && (
              <MenuComponent
                eventKey="6"
                optionsCount="3"
                mainMenu="Admin"
                subMenu={[
                  {
                    name: "Dashboards",
                    path: DASHBOARD_ROUTE,
                    matchExp: createURLPathMatchExp("admin/dashboard", baseUrl),
                  },
                  {
                    name: "Roles",
                    path: ROLE_ROUTE,
                    matchExp: createURLPathMatchExp("admin/roles", baseUrl),
                  },
                  {
                    name: "Users",
                    path: USER_ROUTE,
                    matchExp: createURLPathMatchExp("admin/users", baseUrl),
                  },
                ]}
              />
            )}
          </Accordion>
        </div>
        <div className="user-container">
          <div className="username">
            <div className="user-icon" data-testid="user-icon">
              {initials}
            </div>
            <div>
              <p className="user-name" data-testid="user-name">
                {userDetail?.name || userDetail?.preferred_username}
              </p>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="email-tooltip" className="custom-tooltip">{userDetail?.email}</Tooltip>
                }
              >
                <p className="user-email" data-testid="user-email">
                  {userDetail?.email}
                </p>
              </OverlayTrigger>
            </div>
          </div>
          <div
            className="sign-out-button"
            onClick={logout}
            data-testid="sign-out-button"
          >
            <p>{t("Sign Out")}</p>
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
