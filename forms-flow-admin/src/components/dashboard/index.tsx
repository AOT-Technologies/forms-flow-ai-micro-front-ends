import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import InsightDashboard from "./dashboard";

import {
  fetchdashboards,
  fetchGroups,
  fetchAuthorizations,
} from "../../services/dashboard";
import "./insightDashboard.scss";
import { BASE_ROUTE } from "../../constants";
import { KeycloakService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "../../endpoints/config";
import Footer from "../footer";

const AdminDashboard = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());

  const [dashboards, setDashboards] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [authorizations, setAuthorizations] = React.useState([]);
  const [error, setError] = React.useState({});

  useEffect(() => {
    publish("ES_ROUTE", { pathname: "/admin" });
  }, []);

  useEffect(() => {
    if(isAuth){
      fetchdashboards(setDashboards, setError);
      fetchGroups(setGroups, setError);
      fetchAuthorizations(setAuthorizations, setError);
    }
  }, [isAuth]);

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

  return (
    <Router>
      <div className="container" id="main" tabIndex={0}>
        <Switch>
          <Route
            exact
            path={`${BASE_ROUTE}admin`}
            render={(props) => (
              <InsightDashboard
                {...props}
                dashboards={dashboards}
                groups={groups}
                authorizations={authorizations}
              />
            )}
          />
          <Redirect from="*" to="/404" />
        </Switch>
        <Footer />
      </div>
    </Router>
  );
});

export default AdminDashboard;
