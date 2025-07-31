import React, { useEffect, useState, useMemo } from "react";
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
import AccessDenied from "./components/AccessDenied";
import Loading from "./components/Loading";
import SubmissionsList from "./Routes/SubmissionListing";
import ViewApplication from "./components/AnalyzeSubmissionView"
import { StyleServices } from "@formsflow/service";
interface SubmissionsProps {
  publish?: (event: string, data?: any) => void;
  subscribe?: (
    event: string,
    callback: (msg: string, data: any) => void
  ) => void;
  getKcInstance: () => any;
}

const Submissions: React.FC<SubmissionsProps> = React.memo((props) => {
  const { publish = () => { }, subscribe = () => { } } = props;
  const { tenantId } = useParams<{ tenantId?: string }>();
  const instance = useMemo(() => props.getKcInstance(), []);
  const [isAuth, setIsAuth] = useState(instance?.isAuthenticated());
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE));
  // const isViewDashboard = userRoles?.includes("view_dashboards");
  const isAnalyzeSubmissionView = userRoles?.includes("analyze_submissions_view");
  // const isAnalyzeMetricsView = userRoles?.includes("analyze_metrics_view");
  const isAnalyzeManager = isAnalyzeSubmissionView;
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";

  useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}submissions` });
    subscribe("ES_CHANGE_LANGUAGE", (_msg, data) => {
      i18n.changeLanguage(data);
    });
  }, []);

  useEffect(() => {
    StorageService.save("tenantKey", tenantId ?? "");
  }, [tenantId]);

  useEffect(() => {
    if (!isAuth) {
      const kcInstance = KeycloakService.getInstance(
        KEYCLOAK_URL_AUTH,
        KEYCLOAK_URL_REALM,
        KEYCLOAK_CLIENT,
        tenantId
      );
      kcInstance.initKeycloak(() => {
        setIsAuth(kcInstance.isAuthenticated());
        publish("FF_AUTH", kcInstance);
      });
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;

    const roles = JSON.parse(
      StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
    );

    const locale = localStorage.getItem("i18nextLng");
    if (locale) {
      i18n.changeLanguage(locale);
    }

    publish("ES_ROUTE", { pathname: `${baseUrl}submissions` });
    subscribe("ES_CHANGE_LANGUAGE", (_msg, data) => {
      i18n.changeLanguage(data);
    });
  }, [isAuth]);

  if (!isAuth) {
    return <Loading />;
  }

  const customLogoPath =  StyleServices?.getCSSVariable("--custom-logo-path");
  const customTitle = StyleServices?.getCSSVariable("--custom-title");
  const hasMultitenancyHeader = customLogoPath || customTitle;

  return (
    <>
      {isAnalyzeManager ? (
        <div className={`${hasMultitenancyHeader ? 'main-container-with-custom-header ' : 'main-container' } `}>
          <Switch>
            <Route
              exact
              path={`${BASE_ROUTE}submissions`}
              render={() => (
                <div className="page-with-side">
                  <SubmissionsList />
                </div>
              )}
            />
            <Route
              exact
              path={`${BASE_ROUTE}submissions/:id`}
              render={() => (
                <div className="container mt-5">
                  <div className="min-container-height ps-md-3">
                    <ViewApplication />
                  </div>
                </div>)}
            />
            <Redirect from="*" to="/404" />
          </Switch>
        </div>
      ) : (
        <div className="main-container">
          <div className="page-content">
            <div className="min-container-height ps-md-3">
              <AccessDenied userRoles={userRoles} />
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Submissions;
