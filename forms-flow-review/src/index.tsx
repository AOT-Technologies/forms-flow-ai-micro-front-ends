import React, { useEffect, useMemo, useState } from "react";
import { Route, Switch, Redirect, useParams } from "react-router-dom";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./api/config";
import { BASE_ROUTE, MULTITENANCY_ENABLED } from "./constants";
import i18n from "./config/i18n";
import "./index.scss";
import Loading from "./components/Loading";
import TaskList from "./Routes/TaskListing";
import TaskDetails from "./Routes/TaskDetails";
const authorizedRoles = new Set([
  "view_tasks",
  "manage_all_filters",
  "manage_tasks",
  "view_filters",
  "create_filters",])

const Review = React.memo((props: any) => {
  const { publish, subscribe } = props;
  const { tenantId } = useParams();
  const instance = useMemo(()=>props.getKcInstance(),[]);
  const [isAuth, setIsAuth] = useState(instance?.isAuthenticated());
  const [isReviewer, setIsReviewer] = useState(false);
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";

  useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}review` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    })
  }, []);

  useEffect(() => {
    StorageService.save("tenantKey", tenantId || '')
  }, [tenantId])
  

  useEffect(() => {
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
  useEffect(() => {
    if (!isAuth) return
    const roles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
    if (roles.some((role: any) => authorizedRoles.has(role))) {
      setIsReviewer(true);
    }
    const locale = localStorage.getItem("i18nextLng")
    if (locale) i18n.changeLanguage(locale);
    publish("ES_ROUTE", { pathname: `${baseUrl}review` });
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
                render={() => <TaskList {...props} />}
              />
              <Route
                exact
                path={`${BASE_ROUTE}review/:taskId`}
                render={() => <TaskDetails {...props} />}
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
