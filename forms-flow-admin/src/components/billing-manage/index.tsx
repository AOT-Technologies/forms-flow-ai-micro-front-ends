import React from "react";
import { RequestService, StorageService } from "@formsflow/service";
import { useParams } from "react-router-dom";
import API from "../../endpoints";
import { MULTITENANCY_ENABLED } from "../../constants";

/** Portal return */
function buildBillingPortalReturnUrl(tenantKey: string): string {
  const origin = globalThis.location?.origin ?? "";
  const base = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  return `${origin}${base}admin/organization`;
}

const BillingManage: React.FC = () => {
  const { tenantId: tenantFromPath } = useParams<{ tenantId?: string }>();
  const [message, setMessage] = React.useState("Opening subscription management...");

  React.useEffect(() => {
    const run = async () => {
      try {
        const query = new URLSearchParams(
          globalThis.location?.search ?? ""
        );
        // Align with route param name :tenantId — use ?tenantId=<key> on redirects (e.g. /billing/manage?tenantId=…).
        const tenantFromQuery = query.get("tenantId");
        let tenantKey =
          tenantFromPath || tenantFromQuery || StorageService.get("tenantKey") || "";
        const customerId = query.get("customer") || query.get("customer_id");
        const customerName = query.get("customer_name");

        if (!tenantKey && (customerId || customerName)) {
          const resolveBase = API.BILLING_RESOLVE_CUSTOMER;
          const params = new URLSearchParams();
          if (customerId) {
            params.set("customer", customerId);
          }
          if (customerName) {
            params.set("customer_name", customerName);
          }
          const resolveEndpoint = `${resolveBase}?${params.toString()}`;
          const resolveRes = await RequestService.httpGETRequest(resolveEndpoint, null, null);
          tenantKey = resolveRes?.data?.tenantKey || "";
        }

        if (!tenantKey) {
          throw new Error("Tenant key not found. Please login and try again.");
        }

        const endpoint = API.BILLING_PORTAL_SESSION.replace("<tenant_key>", tenantKey);
        const returnUrl = buildBillingPortalReturnUrl(tenantKey);
        const response = await RequestService.httpPOSTRequest(
          endpoint,
          { returnUrl, return_url: returnUrl },
          null,
          true
        );
        const portalUrl = response?.data?.url;
        if (!portalUrl) {
          throw new Error("Portal URL missing");
        }

        globalThis.location?.replace(portalUrl);
      } catch (err) {
        setMessage(
          err instanceof Error
            ? `Unable to open subscription management: ${err.message}`
            : "Unable to open subscription management."
        );
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: "24px", textAlign: "center" }}>
      <h3>{message}</h3>
    </div>
  );
};

export default BillingManage;
