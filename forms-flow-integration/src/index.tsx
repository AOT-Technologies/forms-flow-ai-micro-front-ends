import React, { useState } from "react";
import { Route, Routes, Navigate, useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config";
import Footer from "./components/Footer";
import { ENABLE_INTEGRATION_PREMIUM } from "./constants";
import { navigateToIntegrationRecipes, navigateToIntegrationConnectedApps, navigateToIntegrationLibrary, getRedirectUrl, MULTITENANCY_ENABLED } from "@formsflow/service";
import Recipes from "./components/Recipes";
import ConnectedApps from "./components/ConnectedApps";
import PremiumSubscription from "./components/PremiumSubscription";
import Library from "./components/Library";
import Head from "./containers/head";
import i18n from "./resourceBundles/i18n";
import "./index.scss";
import { fetchIntegrationEnableDetails } from "./services/integration";
import Loading from "./components/Loading";
import Alert from "./containers/Alert";

const Integration = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [integrationEnabled, setIntegrationEnabled] = useState(false);
  const [page, setPage] = React.useState("Recipes");
  const [isDesigner, setIsDesigner] = React.useState(false);
  const [integrationCheckLoading, setIntegrationCheckLoading] = useState(true);

  const baseUrl = getRedirectUrl(tenantId);

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
    if (roles?.includes('manage_integrations')) {
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
        onClick: () => navigateToIntegrationRecipes(navigate, tenantId),
      },
      {
        name: "Connected Apps",
        onClick: () => navigateToIntegrationConnectedApps(navigate, tenantId),
      },
      {
        name: "Library",
        onClick: () => navigateToIntegrationLibrary(navigate, tenantId),
      },
    ];
  };

  if (integrationCheckLoading) {
    return <Loading />
  }
  
  if (!integrationEnabled || !isDesigner) {
    if(ENABLE_INTEGRATION_PREMIUM && isDesigner) {
      return <PremiumSubscription />
    } 
    return <div className="d-flex align-item-center justify-content-center p-5 mt-5">
     <Alert variant="danger" message="Unauthorized Access - You don't have the permission to access this service."/>
    </div>
  }

  return (
    <>
        <div className="main-container" tabIndex={0}>
          <div className="container">
            <div className="min-container-height">
                <Head items={headerList()} page={page} />
              <ToastContainer theme="colored" />
              <Routes>
                <Route
                  path="integration/recipes"
                  element={
                    <Recipes
                      {...props}
                      setTab={setPage}
                    />
                  }
                />

                <Route
                  path="integration/connected-apps"
                  element={
                    <ConnectedApps
                      {...props}
                      setTab={setPage}
                    />
                  }
                />

                <Route
                  path="integration/library"
                  element={
                    <Library
                      {...props}
                      setTab={setPage}
                    />
                  }
                />

                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </div>
   
    </>
  );
});

export default Integration;
