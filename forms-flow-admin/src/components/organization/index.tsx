import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "react-bootstrap";
import { V8CustomButton, UpArrowIcon, DownArrowIcon } from "@formsflow/components";
import "./organization.scss";
import { StorageService } from "@formsflow/service";

const Organization: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const [subscriptionOpen, setSubscriptionOpen] = useState(true);
  const [termsOpen, setTermsOpen] = useState(true);
  const [daysDifference, setDaysDifference] = useState(null);

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

  });


  return (
    <div className="organization-container">
      <div className="organization-content">
        {/* Subscription Section */}
        <div className="organization-section">
          <div 
            className="organization-section-header"
            onClick={() => setSubscriptionOpen(!subscriptionOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSubscriptionOpen(!subscriptionOpen);
              }
            }}
          >
            <h3 className="organization-section-title">{t("Subscription")}</h3>
            {subscriptionOpen ? <UpArrowIcon color="#9E9E9E"/> : <DownArrowIcon color="#9E9E9E"/>}
          </div>
          <Collapse in={subscriptionOpen}>
            <div>
              <div className="subscription-card">
                <div className="subscription-status">
                  <span className="status-text">{daysDifference > 0 ? t("Trial") : t("Active")}</span>
                </div>
                <p className="subscription-description">
                  {daysDifference > 0 ? t(`You have ${daysDifference} days left of your free trial.`) : t("You are currently using a paid version of FormsFlow.")}
                </p>
                {daysDifference > 0 ? (
                  <V8CustomButton
                    label={t("Upgrade")}
                    variant="secondary"
                    dataTestId="upgrade-button"
                    icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
                  />
                ) : 
                (<V8CustomButton
                  label={t("Contact Sales")}
                  variant="secondary"
                  dataTestId="contact-sales-button"
                  icon={<i className="fa fa-external-link me-2" aria-hidden="true"></i>}
                />)
                }
              </div>
            </div>
          </Collapse>
        </div>

        {/* Terms & Conditions Section */}
        <div className="organization-section">
          <div 
            className="organization-section-header"
            onClick={() => setTermsOpen(!termsOpen)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setTermsOpen(!termsOpen);
              }
            }}
          >
            <h3 className="organization-section-title">{t("Terms & Conditions")}</h3>
            {termsOpen ? <UpArrowIcon color="#9E9E9E"/> : <DownArrowIcon color="#9E9E9E"/>}
          </div>
          <Collapse in={termsOpen}>
            <div>
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
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default Organization;
