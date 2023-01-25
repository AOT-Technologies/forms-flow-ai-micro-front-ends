import React, { useEffect, useMemo, useState } from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link, BrowserRouter } from "react-router-dom";
import {
  getUserRoleName,
  getUserRolePermission,
} from "./helper/user";
import createURLPathMatchExp from "./helper/regExp/pathMatch";
import { useTranslation } from "react-i18next";
import {
  CLIENT,
  STAFF_REVIEWER,
  APPLICATION_NAME,
  STAFF_DESIGNER,
  MULTITENANCY_ENABLED,
} from "./constants/constants";
import "./Navbar.scss"

const NavBar = React.memo(({ props }) => {
  const [user, setUser] = React.useState({});
  const [tenant, setTenant] = React.useState({});
  const [location, setLocation] = React.useState(''); 
  const [form, setForm] = React.useState({});
  const [loading, setIsLoading] = React.useState(true);

  props.subscribe("ES_USER", (msg, data) => {
    if (data) {
      setUser(data);
      setIsLoading(false);
    }
  });
  props.subscribe("ES_TENANT", (msg, data) => {
    if (data) {
      setTenant(data);
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
  const isAuthenticated = user.isAuthenticated;
  const { pathname } = location;
  const userDetail = user?.userDetail;
  const lang = user.lang;
  const userRoles = user.roles;
  const showApplications = user.showApplications;
  const applicationTitle = tenant.tenantData?.details?.applicationTitle;
  const tenantKey = tenant?.tenantId;
  const formTenant = form?.tenantKey;
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  /**
   * For anonymous forms the only way to identify the tenant is through the
   * form data with current implementation. To redirect to the correact tenant
   * we will use form as the data source for the tenantKey
   */

  const [loginUrl, setLoginUrl] = useState(baseUrl);

  const selectLanguages = user.selectLanguages;
  // const dispatch = useDispatch();
  const logoPath = "/logo.svg";
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
    props.publish('ES_CHANGE_LANGUAGE', lang);
  }, [lang]);

  const handleOnclick = (selectedLang) => {
    props.publish('ES_UPDATE_LANGUAGE', selectedLang)
  };

  const logout = () => {
    props.publish('ES_LOGOUT', baseUrl)
  };

  if(loading){
    return <p>Loading...</p>
  }

  return (
    <BrowserRouter>
    <header>
      <Navbar
        expand="lg"
        bg="white"
        className="topheading-border-bottom"
        fixed="top"
      >
        <Container fluid>
          <Navbar.Brand className="d-flex">
            <Link to={`${baseUrl}`}>
              <img
                className="img-fluid"
                src={logoPath}
                width="50"
                height="55"
                alt="Logo"
              />
            </Link>
            <div className="custom-app-name">{appName}</div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav " />
          {isAuthenticated ? (
            <Navbar.Collapse id="responsive-navbar-nav" className="navbar-nav">
              <Nav
                id="main-menu-nav"
                className="mr-auto active align-items-lg-center"
              >
                <Nav.Link
                  as={Link}
                  to={`${baseUrl}form`}
                  className={`main-nav nav-item ${
                    pathname.match(createURLPathMatchExp("form", baseUrl))
                      ? "active-tab"
                      : ""
                  }`}
                >
                  <i className="fa fa-wpforms fa-fw fa-lg mr-2" />
                  {t("Forms")}
                </Nav.Link>
                {getUserRolePermission(userRoles, STAFF_DESIGNER) ? (
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}admin`}
                    className={`main-nav nav-item ${
                      pathname.match(createURLPathMatchExp("admin", baseUrl))
                        ? "active-tab"
                        : ""
                    }`}
                  >
                    <i className="fa fa-user-circle-o fa-lg mr-2" />
                    {t("Admin")}
                  </Nav.Link>
                ) : null}

                {getUserRolePermission(userRoles, STAFF_DESIGNER) ? (
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}processes`}
                    className={`main-nav nav-item ${
                      pathname.match(
                        createURLPathMatchExp("processes", baseUrl)
                      )
                        ? "active-tab"
                        : ""
                    }`}
                  >
                    <i className="fa fa-cogs fa-lg fa-fw mr-2" />
                    {t("Processes")}
                  </Nav.Link>
                ) : null}

                {showApplications ? (
                  getUserRolePermission(userRoles, STAFF_REVIEWER) ||
                  getUserRolePermission(userRoles, CLIENT) ? (
                    <Nav.Link
                      as={Link}
                      to={`${baseUrl}application`}
                      className={`main-nav nav-item ${
                        pathname.match(
                          createURLPathMatchExp("application", baseUrl)
                        )
                          ? "active-tab"
                          : pathname.match(
                              createURLPathMatchExp("draft", baseUrl)
                            )
                          ? "active-tab"
                          : ""
                      }`}
                    >
                      {" "}
                      <i className="fa fa-list-alt fa-fw fa-lg mr-2" />
                      {t("Applications")}
                    </Nav.Link>
                  ) : null
                ) : null}
                {getUserRolePermission(userRoles, STAFF_REVIEWER) ? (
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}task`}
                    className={`main-nav nav-item taskDropdown ${
                      pathname.match(createURLPathMatchExp("task", baseUrl))
                        ? "active-tab"
                        : ""
                    }`}
                  >
                    {" "}
                    <i className="fa fa-list fa-lg fa-fw mr-2" />
                    {t("Tasks")}
                  </Nav.Link>
                ) : null}

                {getUserRolePermission(userRoles, STAFF_REVIEWER) ? (
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}metrics`}
                    data-testid="Dashboards"
                    className={`main-nav nav-item ${
                      pathname.match(
                        createURLPathMatchExp("metrics", baseUrl)
                      ) ||
                      pathname.match(createURLPathMatchExp("insights", baseUrl))
                        ? "active-tab"
                        : ""
                    }`}
                  >
                    {" "}
                    <i className="fa fa-tachometer fa-lg fa-fw mr-2" />
                    {t("Dashboards")}
                  </Nav.Link>
                ) : null}
              </Nav>

              <Nav className="ml-lg-auto mr-auto px-lg-0 px-3">
                {selectLanguages.length === 1 ? (
                  selectLanguages.map((e, i) => {
                    return (
                      <>
                        <i className="fa fa-globe fa-lg mr-1 mt-1" />
                        <h4 key={i}>{e.name}</h4>
                      </>
                    );
                  })
                ) : (
                  <NavDropdown
                    title={
                      <>
                        <i className="fa fa-globe fa-lg mr-2" />
                        {lang ? lang : "LANGUAGE"}
                      </>
                    }
                    id="basic-nav-dropdown"
                  >
                    {selectLanguages.map((e, index) => (
                      <NavDropdown.Item
                        key={index}
                        onClick={() => {
                          handleOnclick(e.name);
                        }}
                      >
                        {e.value}{" "}
                      </NavDropdown.Item>
                    ))}
                  </NavDropdown>
                )}
              </Nav>

              <Nav className="ml-lg-auto mr-auto px-lg-0 px-3">
                <NavDropdown
                  title={
                    <>
                      <i className="fa fa-user fa-lg mr-1" />
                      {userDetail?.name || userDetail?.preferred_username || ""}
                    </>
                  }
                >
                  <NavDropdown.Item>
                    {" "}
                    {userDetail?.name || userDetail?.preferred_username}
                    <br />
                    <i className="fa fa-users fa-lg fa-fw" />
                    <b>{getUserRoleName(userRoles)}</b>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>
                    <i className="fa fa-sign-out fa-fw" /> {t("Logout")}{" "}
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          ) : (
            <Link to={loginUrl} className="btn btn-primary">
              Login
            </Link>
          )}
        </Container>
      </Navbar>
    </header>
    </BrowserRouter>
  );
});

export default NavBar;
