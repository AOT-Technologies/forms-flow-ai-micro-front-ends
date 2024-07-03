import "./Sidebar.scss";
import Accordion from "react-bootstrap/Accordion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, BrowserRouter, useHistory } from "react-router-dom";
import { getUserRoleName, getUserRolePermission } from "./helper/user";
import createURLPathMatchExp from "./helper/regExp/pathMatch";
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
} from "./constants/constants";
import { StorageService } from "@formsflow/service";
import { fetchSelectLanguages, updateUserlang } from "./services/language";
import i18n from "./resourceBundles/i18n";
import { fetchTenantDetails } from "./services/tenant";
import { setShowApplications } from "./constants/userContants";
import { LANGUAGE } from "./constants/constants";
import { Helmet } from "react-helmet";
import { checkIntegrationEnabled } from "./services/integration";

const Sidebar = React.memo(({ props }) => {
  const history = useHistory();
  const [activeLink, setActiveLink] = useState("");
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const defaultLogoPath =
    document.documentElement.style.getPropertyValue("--navbar-logo-path") ||
    "/logo.svg";
  const logoPath = MULTITENANCY_ENABLED ? tenantLogo : defaultLogoPath;
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const [userDetail, setUserDetail] = React.useState({});
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState({ pathname: "/" });
  const { pathname } = location;

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

  const handleLinkClick = (link) => {
    history.push(`${baseUrl}${link}`);
    setActiveLink(link);
  };

  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };;

  return (
    <div className="sidenav">
      <div className="logo-container">
        <img className="logo2" src={logoPath} alt="applicationName" />
        <a className="application-name">formsflow.ai</a>
      </div>
      <div className="options-container">
        <Accordion>
          <Accordion.Item eventKey="0">
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
          </Accordion.Item>
          <Accordion.Item eventKey="1">
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
          </Accordion.Item>
          <Accordion.Item eventKey="2">
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
          </Accordion.Item>
          <Accordion.Item eventKey="3">
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
          </Accordion.Item>
          {getUserRolePermission(userRoles, STAFF_REVIEWER)
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
            : null}
          <Accordion.Item eventKey="5" className="no-arrow">
            {getUserRolePermission(userRoles, STAFF_REVIEWER)
              ? ENABLE_TASKS_MODULE && (
                  <Accordion.Header
                   className={`no-arrow ${pathname.match(
                    createURLPathMatchExp("task", baseUrl)) ? "active" : ""}`}
                    onClick={() => handleLinkClick("task")}
                  >
                    Tasks
                  </Accordion.Header>
                )
              : null}
          </Accordion.Item>
          <Accordion.Item eventKey="6">
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
          </Accordion.Item>
        </Accordion>
      </div>
      <div className="user-container">
        <div className="username">
          <h5>{userDetail?.name || userDetail?.preferred_username}</h5>
          <p>{userDetail?.email}</p>
        </div>
        <div className="sign-out-button" onClick={logout}>
         <p>Sign Out</p>
        </div>
      </div>
    </div>
  );
});

export default Sidebar;
