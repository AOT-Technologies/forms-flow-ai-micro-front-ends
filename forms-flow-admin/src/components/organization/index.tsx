import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Collapse } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  V8CustomButton,
  UpArrowIcon,
  DownArrowIcon,
  UsageSummaryCard,
  mapTenantDataToUsage,
} from "@formsflow/components";
import "./organization.scss";
import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints";
import {
  MULTITENANCY_ENABLED,
  URL_TERMS_AND_CONDITIONS,
  URL_PRIVACY_POLICY,
} from "../../constants";

interface AccordionSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dataTestId?: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  dataTestId,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  return (
    <div className="organization-section">
      <div
        className="organization-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        data-testid={dataTestId}
      >
        <h3 className="organization-section-title">{title}</h3>
        {isOpen ? (
          <UpArrowIcon className="svgIcon-medium-dark" />
        ) : (
          <DownArrowIcon className="svgIcon-medium-dark" />
        )}
      </div>
      <Collapse in={isOpen}>
        <div>{children}</div>
      </Collapse>
    </div>
  );
};

const Organization: React.FC<any> = (props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId: urlTenantId } = useParams<{ tenantId?: string }>();
  const [termsOpen, setTermsOpen] = useState(true);

  const tenantKey = urlTenantId || StorageService.get("tenantKey") || "";
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";

  // Every CTA the card can render - "Upgrade to Professional Plan", "Upgrade to 2500
  // submissions" and "Discover Enterprise" - goes to the plans page, matching the home
  // banner. Uses the admin app's own MULTITENANCY_ENABLED rather than getRoute(), so the
  // path always matches the registered <Route path="plans"> in index.tsx.
  const openUpgrade = useCallback(() => {
    if (MULTITENANCY_ENABLED && !tenantKey) {
      return;
    }
    navigate(`${baseUrl}admin/plans`);
  }, [baseUrl, navigate, tenantKey]);

  // Seeded from the cached record so the card paints immediately, then refreshed below.
  const [tenantData, setTenantData] = useState<Record<string, any> | null>(() => {
    try {
      const cached = StorageService.get("tenantData");
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error parsing tenantData:", error);
      return null;
    }
  });

  const usage = useMemo(() => mapTenantDataToUsage(tenantData), [tenantData]);

  const userRoles = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(
        StorageService.get(StorageService.User.USER_ROLE) || "[]"
      );
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error parsing user roles:", error);
      return [];
    }
  }, []);
  const isOrganizationManager = userRoles.includes("manage_organization");

  // Refreshes the cached tenant record. The home page reads the same storage keys, so this
  // effect is kept even though the subscription summary it used to feed has been replaced.
  useEffect(() => {
    let cancelled = false;

    if (!MULTITENANCY_ENABLED) {
      return () => {
        cancelled = true;
      };
    }

    const tenantUrl = `${API.GET_TENANT_DATA}${
      API.GET_TENANT_DATA.includes("?") ? "&" : "?"
    }_t=${Date.now()}`;
    RequestService.httpGETRequest(tenantUrl, null, null)
      .then((res) => {
        if (cancelled || !res?.data) return;
        StorageService.save("tenantData", JSON.stringify(res.data));
        if (res.data.key) {
          StorageService.save("tenantKey", res.data.key);
        }
        setTenantData(res.data);
      })
      .catch((err) => {
        console.error("Failed to refresh tenant for Organization:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const renderExternalButtons = (label: string) => {
    const key = label
      .toLowerCase()
      .replace(/view our /g, "")
      .split(" ")[0]; // Extract first word after "view our"
    const dataTestId = `view-${key}-button`;

    const urlMap: Record<string, string> = {
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
        {isOrganizationManager && usage && (
          <div className="organization-usage">
            <UsageSummaryCard
              {...usage}
              onUpgrade={openUpgrade}
              dataTestId="organization-usage-summary-card"
            />
          </div>
        )}

        <AccordionSection
          title={t("Terms & Conditions")}
          isOpen={termsOpen}
          onToggle={() => setTermsOpen(!termsOpen)}
          dataTestId="organization-terms-toggle"
        >
          <div className="terms-actions">
            {renderExternalButtons("View our Terms and Conditions")}
            {renderExternalButtons("View our Privacy Policy")}
          </div>
        </AccordionSection>
      </div>
    </div>
  );
};

export default Organization;
