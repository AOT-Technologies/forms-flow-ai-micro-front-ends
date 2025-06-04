import React, { useEffect, useState, useMemo } from "react";
import { Route, Switch, Redirect, useParams } from "react-router-dom";
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
import SubmissionsList from "./Routes/SubmissionListing";

const authorizedRoles = new Set(["create_submissions", "view_submissions"]);

interface SubmissionsProps {
  publish?: (event: string, data?: any) => void;
  subscribe?: (
    event: string,
    callback: (msg: string, data: any) => void
  ) => void;
  getKcInstance: () => any;
}

const Submissions: React.FC<SubmissionsProps> = React.memo((props) => {
  const { publish = () => {}, subscribe = () => {} } = props;
  const { tenantId } = useParams<{ tenantId?: string }>();
  const instance = useMemo(() => props.getKcInstance(), []);
  const [isAuth, setIsAuth] = useState(instance?.isAuthenticated());
  const [isClient, setIsClient] = useState(false);

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
    if (roles.some((role: any) => authorizedRoles.has(role))) {
      setIsClient(true);
    }

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

  if (!isClient) {
    return <p>unauthorized</p>;
  }

  return (
    <div className="main-container" tabIndex={0}>
      <div className="container mt-5">
        <div className="min-container-height ps-md-3">
          <Switch>
            <Route
              exact
              path={`${BASE_ROUTE}submissions`}
              render={() => <SubmissionsList />}
            />
            <Redirect from="*" to="/404" />
          </Switch>
        </div>
      </div>
    </div>
  );
});

export default Submissions;
