import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "react-bootstrap";
import { useHistory, useParams, useLocation } from "react-router-dom";
import { V8CustomButton, UpArrowIcon, DownArrowIcon } from "@formsflow/components";
import "./organization.scss";
import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints";
import {
  MULTITENANCY_ENABLED,
  URL_CONTACT_SALES,
  URL_TERMS_AND_CONDITIONS,
  URL_PRIVACY_POLICY,
} from "../../constants";

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, isOpen, onToggle, children }) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }, [onToggle]);

  return (
    <div className="organization-section">
      <div 
        className="organization-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <h3 className="organization-section-title">{title}</h3>
        {isOpen ? <UpArrowIcon className="svgIcon-medium-dark"/> : <DownArrowIcon className="svgIcon-medium-dark"/>}
      </div>
      <Collapse in={isOpen}>
        <div>{children}</div>
      </Collapse>
    </div>
  );
};

/** Parse tenant API datetimes (e.g. "2026-05-10 11:01:50.557276") with full time resolution. */
function parseTenantDateTime(value: unknown): Date | null {
  if (value == null || value === "") return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    const withT = /\d{4}-\d{2}-\d{2}\s+\d/.test(s)
      ? s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
      : s;
    const msPrecision = withT.replace(/(\.\d{3})\d+/, "$1");
    const d = new Date(msPrecision);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function subscriptionStatusFromApi(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type SubscriptionUiKind = "active" | "trial" | "expired" | "cancelled";

function resolveSubscriptionUiKind(
  tenant: Record<string, unknown>,
  daysDifference: number | null
): SubscriptionUiKind {
  const status = subscriptionStatusFromApi(tenant?.subscription_status);

  if (status === "canceled") {
    return "cancelled";
  }
  if (status === "expired") {
    return "expired";
  }
  if (status === "active") {
    return "active";
  }
  if(!status) {
    return "expired";
  }

  const trialExpiry = parseTenantDateTime(tenant?.trial_expiry_dt);
  const expiry = parseTenantDateTime(tenant?.expiry_dt);

  if (expiry && trialExpiry) {
    if (daysDifference !== null && daysDifference > 0) {
      return "trial";
    }
    if (daysDifference !== null && daysDifference <= 0) {
      return "expired";
    }
  }
  if (expiry && daysDifference !== null && daysDifference > 0) {
    return "trial";
  }
  if (daysDifference !== null && daysDifference > 0) {
    return "trial";
  }
  return "active";
}

function getSubscriptionPresentation(
  kind: SubscriptionUiKind,
  daysDifference: number | null,
  t: (key: string, opts?: Record<string, unknown>) => string
): { title: string; description: string } {
  switch (kind) {
    case "active":
      return {
        title: t("Active"),
        description: t("You are currently using a paid version of FormsFlow."),
      };
    case "trial":
      return {
        title: t("Trial"),
        description: `You have ${daysDifference ?? 0} days left of your free trial.`,
      };
    case "expired":
      return {
        title: t("Expired"),
        description: "",
      };
    case "cancelled":
      return {
        title: t("Cancelled"),
        description: "",
      };
    default:
      return { title: "", description: "" };
  }
}

const Organization: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const { tenantId: urlTenantId } = useParams<{ tenantId?: string }>();
  const [subscriptionOpen, setSubscriptionOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [daysDifference, setDaysDifference] = useState<number | null>(null);
  const [subscriptionKind, setSubscriptionKind] =
    useState<SubscriptionUiKind>("active");

  const applyTenantSubscriptionState = useCallback((tenant: Record<string, unknown>) => {
    try {
      const expiry_dt = tenant?.expiry_dt;
      const expiry = parseTenantDateTime(expiry_dt);

      let days: number | null = null;
      if (expiry) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const end = new Date(expiry);
        end.setHours(0, 0, 0, 0);
        days = Math.floor(
          (end.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      setDaysDifference(days);
      setSubscriptionKind(resolveSubscriptionUiKind(tenant, days));
    } catch (error) {
      console.error("Error calculating subscription state:", error);
      setDaysDifference(null);
      setSubscriptionKind("active");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const readFromStorage = () => {
      const tenantDataStr = StorageService.get("tenantData");
      if (!tenantDataStr) {
        setDaysDifference(null);
        setSubscriptionKind("active");
        return;
      }
      try {
        applyTenantSubscriptionState(JSON.parse(tenantDataStr));
      } catch (error) {
        console.error("Error parsing tenantData:", error);
        setDaysDifference(null);
        setSubscriptionKind("active");
      }
    };

    readFromStorage();

    if (!MULTITENANCY_ENABLED) {
      return () => {
        cancelled = true;
      };
    }

    const tenantUrl = `${API.GET_TENANT_DATA}${API.GET_TENANT_DATA.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    RequestService.httpGETRequest(tenantUrl, null, null)
      .then((res) => {
        if (cancelled || !res?.data) return;
        StorageService.save("tenantData", JSON.stringify(res.data));
        if (res.data.key) {
          StorageService.save("tenantKey", res.data.key);
        }
        applyTenantSubscriptionState(res.data as Record<string, unknown>);
      })
      .catch((err) => {
        console.error("Failed to refresh tenant for Organization:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [applyTenantSubscriptionState, location.pathname]);
  const tenantKey = urlTenantId || StorageService.get("tenantKey") || "";
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  const openUpgrade = () => {
    if (!tenantKey) {
      return;
    }
    // Use admin app MULTITENANCY_ENABLED (same as index.tsx routes), not @formsflow/service getRoute(),
    // so the path always matches the registered <Route> for plans.
    history.push(`${baseUrl}admin/plans`);
  };

  const { title: subscriptionTitle, description: subscriptionDescription } =
    getSubscriptionPresentation(subscriptionKind, daysDifference, t);

  const renderExternalButtons = (label: string) => {
    const key = label.toLowerCase()
      .replace(/view our /g, '')
      .split(' ')[0]; // Extract first word after "view our"
    const dataTestId = `view-${key}-button`;
  
    const urlMap: Record<string, string> = {
      "Contact Sales": URL_CONTACT_SALES,
      "View our Terms and Conditions": URL_TERMS_AND_CONDITIONS,
      "View our Privacy Policy": URL_PRIVACY_POLICY,
    };
  
    const url = urlMap[label];
  
    return (
      <V8CustomButton
        label={t(label)}
        variant="secondary"
        dataTestId={dataTestId}
        icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      />
    );
  };

  return (
    <div className="organization-container">
      <div className="organization-content">
        <AccordionSection
          title={t("Subscription")}
          isOpen={subscriptionOpen}
          onToggle={() => setSubscriptionOpen(!subscriptionOpen)}
        >
          <div className="subscription-card">
            <div className="subscription-status">
              <span className="status-text">{subscriptionTitle}</span>
            </div>
            {subscriptionDescription ? (
              <p className="subscription-description">{subscriptionDescription}</p>
            ) : null}

            <div className="subscription-card-actions">
              <V8CustomButton
                label={t("Upgrade")}
                variant="secondary"
                dataTestId="subscription-upgrade-button"
                onClick={openUpgrade}
              />
              {renderExternalButtons("Contact Sales")}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          title={t("Terms & Conditions")}
          isOpen={termsOpen}
          onToggle={() => setTermsOpen(!termsOpen)}
        >
          <div className="terms-actions">
            {renderExternalButtons('View our Terms and Conditions')}
            {renderExternalButtons('View our Privacy Policy')}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};

export default Organization;
