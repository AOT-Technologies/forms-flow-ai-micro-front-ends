import React from "react";
import AccessDeniedIcon  from "./AccessDenied.js";
import './accessDenied.scss';
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import { navigateToBaseUrl } from "@formsflow/service";


const AccessDenied = ({ userRoles }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { tenantId } = useParams();

  const handleLogout = () => {
    const kcInstance = kcServiceInstance(); 
    kcInstance.userLogout();
  };

  const handleReturn = () => {
    navigateToBaseUrl(history, tenantId);
  };

  const showReturnToLogin = userRoles?.length === 0;
  const showReturnToHome = userRoles?.length > 0;

  return (
    <div className="d-flex flex-column align-items-center text-center" data-testid="access-denied-component">
      <AccessDeniedIcon  alt="Access Denied" className="mb-4 mt-2" />    
        <h1 className="access-denied-text" data-testid="access-denied-title">{t("Access Denied")}</h1>
      <span className="access-denied" data-testid="access-denied-message">{t("You don't have permission to access this page.")}</span>
      <span className="access-denied" data-testid="access-denied-submessage">{t("Please contact your administrator or try again later.")}</span>
      {showReturnToLogin && (
        <button className="btn btn-primary me-1 mt-4" onClick={handleLogout} data-testid="return-to-login-button">
          {t("Return to login")}
        </button>
      )}
      {showReturnToHome && (
        <button className="btn btn-primary me-1 mt-4" onClick={handleReturn} data-testid="return-to-home-button">
          {t("Return to home")}
        </button>
      )}
    </div>
  );
};

export default AccessDenied;
