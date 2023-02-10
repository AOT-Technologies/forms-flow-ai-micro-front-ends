import React from "react";
import {
  Route,
  Switch,
  Redirect,
  useHistory
} from "react-router-dom";
import { KeycloakService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config";
import Footer from "./components/footer";
import { BASE_ROUTE } from "./constants";
import AdminDashboard from "./components/dashboard";
import RoleManagement from "./components/roles";
import UserManagement from "./components/users";
import Head from "./containers/head";

import './index.scss'

const Admin = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [page, setPage] = React.useState("Dashboard");
  const [dashboardCount, setDashboardCount] = React.useState();
  const [roleCount, setRoleCount] = React.useState();
  const [userCount, setUserCount] = React.useState();

  React.useEffect(() => {
    publish("ES_ROUTE", { pathname: "/admin" });
  }, []);

  React.useEffect(() => {
    if (!isAuth) {
      let instance = KeycloakService.getInstance(
        KEYCLOAK_URL_AUTH,
        KEYCLOAK_URL_REALM,
        KEYCLOAK_CLIENT
      );
      instance.initKeycloak(() => {
        setIsAuth(instance.isAuthenticated());
        publish("FF_AUTH", instance);
      });
    }
  }, []);

  const headerList = () => {
    return [
      {
        name: "Dashboard",
        count: dashboardCount,
        // icon: "user-circle-o",
        onClick: () => history.push("/admin/dashboard")
      },
      {
        name: "Roles",
        count:roleCount,
        // icon: "user-circle-o",
        onClick: () => history.push("/admin/roles")
      },
      {
        name: "Users",
        count: userCount,
        // icon: "user-circle-o",
        onClick: () => history.push("/admin/users")
      },
    ];
  };

  return (
    <>
     {isAuth && <div className="admin-container" tabIndex={0}>
        <Head items={headerList()} page={page} />
          <Switch>
            <Route
              exact
              path={`${BASE_ROUTE}admin/dashboard`}
              render={() => <AdminDashboard {...props} setTab={setPage} setCount={setDashboardCount} />}
            />
            <Route
              exact
              path={`${BASE_ROUTE}admin/roles`}
              render={() => <RoleManagement {...props} setTab={setPage} setCount={setRoleCount} />}
            />
            <Route
              exact
              path={`${BASE_ROUTE}admin/users`}
              render={() => <UserManagement {...props} setTab={setPage} setCount={setUserCount} />}
            />
            <Redirect from="*" to="/404" />
          </Switch>
          <Footer />
        </div>
      }
    </>
  );
});

export default Admin;
