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
  ENABLE_INTEGRATION_PREMIUM
} from "./constants/constants";
import "./Navbar.scss";
import { StorageService } from "@formsflow/service";
import { fetchSelectLanguages, updateUserlang } from "./services/language";
import i18n from "./resourceBundles/i18n";
import { fetchTenantDetails } from "./services/tenant";
import { setShowApplications } from "./constants/userContants";
import { LANGUAGE,USER_LANGUAGE_LIST } from "./constants/constants";
import { Helmet } from "react-helmet";
import { checkIntegrationEnabled } from "./services/integration";
const NavBar = React.memo(({ props }) => {
  const history = useHistory();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState({ pathname: "/" });
  const [form, setForm] = React.useState({});
  const [selectLanguages, setSelectLanguages] = React.useState([]);
  const [applicationTitle, setApplicationTitle] = React.useState("");
  const [integrationEnabled, setIntegrationEnabled] = React.useState(false);
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
    if (MULTITENANCY_ENABLED && data?.details) {
      setApplicationTitle(data?.details?.applicationTitle);
      const logo = data?.details?.customLogo?.logo || "/logo.svg";
      setTenantLogo(logo);
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = logo;
    }
  }, [tenant]);

  const isAuthenticated = instance?.isAuthenticated();
  const { pathname } = location;
  const [userDetail, setUserDetail] = React.useState({});
  const [lang, setLang] = React.useState();
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const showApplications = setShowApplications(userDetail?.groups);
  const tenantKey = tenant?.tenantId;
  const formTenant = form?.tenantKey;
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const navbarRef = useRef(null);
const isCreateSubmissions = userRoles?.includes("create_submissions");
const isViewSubmissions = userRoles?.includes("view_submissions");
const isCreateDesigns =userRoles?.includes("create_designs");
const isViewDesigns = userRoles?.includes("view_designs");
const isAdmin =userRoles?.includes("admin");
const isViewTask =userRoles?.includes("view_tasks");
const isManageTask=userRoles?.includes("manage_tasks");
const isViewDashboard=userRoles?.includes("view_dashboards")
const isDashboardManager = userRoles?.includes("manage_dashboard_authorizations");
const isRoleManager = userRoles?.includes("manage_roles");
const isUserManager = userRoles?.includes("manage_users");

    
  const onResize = React.useCallback(() => {
    if (navbarRef?.current) {
      const isMediumScreen = window.matchMedia("(min-width: 992px)").matches;
      if (isMediumScreen) {
        document.documentElement.style.setProperty(
          "--ff-navbar-height",
          `${navbarRef.current.offsetHeight}px`
        );
      } else {
        document.documentElement.style.setProperty(
          "--ff-navbar-height",
          `${50}px`
        );
      }
    }
  }, [navbarRef?.current]);

  // to set the navbar height
  useEffect(() => {
    onResize();
  }, [navbarRef?.current, navbarRef?.current?.offsetHeight]);

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

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
      const tenantdata = JSON.parse(StorageService.get("TENANT_DATA"));
      const userLanguageList = (MULTITENANCY_ENABLED && tenantdata?.details?.langList) || USER_LANGUAGE_LIST;
      let userLanguagesArray = [];
      if (typeof userLanguageList === 'object') {
        userLanguagesArray = Object.values(userLanguageList);
      } else if (typeof userLanguageList === 'string') {
        userLanguagesArray = userLanguageList.split(',');
      }
      const supportedLanguages = data.filter(item => userLanguagesArray.includes(item.name));
      setSelectLanguages(supportedLanguages.length > 0 ? supportedLanguages : data);
    });
  }, [MULTITENANCY_ENABLED, USER_LANGUAGE_LIST,tenant]);

  useEffect(() => {
    if(lang){
    props.publish("ES_CHANGE_LANGUAGE", lang);
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
    }
  }, [lang]);

  React.useEffect(() => {
    setUserDetail(
      JSON.parse(StorageService.get(StorageService.User.USER_DETAILS))
    );
  }, [instance]);

  /**
   * Fetches the user's locale from the instance or tenant data, and sets the lang state variable accordingly.
   * This effect runs whenever the instance or tenant data changes.
   */
  React.useEffect(() => {
      if(userDetail){
        const locale =
        userDetail?.locale ||
        tenant?.tenantData?.details?.locale ||
        LANGUAGE;
        setLang(locale);
      }
  }, [userDetail, tenant.tenantData]);

  const handleOnclick = (selectedLang) => {
    setLang(selectedLang)
    setUserDetail(prev => ({...prev,locale:selectedLang}))
    updateUserlang(selectedLang, instance);
  };

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

  const logout = () => {
    history.push(baseUrl);
    instance.userLogout();
  };
  return (
    <>
      <Helmet>
        <title>
          {MULTITENANCY_ENABLED ? applicationTitle : appName}
        </title>
        <link
          rel="icon"
          type="image/png"
          href={MULTITENANCY_ENABLED ? tenantLogo : null}
        />
      </Helmet>
      <BrowserRouter>
        <Navbar
          ref={navbarRef}
          collapseOnSelect
          fixed="top"
          expand="lg"
          className={`navbar-background py-0 shadow px-3 m-0 ${
            !isAuthenticated ? "justify-content-between" : ""
          }`}
        >
          <Container className="d-flex justify-content-between">
            <Navbar.Brand
              href={`${baseUrl}`}
              className="d-flex col-8 col-sm-6 col-md-10 col-lg-3 col-xl-3  px-0"
            >
              <div>
                <img className="custom-logo" src={logoPath} alt="applicationName" />
              </div>

              <div
              data-bs-toggle="tooltip" 
              data-bs-placement="bottom" 
              title={appName}
                className={`custom-app-name ${
                  appName.length > 30
                    ? "long-name"
                    : appName.length > 24 && appName.length <= 30
                    ? "moderate-name"
                    : ""
                }`}
              >
                {appName}
              </div>
            </Navbar.Brand>

            {isAuthenticated && (
              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            )}

{isAuthenticated && (
  <Navbar.Collapse
    id="responsive-navbar-nav"
    className="d-lg-flex justify-content-between h-100"
  >
    <Nav
      id="main-menu-nav"
      className="align-items-lg-center justify-content-start w-100"
      data-testid="main-menu-nav"
    >
      {ENABLE_FORMS_MODULE &&
        (isCreateSubmissions ||
          isCreateDesigns || 
          isViewDesigns) && (
          <Nav.Link
            eventKey="form"
            as={Link}
            to={`${baseUrl}form`}
            className={`nav-menu-item py-md-3 px-0 mx-2 ${
              (pathname.match(createURLPathMatchExp("form", baseUrl)) ||
                pathname.match(createURLPathMatchExp("bundle", baseUrl))) &&
              !(pathname.includes("draft") || pathname.includes("submission"))
                ? "active"
                : ""
            }`}
            id="forms-nav-link"
            data-testid="forms-nav-link"
          >
            <i className="fa-solid fa-file-lines me-2" />
            {t("Forms")}
          </Nav.Link>
        )}
                  {isAdmin && (
                    <Nav.Link
                      eventKey={"admin"}
                      as={Link}
                      to={`${baseUrl}admin`}
                      className={`nav-menu-item py-md-3 px-0 mx-2 ${
                        pathname.match(createURLPathMatchExp("admin", baseUrl))
                          ? "active"
                          : ""
                      }`}
                      id="admin-nav-link"
                      data-testid="admin-nav-link"
                    >
                      <i className="fa-solid fa-user-check me-2" />
                      {t("Admin")}
                    </Nav.Link>
                  ) }

      {isCreateDesigns &&
        ENABLE_PROCESSES_MODULE && (
          <Nav.Link
            eventKey="processes"
            as={Link}
            to={`${baseUrl}processes`}
            className={`nav-menu-item py-md-3 px-0 mx-2 ${
              pathname.match(createURLPathMatchExp("processes", baseUrl))
                ? "active"
                : ""
            }`}
            id="processes-nav-link"
            data-testid="processes-nav-link"
          >
            <i className="fa fa-cogs fa-fw me-2" />
            {t("Processes")}
          </Nav.Link>
        )}
                  {userRoles?.includes("manage_integrations") 
                    ? (integrationEnabled || ENABLE_INTEGRATION_PREMIUM) && (
                        <Nav.Link
                          eventKey="integration"
                          as={Link}
                          to={`${baseUrl}integration/recipes`}
                          className={`nav-menu-item py-md-3 px-0 mx-2 ${
                            pathname.match(
                              createURLPathMatchExp("integration", baseUrl)
                            )
                              ? "active"
                              : ""
                          }`}
                          id="integration-nav-link"
                          data-testid="integration-nav-link"
                        >
                          <i className="fa-solid fa-network-wired me-2"></i>
                          {t("Integrations")}
                          {(ENABLE_INTEGRATION_PREMIUM && <i className="fa-solid fa-crown p-1 text-warning"></i>) || null}
                        </Nav.Link>
                      )
                    : null}

      {showApplications &&
        isViewSubmissions &&
        ENABLE_APPLICATIONS_MODULE && (
          <Nav.Link
            eventKey="application"
            as={Link}
            to={`${baseUrl}application`}
            className={`nav-menu-item py-md-3 px-0 mx-2 ${
              pathname.match(createURLPathMatchExp("application", baseUrl)) ||
              pathname.includes("draft") ||
              pathname.includes("submission")
                ? "active"
                : ""
            }`}
            id="applications-nav-link"
            data-testid="applications-nav-link"
          >
            <i className="fa-solid fa-rectangle-list me-2" />
            {t("Submissions")}
          </Nav.Link>
        )}

      {(isViewTask ||isManageTask) &&
        ENABLE_TASKS_MODULE && (
          <Nav.Link
            eventKey={"task"}
            as={Link}
            to={`${baseUrl}task`}
            className={`nav-menu-item py-md-3 px-0 mx-2 ${
              pathname.match(createURLPathMatchExp("task", baseUrl))
                ? "active"
                : ""
            }`}
            id="tasks-nav-link"
            data-testid="tasks-nav-link"
          >
            <i className="fa-solid fa-list-check me-2" />
            {t("Tasks")}
          </Nav.Link>
        )}

      {isViewDashboard &&
        ENABLE_DASHBOARDS_MODULE && (
          <Nav.Link
            eventKey={"metrics"}
            as={Link}
            to={`${baseUrl}metrics`}
            id="dashboards-nav-link"
            data-testid="dashboards-nav-link"
            className={`nav-menu-item py-md-3 px-0 mx-2 ${
              pathname.match(createURLPathMatchExp("metrics", baseUrl)) ||
              pathname.match(createURLPathMatchExp("insights", baseUrl)) ||
              pathname.match(createURLPathMatchExp("submisssions", baseUrl))
                ? "active"
                : ""
            }`}
          >
            <i className="fa-solid fa-gauge-high me-2" />
            {t("Dashboards")}
          </Nav.Link>
        )}
    </Nav>

    <Nav className="nav-user" data-testid="nav-user">
      {selectLanguages.length === 1 ? (
        selectLanguages.map((e, i) => {
          return (
            <div className="me-2" key={i}>
              <i className="fa fa-globe me-2" />
              {e.name}
            </div>
          );
        })
      ) : (
        <NavDropdown
          title={
            <>
              <i className="fa fa-globe  me-2" />
              {lang ? lang : "LANGUAGE"}
            </>
          }
          className="me-2"
          id="basic-nav-dropdown"
          data-testid="language-dropdown"
        >
          {selectLanguages.map((e, index) => (
            <NavDropdown.Item
              key={index}
              onClick={() => {
                handleOnclick(e.name);
              }}
              data-testid={`language-option-${index}`}
            >
              {e.value}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      )}
      <NavDropdown
        title={
          <>
            <i className="fa-solid fa-user me-2" />
            {userDetail?.name || userDetail?.preferred_username || ""}
          </>
        }
        id="user-dropdown"
        data-testid="user-dropdown"
      >
        <NavDropdown.Item data-testid="user-info">
          {userDetail?.name || userDetail?.preferred_username}
          <br />
          <i className="fa fa-users fa-fw" />
          <b>{getUserRoleName(userRoles)}</b>
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={logout} data-testid="logout-item">
          <i className="fa fa-sign-out fa-fw" /> {t("Logout")}
        </NavDropdown.Item>
      </NavDropdown>
    </Nav>
  </Navbar.Collapse>
)}

          </Container>
        </Navbar>
      </BrowserRouter>
    </>
  );
});

export default NavBar;
