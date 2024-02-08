import React, { useEffect, useMemo, useState } from "react";
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
} from "./constants/constants";
import "./Navbar.css";
import { StorageService } from "@formsflow/service";
import { fetchSelectLanguages, updateUserlang } from "./services/language";
import i18n from "./resourceBundles/i18n";
import { fetchTenantDetails } from "./services/tenant";
import { setShowApplications } from "./constants/userContants";
import { LANGUAGE } from "./constants/constants";
import { Helmet } from "react-helmet";
const NavBar = React.memo(({ props }) => {
  const history = useHistory();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState({ pathname: "/" });
  const [form, setForm] = React.useState({});
  const [selectLanguages, setSelectLanguages] = React.useState([]);
  const [applicationTitle, setApplicationTitle] = React.useState("");
  const [tenantLogo, setTenantLogo] = React.useState("/logo_skeleton.svg");
  const defaultLogoPath =
    document.documentElement.style.getPropertyValue("--navbar-logo-path") ||
    "/logo.svg";
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

  React.useEffect(() => {
    if (MULTITENANCY_ENABLED && !tenant.tenantId && instance?.isAuthenticated) {
      fetchTenantDetails(setTenant);
    }
  }, [instance]);

  React.useEffect(() => {
    const data = JSON.parse(StorageService.get("TENANT_DATA"));
    if (data?.details) {
      setApplicationTitle(data?.details?.applicationTitle);
      setTenantLogo(data?.details?.customLogo?.logo || "/logo.svg");
    }
  }, [tenant]);

  const isAuthenticated = instance?.isAuthenticated();
  const { pathname } = location;
  const [userDetail, setUserDetail] = React.useState({});
  const [lang, setLang] = React.useState(userDetail?.locale); 
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const showApplications = setShowApplications(userDetail?.groups);
  const tenantKey = tenant?.tenantId;
  const formTenant = form?.tenantKey;
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  /**
   * For anonymous forms the only way to identify the tenant is through the
   * form data with current implementation. To redirect to the correct tenant
   * we will use form as the data source for the tenantKey
   */

  const [loginUrl, setLoginUrl] = useState(baseUrl);

  const logoPath = MULTITENANCY_ENABLED ? tenantLogo : defaultLogoPath;
  const getAppName = useMemo(
    () => () => {
      if (!MULTITENANCY_ENABLED) {
        return APPLICATION_NAME;
      }
      // TODO: Need a propper fallback component prefered a skeleton.
      return applicationTitle || "";
    },
    [MULTITENANCY_ENABLED, applicationTitle]
  );
  const appName = getAppName();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated && formTenant && MULTITENANCY_ENABLED) {
      setLoginUrl(`/tenant/${formTenant}/`);
    }
  }, [isAuthenticated, formTenant]);

  useEffect(() => {
    fetchSelectLanguages((data) => {
      setSelectLanguages(data);
    });
  }, []);

  useEffect(() => {
    const language = lang ? lang : LANGUAGE;
    props.publish("ES_CHANGE_LANGUAGE", language);
    i18n.changeLanguage(language);
    localStorage.setItem("lang", language);
  }, [lang]);

 

  React.useEffect(() => {
    setUserDetail(
      JSON.parse(StorageService.get(StorageService.User.USER_DETAILS))
    );
  }, [instance]);

  React.useEffect(() => {
    if (!lang) {
      const locale = instance?.getUserData()?.locale;
      setLang(locale);
    }
  }, [instance]);

  const handleOnclick = (selectedLang) => {
    setLang(selectedLang);
    updateUserlang(selectedLang, instance);
  };

  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };
  
  return (
  <>
   <Helmet>
    <title>{MULTITENANCY_ENABLED ? applicationTitle : "formsflow.ai"}</title>
    <link rel="icon" type="image/png" href={MULTITENANCY_ENABLED ? tenantLogo : null} />
  </Helmet>
    <BrowserRouter>
      <header className="navbar-background shadow">
        <Container>
          <Navbar  collapseOnSelect expand="lg" className={`navbar-background p-0 m-0 ${!isAuthenticated ? 'justify-content-between':''}`}>
            <Navbar.Brand href={`${baseUrl}`} className="d-flex col-3 px-0">
              <img
                className="custom-logo"
                src={logoPath}
                alt="Logo"
              />
              <div className="custom-app-name">{appName}</div>
            </Navbar.Brand>
            {isAuthenticated && <Navbar.Toggle aria-controls="responsive-navbar-nav" />}
             
            {isAuthenticated ? (
              <Navbar.Collapse
                id="responsive-navbar-nav"
                className="d-lg-flex justify-content-between h-100"
              >
                <Nav 
                  id="main-menu-nav"
                  className="align-items-lg-center justify-content-start w-100"
                >
                  {ENABLE_FORMS_MODULE && (
                    <Nav.Link
                      as={Link}
                      eventKey="form"
                      to={`${baseUrl}form`}
                      className={`nav-menu-item py-md-3 px-0 mx-2 ${
                       ( pathname.match(createURLPathMatchExp("form", baseUrl)) ||  pathname.match(createURLPathMatchExp("bundle", baseUrl)))
                          ? "active"
                          : ""
                      }`}
                    >
                      <i className="fa-solid fa-file-lines mr-2" />
                      {t("Forms")}
                    </Nav.Link>
                  )}


                  {getUserRolePermission(userRoles, ADMIN_ROLE) ? (
                    <Nav.Link 
                    eventKey="admin"
                      as={Link}
                      to={`${baseUrl}admin/dashboard`}
                      className={`nav-menu-item py-md-3 px-0 mx-2 ${
                        pathname.match(createURLPathMatchExp("admin", baseUrl))
                          ? "active"
                          : ""
                      }`}
                    >
                      <i className="fa-solid fa-user-check mr-2" />
                      {t("Admin")}
                    </Nav.Link>
                  ) : null}

                  {getUserRolePermission(userRoles, STAFF_DESIGNER)
                    ? ENABLE_PROCESSES_MODULE && (
                        <Nav.Link
                        eventKey="processes"
                          as={Link}
                          to={`${baseUrl}processes`}
                          className={`nav-menu-item py-md-3 px-0 mx-2 ${
                            pathname.match(
                              createURLPathMatchExp("processes", baseUrl)
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          <i className="fa fa-cogs fa-fw mr-2" />
                          {t("Processes")}
                        </Nav.Link>
                      )
                    : null}

                  {showApplications
                    ? getUserRolePermission(userRoles, STAFF_REVIEWER) ||
                      getUserRolePermission(userRoles, CLIENT)
                      ? ENABLE_APPLICATIONS_MODULE && (
                          <Nav.Link
                          eventKey="application"
                            as={Link}
                            to={`${baseUrl}application`}
                            className={`nav-menu-item py-md-3 px-0 mx-2 ${
                              pathname.match(
                                createURLPathMatchExp("application", baseUrl)
                              )
                                ? "active"
                                : pathname.match(
                                    createURLPathMatchExp("draft", baseUrl)
                                  )
                                ? "active"
                                : ""
                            }`}
                          >
                            <i className="fa-solid fa-rectangle-list mr-2" />
                            {t("Submissions")}
                          </Nav.Link>
                        )
                      : null
                    : null}
                  {getUserRolePermission(userRoles, STAFF_REVIEWER)
                    ? ENABLE_TASKS_MODULE && (
                        <Nav.Link
                        eventKey="task"
                          as={Link}
                          to={`${baseUrl}task`}
                          className={`nav-menu-item py-md-3 px-0 mx-2 ${
                            pathname.match(
                              createURLPathMatchExp("task", baseUrl)
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          <i className="fa-solid fa-list-check mr-2" />
                          {t("Tasks")}
                        </Nav.Link>
                      )
                    : null}

                  {getUserRolePermission(userRoles, STAFF_REVIEWER)
                    ? ENABLE_DASHBOARDS_MODULE && (
                        <Nav.Link
                          eventKey="dashboards"
                          as={Link}
                          to={`${baseUrl}metrics`}
                          data-testid="Dashboards"
                          className={`nav-menu-item py-md-3 px-0 mx-2 ${
                            pathname.match(
                              createURLPathMatchExp("metrics", baseUrl)
                            ) ||
                            pathname.match(
                              createURLPathMatchExp("insights", baseUrl)
                            )
                              ? "active"
                              : ""
                          }`}
                        >
                          
                          <i className="fa-solid fa-gauge-high mr-2" />
                          {t("Dashboards")}
                        </Nav.Link>
                      )
                    : null}
                </Nav>

                <Nav className="nav-user">
                  {selectLanguages.length === 1 ? (
                    selectLanguages.map((e, i) => {
                      return (
                        <div className="mr-2">
                          <i className="fa fa-globe mr-2" />
                           {e.name}
                        </div>
                      );
                    })
                  ) : (
                    <NavDropdown
                      title={
                        <>
                          <i className="fa fa-globe  mr-2" />
                         
                          {lang ? lang : "LANGUAGE"}
                        </>
                      }
                      className="mr-2"
                      id="basic-nav-dropdown"
                    >
                      {selectLanguages.map((e, index) => (
                        <NavDropdown.Item
                          key={index}
                          onClick={() => {
                            handleOnclick(e.name);
                          }}
                        >
                          {e.value}
                        </NavDropdown.Item>
                      ))}
                    </NavDropdown>
                  )}
                     <NavDropdown
                    title={
                      <>
                        <i className="fa-solid fa-user mr-2" />
                        {userDetail?.name ||
                          userDetail?.preferred_username ||
                          ""}
                      </>
                    }
                  >
                    <NavDropdown.Item>
                      
                      {userDetail?.name || userDetail?.preferred_username}
                      <br />
                      <i className="fa fa-users fa-fw" />
                      <b>{getUserRoleName(userRoles)}</b>
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logout}>
                      <i className="fa fa-sign-out fa-fw" /> {t("Logout")}
                    </NavDropdown.Item>
                  </NavDropdown>
                </Nav>

              </Navbar.Collapse>
            ) : (
              !MULTITENANCY_ENABLED && (
                <Link to={loginUrl} className="btn btn-primary">
                  Login
                </Link>
              )
            )}
          </Navbar>
        </Container>
      </header>
    </BrowserRouter>
    </>
  );
});

export default NavBar;