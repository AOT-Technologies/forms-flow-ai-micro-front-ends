import React from "react";
import { Route, Switch, Redirect, useHistory } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config";
import Footer from "./components/footer";
import { BASE_ROUTE, ADMIN_ROLE, STAFF_DESIGNER, MULTITENANCY_ENABLED, TENANT_DETAILS } from "./constants";
import AdminDashboard from "./components/dashboard";
import RoleManagement from "./components/roles";
import UserManagement from "./components/users";
import Head from "./containers/head";

import "./index.scss";

const Admin = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [page, setPage] = React.useState("Dashboard");
  const [dashboardCount, setDashboardCount] = React.useState();
  const [roleCount, setRoleCount] = React.useState();
  const [userCount, setUserCount] = React.useState();
  const [isAdmin, setIsAdmin] = React.useState(false);

  let tenantKey = localStorage.getItem("tenantKey");
  React.useEffect(() => {
    publish("ES_ROUTE", { pathname: `${BASE_ROUTE}admin` });
  }, []);
  //const tenantKey = tenant['tenantId'];
  // const tenantKey = tenant?.tenantId;
  React.useEffect(() => {
    if (!isAuth) {
      let instance = KeycloakService.getInstance(
        KEYCLOAK_URL_AUTH,
        KEYCLOAK_URL_REALM,
        KEYCLOAK_CLIENT,
        tenantKey
      );
      instance.initKeycloak(() => {
        setIsAuth(instance.isAuthenticated());
        publish("FF_AUTH", instance);
      });
    }
  }, []);

  React.useEffect(() => {
    if (!isAuth) return
    const roles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
    if (roles.includes(ADMIN_ROLE) || roles.includes(STAFF_DESIGNER)) {
      setIsAdmin(true);
    }
  }, [isAuth])
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const headerList = () => {
    return [
      {
        name: "Dashboard",
        count: dashboardCount,
        // icon: "user-circle-o",
        onClick: () => history.push(`${baseUrl}admin/dashboard`),
      },
      {
        name: "Roles",
        count: roleCount,
        // icon: "user-circle-o",
        onClick: () => history.push(`${baseUrl}admin/roles`),
      },
      {
        name: "Users",
        count: userCount,
        // icon: "user-circle-o",
        onClick: () => history.push(`${baseUrl}admin/users`),
      },
    ];
  };

  return (
    <>
      {isAdmin && (
        <div className="admin-container" tabIndex={0}>
          <Head items={headerList()} page={page} />
          <ToastContainer theme="colored" />
          <Switch>
            <Route
              exact
              path={`${BASE_ROUTE}admin/dashboard`}
              render={() => (
                <AdminDashboard
                  {...props}
                  setTab={setPage}
                  setCount={setDashboardCount}
                />
              )}
            />
            <Route
              exact
              path={`${BASE_ROUTE}admin/roles`}
              render={() => (
                <RoleManagement
                  {...props}
                  setTab={setPage}
                  setCount={setRoleCount}
                />
              )}
            />
            <Route
              exact
              path={`${BASE_ROUTE}admin/users`}
              render={() => (
                <UserManagement
                  {...props}
                  setTab={setPage}
                  setCount={setUserCount}
                />
              )}
            />
            <Redirect from="*" to="/404" />
          </Switch>
          <Footer />
        </div>
      )}
    </>
  );
});

export default Admin;
