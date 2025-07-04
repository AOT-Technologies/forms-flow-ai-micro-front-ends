import React from "react";
import { Route, Switch,useHistory, useParams,useLocation,Redirect } from "react-router-dom";
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
import AdminDashboard from "./components/dashboard";
import RoleManagement from "./components/roles";
import UserManagement from "./components/users";
import i18n from "./resourceBundles/i18n";
import "./index.scss";
import Accessdenied from "./components/AccessDenied";

const Admin = React.memo(({ props }: any) => {
  const { publish, subscribe } = props;
  const history = useHistory();
  const  {tenantId}  = useParams();
  const [instance, setInstance] = React.useState(props.getKcInstance());
  const [isAuth, setIsAuth] = React.useState(instance?.isAuthenticated());
  const [page, setPage] = React.useState("Dashboard");
  const [dashboardCount, setDashboardCount] = React.useState();
  const [roleCount, setRoleCount] = React.useState();
  const [userCount, setUserCount] = React.useState();
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE)
  );
  const isDashboardManager = userRoles?.includes("manage_dashboard_authorizations");
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");
  // const isLinkManager = userRoles.includes("manage_links");
  const isAdmin =  isDashboardManager || isRoleManager || isUserManager;
  const location =useLocation().pathname;
  const [isAccessRestricted, setIsAccessRestricted] = React.useState(false);
  React.useEffect(() => {
    publish("ES_ROUTE", { pathname: `${baseUrl}admin` });
    subscribe("ES_CHANGE_LANGUAGE", (msg, data) => {
      i18n.changeLanguage(data);
    })
  }, []);

  React.useEffect(()=>{
    StorageService.save("tenantKey", tenantId || '')
  },[tenantId])

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
  
  React.useEffect(()=>{
    const restricted = 
    (location === '/admin/dashboard' && !isDashboardManager) ||
    (location === '/admin/roles' && !isRoleManager) ||
    (location === '/admin/users' && !isUserManager) ||
    (!(isDashboardManager ||isRoleManager ||isUserManager));
    setIsAccessRestricted(restricted);
  },[location,userRoles]);
  return (
    <>
      {isAdmin ? (
        <div className="main-container " tabIndex={0}>
        <div className="container mt-5">
        {!isAccessRestricted ?(
          <div className="min-container-height ps-md-3">
          <ToastContainer theme="colored" />
          <Switch>
            { isDashboardManager && (
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
            />)}
            {isRoleManager && 
              (<Route
                exact
                path={`${BASE_ROUTE}admin/roles`}
                render={() => (
                  <RoleManagement
                    {...props}
                    setTab={setPage}
                    setCount={setRoleCount}
                  />
                )}
              />)}
            { isUserManager && (
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
            />)}
            <Route 
            exact
            path={`${baseUrl}admin`}
             >
              {
                userRoles.length && (
                  <Redirect 
                    to ={
                      isDashboardManager ? `${baseUrl}admin/dashboard` 
                      :isRoleManager ? `${baseUrl}admin/roles`
                      : `${baseUrl}admin/users`
                    }
                  />  
                )
              }
             </Route>
          </Switch>
          </div>):
          <div className="min-container-height ps-md-3" >
            <Accessdenied userRoles={userRoles} />
            </div> }
          </div>
        </div>
      ):<div className="main-container ">
         <div className="container mt-5">
         <div className="min-container-height ps-md-3" >
          <Accessdenied userRoles={userRoles} />
          </div>
          </div> 
        </div>}
    </>
  );
});

export default Admin;
