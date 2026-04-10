import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { V8CustomButton, UpArrowIcon, DownArrowIcon } from "@formsflow/components";
import "./organization.scss";
import { StorageService } from "@formsflow/service";
import { URL_CONTACT_SALES, URL_TERMS_AND_CONDITIONS, URL_PRIVACY_POLICY } from "../../constants";
import { MULTITENANCY_ENABLED } from "../../constants";

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
  const s = String(value).trim();
  const withT = /\d{4}-\d{2}-\d{2}\s+\d/.test(s)
    ? s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, "$1T")
    : s;
  const msPrecision = withT.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(msPrecision);
  return Number.isNaN(d.getTime()) ? null : d;
}

const Organization: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const history = useHistory();
  const [subscriptionOpen, setSubscriptionOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [daysDifference, setDaysDifference] = useState<number | null>(null);
  const [isTrial, setIsTrial] = useState(false);

  useEffect(() => {
    // Days note: always from expiry_dt. Active iff expiry_dt > trial_expiry_dt; otherwise Trial (including equal timestamps).
    try {
      const tenantDataStr = StorageService.get("tenantData");
      if (!tenantDataStr) {
        setDaysDifference(null);
        setIsTrial(false);
        return;
      }

      const tenant = JSON.parse(tenantDataStr);
      const expiry_dt = tenant?.expiry_dt;
      const trial_expiry_dt = tenant?.trial_expiry_dt;

      const expiry = parseTenantDateTime(expiry_dt);
      const trialExpiry = parseTenantDateTime(trial_expiry_dt);

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

      let trial: boolean;
      if (expiry && trialExpiry) {
        const isActive = expiry.getTime() > trialExpiry.getTime();
        trial = !isActive;
      } else if (expiry) {
        trial = days !== null && days > 0;
      } else {
        trial = false;
      }

      setDaysDifference(days);
      setIsTrial(trial);
    } catch (error) {
      console.error("Error calculating subscription state:", error);
      setDaysDifference(null);
      setIsTrial(false);
    }
  }, []);
  const subscriptionBtnLabel = isTrial ? t("Upgrade") : t("Contact Sales");
  const tenantKey = StorageService.get("tenantKey") || "";
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  const openUpgrade = async () => {
    if (!tenantKey) {
      return;
    }
    history.push(`${baseUrl}admin/plans`);
  };

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
              <span className="status-text">{isTrial ? t("Trial") : t("Active")}</span>
            </div>
            <p className="subscription-description">
              { daysDifference !== null && daysDifference > 0
                ? t(`You have ${daysDifference} days left of your free trial.`)
                  : t("You are currently using a paid version of FormsFlow.")}
            </p>
            
              <V8CustomButton
                label={t("Upgrade")}
                variant="secondary"
                dataTestId="subscription-upgrade-button"
                icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
                onClick={openUpgrade}
              />
           
              {renderExternalButtons(subscriptionBtnLabel)}
            
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
