import React, { useState } from "react";
import { Route, Switch, Redirect, useHistory, useParams } from "react-router-dom";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config"; 
import { BASE_ROUTE, MULTITENANCY_ENABLED } from "./constants";
import i18n from "./config/i18n";
import "./index.scss";
import Loading from "./components/Loading";
import TaskList from "./Routes/TaskListing/List";
const authorizedRoles = new Set(["view_tasks",
  "manage_all_filters",
  "manage_tasks",
  "view_filters",
  "create_filters",])

const Review = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const { tenantId } = useParams();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [isReviewer, setReviewer] = React.useState(false);
 
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";

  React.useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}integration` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    })
  }, []);

  React.useEffect(() => {
    StorageService.save("tenantKey", tenantId || '')
  }, [tenantId])

  React.useEffect(() => {
    if (!isAuth) {

      let instance = KeycloakService.getInstance(
        KEYCLOAK_URL_AUTH,
        KEYCLOAK_URL_REALM,
        KEYCLOAK_CLIENT,
        tenantId
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
    if (roles.some((role: any) => authorizedRoles.has(role))) {
      setReviewer(true);
    }
    const locale = localStorage.getItem("i18nextLng")
    if (locale) i18n.changeLanguage(locale);
    publish("ES_ROUTE", { pathname: `${baseUrl}integration` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    })

  }, [isAuth])


  if (!isAuth) {
    return <Loading />
  }
  if(!isReviewer) return <p>unauthorized</p>
  return (
    <>
        <div className="main-container " tabIndex={0}>
          <div className="container mt-5">
            <div className="min-container-height ps-md-3">
              <Switch>
                <Route
                  exact
                  path={`${BASE_ROUTE}review`}
                  render={() => <TaskList {...props}/>}
                />
                <Redirect from="*" to="/404" />
              </Switch>
            </div>
     
          </div>
        </div>
   
    </>
  );
});

export default Review;
