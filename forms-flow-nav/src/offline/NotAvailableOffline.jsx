import React, { useSyncExternalStore } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { baseOf, shouldBlockPage, subscribeOfflineGuard } from "./offlineGuard";
import "./offlineGuard.scss";

const blocked = () => shouldBlockPage(window.location.pathname);

// Covers the page area (not the side menu) with "Not available offline" when
// the page needs the server and we are offline (FFF-3). It goes away by itself
// when the connection comes back or the user opens a Submit page.
const NotAvailableOffline = ({ top = 0 }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const show = useSyncExternalStore(
    subscribeOfflineGuard,
    blocked,
    () => false
  );
  if (!show) return null;

  const toSubmit = () => navigate(`${baseOf(window.location.pathname)}form`);
  return (
    <main
      className="offline-guard"
      // Truly dynamic: the height of the tenant's logo bar, if any.
      style={{ "--offline-guard-top": `${top}px` }}
      aria-labelledby="offline-guard-title"
      data-testid="offline-guard"
    >
      <div className="offline-guard-card">
        <h1 id="offline-guard-title" className="offline-guard-title">
          {t("Not available offline")}
        </h1>
        <p className="offline-guard-text">
          {t("This page needs a connection. Your saved forms still work.")}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={toSubmit}
          data-testid="offline-guard-go-to-submit"
        >
          {t("Go to Submit")}
        </button>
      </div>
    </main>
  );
};

NotAvailableOffline.propTypes = { top: PropTypes.number };

export default NotAvailableOffline;
