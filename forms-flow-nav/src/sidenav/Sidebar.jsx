import "./Sidebar.scss";
import Accordion from "react-bootstrap/Accordion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, BrowserRouter, useHistory } from "react-router-dom";
import { getUserRoleName, getUserRolePermission } from "../helper/user";
import createURLPathMatchExp from "../helper/regExp/pathMatch";
import { useTranslation } from "react-i18next";
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
import AccordionComponent from "./accordionComponent";
import Appname from "./formsflow.svg";
import HamburgerMenu from "./hamburgerMenu";

const Sidebar = React.memo(({ props }) => {
  // const MULTITENANCY_ENABLED = true
  // console.log(MULTITENANCY_ENABLED)
  console.log(props);
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

  const handleLinkClick = (link) => {
    history.push(`${baseUrl}${link}`);
    setActiveLink(link);
  };
  
  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };

  return (
    <>
      <div className="sidenav">
        <div className="logo-container">
          <img className="" src={Appname} alt="applicationName"  data-testid="app-logo"/>
        </div>
        <div className="options-container" data-testid="options-container">
          <Accordion defaultActiveKey="">
            {ENABLE_FORMS_MODULE && (
              <AccordionComponent
                eventKey="0"
                header="Forms"
                links={[
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
            {getUserRolePermission(userRoles, STAFF_DESIGNER)
              ? ENABLE_PROCESSES_MODULE && (
                  <AccordionComponent
                    eventKey="1"
                    header="Flows"
                    links={[
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
                )
              : null}
            {getUserRolePermission(userRoles, STAFF_DESIGNER)
              ? (integrationEnabled || ENABLE_INTEGRATION_PREMIUM) && (
                  <AccordionComponent
                    eventKey="2"
                    header="Integrations"
                    links={[
                      {
                        name: "Recipes",
                        path: "integration/recipes",
                        matchExp: createURLPathMatchExp("integration/recipes", baseUrl),
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
            {showApplications
              ? getUserRolePermission(userRoles, STAFF_REVIEWER) ||
                getUserRolePermission(userRoles, CLIENT)
                ? ENABLE_APPLICATIONS_MODULE && (
                    <AccordionComponent
                      eventKey="3"
                      header="Submissions"
                      links={[
                        {
                          name: "Forms",
                          path: "application",
                          matchExp: createURLPathMatchExp(
                            "application",
                            baseUrl
                          ),
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
                  )
                : null
              : null}
            {getUserRolePermission(userRoles, STAFF_REVIEWER)
              ? ENABLE_DASHBOARDS_MODULE && (
                  <AccordionComponent
                    eventKey="4"
                    header="Dashboards"
                    links={[
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
                )
              : null}
            <Accordion.Item eventKey="5" className="no-arrow">
              {getUserRolePermission(userRoles, STAFF_REVIEWER)
                ? ENABLE_TASKS_MODULE && (
                    <Accordion.Header
                      className={`no-arrow ${
                        pathname.match(createURLPathMatchExp("task", baseUrl))
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleLinkClick("task")}
                      data-testid="accordion-header-task"
                      aria-label="Tasks"
                    >
                      {t("Tasks")}
                    </Accordion.Header>
                  )
                : null}
            </Accordion.Item>
            {getUserRolePermission(userRoles, ADMIN_ROLE) ? (
              <AccordionComponent
                eventKey="6"
                header="Admin"
                links={[
                  {
                    name: "Dashboards",
                    path: "admin/dashboard",
                    matchExp: createURLPathMatchExp("admin/dashboard", baseUrl),
                  },
                  {
                    name: "Roles",
                    path: "admin/roles",
                    matchExp: createURLPathMatchExp("admin/roles", baseUrl),
                  },
                  {
                    name: "Users",
                    path: "admin/users",
                    matchExp: createURLPathMatchExp("admin/users", baseUrl),
                  },
                ]}
              />
            ) : null}
          </Accordion>
        </div>
        <div className="user-container">
          <div className="username">
            <div className="user-icon" data-testid="user-icon">{initials}</div>
            <div>
              <p className="user-name" data-testid="user-name">
                {userDetail?.name || userDetail?.preferred_username}
              </p>
              <p className="user-email" data-testid="user-email">{userDetail?.email}</p>
            </div>
          </div>
          <div className="sign-out-button" onClick={logout} data-testid="sign-out-button">
            <p>{t("Sign Out")}</p>
          </div>
        </div>
      </div>
    </>
  );
});

export default Sidebar;
