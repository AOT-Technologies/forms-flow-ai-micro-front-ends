import React, { useState } from "react";
import { Route, Switch, Redirect, useHistory, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config";
import Footer from "./components/Footer";
import { BASE_ROUTE, DESIGNER_ROLE, MULTITENANCY_ENABLED } from "./constants";
import Recipes from "./components/Recipes";
import ConnectedApps from "./components/ConnectedApps";
import Library from "./components/Library";
import Head from "./containers/head";
import i18n from "./resourceBundles/i18n";
import "./index.scss";
import { fetchIntegrationEnableDetails } from "./services/integration";
import Loading from "./components/Loading";
import Alert from "./containers/Alert";

const Integration = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const { tenantId } = useParams();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [integrationEnabled, setIntegrationEnabled] = useState(false);
  const [page, setPage] = React.useState("Recipes");
  const [isDesigner, setIsDesigner] = React.useState(false);
  const [integrationCheckLoading, setIntegrationCheckLoading] = useState(true);

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
    if (roles.includes(DESIGNER_ROLE)) {
      setIsDesigner(true);
    }
    const locale = localStorage.getItem("i18nextLng")
    if (locale) i18n.changeLanguage(locale);
    publish("ES_ROUTE", { pathname: `${baseUrl}integration` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    })

    //checking the integration is enabled or not
    fetchIntegrationEnableDetails().then((res: any) => {
      setIntegrationEnabled(res.data?.enabled)
    }).catch((err: any) => {
      console.error(err);
    }).then(() => {
      setIntegrationCheckLoading(false)
    })

  }, [isAuth])


  const headerList = () => {
    return [
      {
        name: "Recipes",
        onClick: () => history.push(`${baseUrl}integration/recipes`),
      },
      {
        name: "Connected Apps",
        onClick: () => history.push(`${baseUrl}integration/connected-apps`),
      },
      {
        name: "Library",
        onClick: () => history.push(`${baseUrl}integration/library`),
      },
    ];
  };

  if (integrationCheckLoading) {
    return <Loading />
  }

  if (!integrationEnabled || !isDesigner) {
    return <div className="d-flex align-item-center justify-content-center p-5">
     <Alert variant="danger" message="Unauthorized Access - You don't have the permission to access this service."/>
    </div>
  }

  return (
    <>
        <div className="main-container " tabIndex={0}>
          <div className="container mt-5">
            <div className="min-container-height ps-md-3">
              <div className="d-flex align-items-center justify-content-between">
                <Head hideLine={true} items={headerList()} page={page} />
                <button className="btn btn-primary"><i className="fa-solid fa-plus me-2"></i>Create new</button>
              </div>
              <hr className="head-rule " data-testid="head-rule" />
              <ToastContainer theme="colored" />
              <Switch>
                <Route
                  exact
                  path={`${BASE_ROUTE}integration/recipes`}
                  render={() => (
                    <Recipes
                      {...props}
                      setTab={setPage}
                    />
                  )}
                />

                <Route
                  exact
                  path={`${BASE_ROUTE}integration/connected-apps`}
                  render={() => (
                    <ConnectedApps
                      {...props}
                      setTab={setPage}
                    />
                  )}
                />

                <Route
                  exact
                  path={`${BASE_ROUTE}integration/library`}
                  render={() => (
                    <Library
                      {...props}
                      setTab={setPage}
                    />
                  )}
                />


                <Redirect from="*" to="/404" />
              </Switch>
            </div>
            <Footer />
          </div>
        </div>
   
    </>
  );
});

export default Integration;
