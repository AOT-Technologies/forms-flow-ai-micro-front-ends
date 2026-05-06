import React from "react";
import { Route, Switch, useHistory, useParams, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { KeycloakService, StorageService } from "@formsflow/service";
import {
  KEYCLOAK_URL_AUTH,
  KEYCLOAK_URL_REALM,
  KEYCLOAK_CLIENT,
} from "./endpoints/config";
import Footer from "./components/footer";
import { BASE_ROUTE, MULTITENANCY_ENABLED } from "./constants";
import Manage from "./components/manage";
import i18n from "./resourceBundles/i18n";
import "./index.scss";
import Accessdenied from "./components/AccessDenied";
import Plans from "./components/plans";
import BillingManage from "./components/billing-manage";

const Admin = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const  {tenantId: urlTenantId}  = useParams();
  // Fallback to storage if tenantId is not in URL params
  const tenantId = urlTenantId || StorageService.get("tenantKey") || "";
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [page, setPage] = React.useState("Dashboard");
  const [dashboardCount, setDashboardCount] = React.useState<number | undefined>();
  const [roleCount, setRoleCount] = React.useState<number | undefined>();
  const [userCount, setUserCount] = React.useState<number | undefined>();
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const isDashboardManager = userRoles?.includes("manage_dashboard_authorizations");
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");
  const isOrganizationManager = userRoles?.includes("manage_organization");
  // const isLinkManager = userRoles.includes("manage_links");
  const isAdmin = isDashboardManager || isRoleManager || isUserManager || isOrganizationManager;
  const location =useLocation().pathname;
  const [isAccessRestricted, setIsAccessRestricted] = React.useState(false);
  React.useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}admin` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    });
    // Subscribe to tenant data updates
    subscribe("ES_TENANT", (msg, data) => {
      if (data?.tenantData) {
        StorageService.save("tenantData", JSON.stringify(data.tenantData));
        // Also update tenantKey if tenantId changes
        if (data.tenantId) {
          StorageService.save("tenantKey", data.tenantId);
        }
      }
    });
  }, []);

  React.useEffect(()=>{
    StorageService.save("tenantKey", tenantId || '')
  },[tenantId])

  // Verify tenantData is stored in localStorage
  React.useEffect(() => {
    if (MULTITENANCY_ENABLED && tenantId) {
      const tenantDataStr = StorageService.get("tenantData");
      if (tenantDataStr) {
        try {
          const tenantData = JSON.parse(tenantDataStr);
          // Verify tenantData has expected structure
          if (!tenantData || (!tenantData.key && !tenantData.name)) {
            console.warn("tenantData in localStorage may be incomplete:", tenantData);
          }
        } catch (error) {
          console.error("Error parsing tenantData from localStorage:", error);
        }
      } 
    }
  }, [tenantId]);

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

  React.useEffect(()=>{
    if(instance){
      publish("FF_AUTH", instance);
    }
  },[instance])

  React.useEffect(()=>{
    if(!isAuth) return
    const locale = localStorage.getItem("i18nextLng")
    if(locale) i18n.changeLanguage(locale);
  },[isAuth])
  
  React.useEffect(() => {
    const restricted =
      (location === '/admin/organization' && !isOrganizationManager) ||
      (location === '/admin/dashboard' && !isDashboardManager) ||
      (location === '/admin/roles' && !isRoleManager) ||
      (location === '/admin/users' && !isUserManager) ||
      (!(isOrganizationManager || isDashboardManager || isRoleManager || isUserManager));
    setIsAccessRestricted(restricted);
  }, [location, userRoles]);
  return (
    <>
      {isAdmin ? (
        <div className="page-container">
        <div className="page-layout mt-3">
        {!isAccessRestricted ?(
          <div className="min-container-height">
          <ToastContainer theme="colored" />
          <Switch>
            <Route
              exact
              path={`${baseUrl}admin/billing/manage`}
              render={() => <BillingManage />}
            />
            <Route
              exact
              path={`${baseUrl}admin/plans`}
              render={() => <Plans />}
            />
            <Route 
              exact
              path={`${baseUrl}admin`}
              render={() => (
                <Manage
                  props={props}
                  setTab={setPage}
                  setDashboardCount={setDashboardCount}
                  setRoleCount={setRoleCount}
                  setUserCount={setUserCount}
                />
              )}
            />
            <Route 
              path={`${baseUrl}admin/:tab`}
              render={() => (
                <Manage
                  props={props}
                  setTab={setPage}
                  setDashboardCount={setDashboardCount}
                  setRoleCount={setRoleCount}
                  setUserCount={setUserCount}
                />
              )}
            />
          </Switch>
          </div>):
          <div className="min-container-height ps-md-3" >
            <Accessdenied userRoles={userRoles} />
            </div> }
          </div>
        </div>
      ):<div className="page-container ">
         <div className="page-layout mt-5">
         <div className="min-container-height ps-md-3" >
          <Accessdenied userRoles={userRoles} />
          </div>
          </div> 
        </div>}
    </>
  );
});

export default Admin;
