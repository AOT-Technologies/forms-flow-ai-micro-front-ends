import React, { useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RequestService, StorageService } from "@formsflow/service";
import { V8CustomButton } from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../../constants";
import API from "../../endpoints";
import Footer from "../footer";

const Plans: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { tenantId: urlTenantId } = useParams<{ tenantId?: string }>();
  const tenantId = urlTenantId || StorageService.get("tenantKey") || "";
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  const [error, setError] = useState<string | null>(null);
  const pricingTableRef = useRef<HTMLDivElement | null>(null);
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    let isMounted = true; // prevents state updates after unmount

    const loadPricingTable = async () => {
      if (!tenantId) {
        if (isMounted) setError(t("Tenant not found in session."));
        return;
      }

      try {
        const endpoint = API.BILLING_PRICING_SESSION.replace("<tenant_key>", tenantId);
        const response = await RequestService.httpPOSTRequest(endpoint, {}, null, true);
        const data = response?.data;
        if (
          !data?.publishableKey ||
          !data?.pricingTableId ||
          !data?.customerSessionClientSecret
        ) {
          throw new Error("No Stripe pricing session data returned");
        }

        if (!document.querySelector('script[src="https://js.stripe.com/v3/pricing-table.js"]')) {
          const script = document.createElement("script");
          script.src = "https://js.stripe.com/v3/pricing-table.js";
          script.async = true;
          document.body.appendChild(script);
        }

        if (pricingTableRef.current) {
          pricingTableRef.current.innerHTML = `
            <stripe-pricing-table
              pricing-table-id="${data.pricingTableId}"
              publishable-key="${data.publishableKey}"
              customer-session-client-secret="${data.customerSessionClientSecret}">
            </stripe-pricing-table>
          `;
        }
      } catch (err) {
        console.error("Failed to load Stripe pricing table:", err);

        if (!hasRetriedRef.current) {
          hasRetriedRef.current = true;
          loadPricingTable(); // retry once
        } else {
          if (isMounted) {
            setError(t("Unable to load plans. Please try again later."));
          }
        }
      }
    };

    loadPricingTable();

    return () => {
      isMounted = false;
    };
  }, [tenantId, t]);

  return (
    <div className="page-container position-relative">
      <div className="page-layout mt-3">
        <div className="min-container-height custom-scroll overflow-y-auto ps-md-3 pb-5">
          <div className="mb-3">
            <V8CustomButton
              label={t("Back")}
              variant="secondary"
              dataTestId="plans-back-button"
              onClick={() =>
                history.push(`${baseUrl}admin/organization`)
              }
            />
          </div>
          {error ? <p role="alert">{error}</p> : null}
          <div ref={pricingTableRef} className="mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default Plans;