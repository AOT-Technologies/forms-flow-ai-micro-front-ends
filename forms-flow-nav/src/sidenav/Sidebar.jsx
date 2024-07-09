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
import AccordionComponent  from "./accordionComponent";
import Appname from './formsflow.svg';
import HamburgerMenu from "./hamburgerMenu";

const Sidebar = React.memo(({ props }) => {
  // const MULTITENANCY_ENABLED = true
  // console.log(MULTITENANCY_ENABLED)
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
    if (!name) return '';
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part[0]).join('');
    return initials.substring(0, 2).toUpperCase(); // Get the first two initials
  };

  const userName = userDetail?.name || userDetail?.preferred_username || '';
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

  // const handleLinkClick = (link) => {
  //   console.log(link)
  //   console.log(baseUrl)
  //   history.push(`${baseUrl}${link}`);
  //   setActiveLink(link);
  // };

  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };


  return (
    <>
     {MULTITENANCY_ENABLED && (
        <div className="multitenancy-header">
          <img className="multitenancy-logo" src={tenantLogo} alt="custom logo" />
          <span className="multitenancy-app-name">{tenantName}</span>
        </div>
      )}
    <HamburgerMenu />
    <div className="sidenav">
      <div className="logo-container">
        <img className="" src={Appname} alt="applicationName" />
      </div>
      <div className="options-container">
        <Accordion defaultActiveKey="">
          {/* <Accordion.Item eventKey="0">
            <Accordion.Header>Forms</Accordion.Header>
            <Accordion.Body>
              {ENABLE_FORMS_MODULE && (
                <a
                  className={` accordion-link ${
                    (pathname.match(
                      createURLPathMatchExp("form", baseUrl)
                    )) &&
                    !(
                      pathname.includes("draft") ||
                      pathname.includes("submission")
                    )
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleLinkClick("form")}
                >
                  All Forms
                </a>
              )}
              <a
                className={`accordion-link ${
                    (pathname.match(
                        createURLPathMatchExp("bundle", baseUrl)
                      )) &&
                    !(
                      pathname.includes("draft") ||
                      pathname.includes("submission")
                    )
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("bundle")}
              >
                Forms Bundle
              </a>
              <a
                className={`accordion-link ${
                  activeLink === "template-library" ? "active" : ""
                }`}
                onClick={() => handleLinkClick("template-library")}
              >
                Template Library
              </a>
            </Accordion.Body>
          </Accordion.Item> */}
          {ENABLE_FORMS_MODULE && (
            <AccordionComponent
              eventKey="0"
              header="Forms"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "All Forms", path: "form", matchExp: createURLPathMatchExp("form", baseUrl) },
                { name: "Forms Bundle", path: "bundle", matchExp: createURLPathMatchExp("bundle", baseUrl) },
                { name: "Template Library", path: "forms-template-library" }
              ]}
            />
          )}
          {/* <Accordion.Item eventKey="1">
            <Accordion.Header>Flows</Accordion.Header>
            <Accordion.Body>
              {getUserRolePermission(userRoles, STAFF_DESIGNER)
                ? ENABLE_PROCESSES_MODULE && (
                    <a
                     className={`accordion-link ${
                        pathname.match(
                          createURLPathMatchExp("processes", baseUrl)
                        )
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleLinkClick("processes")}
                    >
                      Workflows
                    </a>
                  )
                : null}
              <a
                className={`accordion-link ${
                  activeLink === "flows-template-library" ? "active" : ""
                }`}
                onClick={() => handleLinkClick("flows-template-library")}
              >
                Template Library
              </a>
            </Accordion.Body>
          </Accordion.Item> */}
          {getUserRolePermission(userRoles, STAFF_DESIGNER)
                ? ENABLE_PROCESSES_MODULE && (
          <AccordionComponent
              eventKey="1"
              header="Flows"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "Workflows", path: "processes", matchExp: createURLPathMatchExp("processes", baseUrl) },
                { name: "Template Library", path: "-workflow-template-library" }
              ]}
            /> ) : null}
          {/* <Accordion.Item eventKey="2">
            <Accordion.Header>Integrations</Accordion.Header>
            <Accordion.Body>
              <a
                   className={`accordion-link ${
                    pathname.match(
                      createURLPathMatchExp("integration", baseUrl)
                    )
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("integration/recipes")}
              >
                Recipes
              </a>
              <a
                 className={`accordion-link ${
                    pathname.match(
                      createURLPathMatchExp("integration/connected-apps", baseUrl)
                    )
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("integration/connected-apps")}
              >
                Connected Apps
              </a>
              <a
                className={`accordion-link ${
                    pathname.match(
                      createURLPathMatchExp("integration/library", baseUrl)
                    )
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("integration/library")}
              >
                Template Library
              </a>
            </Accordion.Body>
          </Accordion.Item> */}
          {getUserRolePermission(userRoles, STAFF_DESIGNER)
                    ? (integrationEnabled || ENABLE_INTEGRATION_PREMIUM) && (
          <AccordionComponent
              eventKey="2"
              header="Integrations"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "Recipes", path: "integration/recipes", matchExp: createURLPathMatchExp("integration", baseUrl) },
                { name: "Connected Apps", path: "integration/connected-apps",  matchExp: createURLPathMatchExp("integration/connected-apps", baseUrl) },
                { name: "Template Library", path: "integration/library",  matchExp: createURLPathMatchExp("integration/library", baseUrl) }
              ]}
            />  )
            : null}
          {/* <Accordion.Item eventKey="3">
            <Accordion.Header>Submissions</Accordion.Header>
            <Accordion.Body>
              <a
                className={`accordion-link ${
                    pathname.match(
                      createURLPathMatchExp("application", baseUrl)
                    ) ||
                    pathname.includes("submission")
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("application")}
              >
                Forms
              </a>
              <a
                className={`accordion-link ${
                  activeLink === "Data" ? "active" : ""
                }`}
                onClick={() => handleLinkClick("Data")}
              >
                Data
              </a>
              <a
                className={`accordion-link ${
                    pathname.match(
                      createURLPathMatchExp("application/draft", baseUrl)
                    ) ||
                    pathname.includes("draft")
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("draft")}
              >
                Drafts
              </a>
            </Accordion.Body>
          </Accordion.Item> */}
          {showApplications
                    ? getUserRolePermission(userRoles, STAFF_REVIEWER) ||
                      getUserRolePermission(userRoles, CLIENT)
                      ? ENABLE_APPLICATIONS_MODULE && (
          <AccordionComponent
              eventKey="3"
              header="Submissions"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "Forms", path: "application", matchExp: createURLPathMatchExp("application", baseUrl) },
                { name: "Data", path: "data",  matchExp: createURLPathMatchExp("data", baseUrl) },
                { name: "Drafts", path: "draft",  matchExp: createURLPathMatchExp("draft", baseUrl) }
              ]}
            /> )
            : null
          : null}
          {/* {getUserRolePermission(userRoles, STAFF_REVIEWER)
            ? ENABLE_DASHBOARDS_MODULE && (
                <>
                  <Accordion.Item eventKey="4">
                    <Accordion.Header>Dashboards</Accordion.Header>
                    <Accordion.Body>
                      <a
                        className={`accordion-link ${
                            pathname.match(
                              createURLPathMatchExp("metrics", baseUrl)
                            ) 
                              ? "active"
                              : ""
                          }`}
                        onClick={() => handleLinkClick("metrics")}
                      >
                        Metrics
                      </a>
                      <a
                         className={`accordion-link ${
                            pathname.match(
                              createURLPathMatchExp("insights", baseUrl)
                            )
                              ? "active"
                              : ""
                          }`}
                        onClick={() => handleLinkClick("insights")}
                      >
                        Insights
                      </a>
                    </Accordion.Body>
                  </Accordion.Item>
                </>
              )
            : null} */}
            {getUserRolePermission(userRoles, STAFF_REVIEWER)
            ? ENABLE_DASHBOARDS_MODULE && (
            <AccordionComponent
              eventKey="4"
              header="Dashboards"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "Metrics", path: "metrics", matchExp: createURLPathMatchExp("metrics", baseUrl) },
                { name: "Insights", path: "insights",  matchExp: createURLPathMatchExp("insights", baseUrl) },
              ]}
            />  )
            : null}
          <Accordion.Item eventKey="5" className="no-arrow">
            {getUserRolePermission(userRoles, STAFF_REVIEWER)
              ? ENABLE_TASKS_MODULE && (
                  <Accordion.Header
                   className={`no-arrow ${pathname.match(
                    createURLPathMatchExp("task", baseUrl)) ? "active" : ""}`}
                    onClick={() => handleLinkClick("task")}
                  >
                    {t("Tasks")}
                  </Accordion.Header>
                )
              : null}
          </Accordion.Item>
          {/* <Accordion.Item eventKey="6">
            <Accordion.Header>Admin</Accordion.Header>
            <Accordion.Body>
              <a
                className={`accordion-link ${
                    pathname.match(createURLPathMatchExp("admin", baseUrl)) 
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("admin/dashboard")}
              >
                Dashboards
              </a>
              <a
                className={`accordion-link ${
                    pathname.match(createURLPathMatchExp("admin/roles", baseUrl))
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("admin/roles")}
              >
                Roles
              </a>
              <a
                className={` accordion-link ${
                    pathname.match(createURLPathMatchExp("admin/users", baseUrl))
                      ? "active"
                      : ""
                  }`}
                onClick={() => handleLinkClick("admin/users")}
              >
                Users
              </a>
            </Accordion.Body>
          </Accordion.Item> */}
          {getUserRolePermission(userRoles, ADMIN_ROLE) ? (
          <AccordionComponent
              eventKey="6"
              header="Admin"
              // activeLink={activeLink}
              // handleLinkClick={handleLinkClick}
              links={[
                { name: "Dashboards", path: "admin/dashboard", matchExp: createURLPathMatchExp("admin", baseUrl) },
                { name: "Roles", path: "admin/roles",  matchExp: createURLPathMatchExp("admin/roles", baseUrl) },
                { name: "Users", path: "admin/users",  matchExp: createURLPathMatchExp("admin/users", baseUrl) },
              ]}
            /> ) : null}
        </Accordion>
      </div>
      <div className="user-container">
        <div className="username">
          <div className="user-icon">{initials}</div>
          <div>
              <p className="user-name">{userDetail?.name || userDetail?.preferred_username}</p>
              <p className="user-email">{userDetail?.email}</p>
          </div> 
        </div>
        <div className="sign-out-button" onClick={logout}>
         <p>{t("Sign Out")}</p>
        </div>
      </div>
    </div>
    </>
  );
});

export default Sidebar;
