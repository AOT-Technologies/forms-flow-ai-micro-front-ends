import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "react-bootstrap";
import { V8CustomButton, UpArrowIcon, DownArrowIcon } from "@formsflow/components";
import "./organization.scss";
import { StorageService } from "@formsflow/service";

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

const Organization: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const [subscriptionOpen, setSubscriptionOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [daysDifference, setDaysDifference] = useState<number | null>(null);

  useEffect(() => { 
    // Calculate remaining days from expiry_dt 
    try {
      const tenantDataStr = StorageService.get("TENANT_DATA");
      const expiry_dt = tenantDataStr 
        ? JSON.parse(tenantDataStr)?.expiry_dt 
        : null;
      
      if (expiry_dt && !Number.isNaN(Date.parse(expiry_dt))) {
        const expiry = new Date(expiry_dt);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const timeDifference = expiry.getTime() - currentDate.getTime();
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        setDaysDifference(days);
      } else {
        setDaysDifference(null);
      }
    } catch (error) {
      console.error("Error calculating days difference:", error);
      setDaysDifference(null);
    }
  }, []);


  const isTrial = daysDifference !== null && daysDifference > 0;

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
              {isTrial
                ? t(`You have ${daysDifference} days left of your free trial.`)
                : t("You are currently using a paid version of FormsFlow.")}
            </p>
            {isTrial ? (
              <V8CustomButton
                label={t("Upgrade")}
                variant="secondary"
                dataTestId="upgrade-button"
                icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
              />
            ) : (
              <V8CustomButton
                label={t("Contact Sales")}
                variant="secondary"
                dataTestId="contact-sales-button"
                icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
              />
            )}
          </div>
        </AccordionSection>

        <AccordionSection
          title={t("Terms & Conditions")}
          isOpen={termsOpen}
          onToggle={() => setTermsOpen(!termsOpen)}
        >
          <div className="terms-actions">
            <V8CustomButton
              label={t("View our Terms and Conditions")}
              variant="secondary"
              dataTestId="view-terms-button"
              icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
            />
            <V8CustomButton
              label={t("View our Privacy Policy")}
              variant="secondary"
              dataTestId="view-privacy-button"
              icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
            />
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};

export default Organization;
