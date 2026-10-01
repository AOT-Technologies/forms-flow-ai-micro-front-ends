import React from "react";
import { useTranslation } from "react-i18next";
import API from "../../endpoints";

const BillingReturn: React.FC = () => {
  const { t } = useTranslation();
  const [message, setMessage] = React.useState(t("Completing payment..."));

  React.useEffect(() => {
    const sessionId = new URLSearchParams(
      globalThis.location?.search ?? ""
    ).get("session_id");
    if (!sessionId) {
      setMessage(t("Missing session id. Redirecting..."));
      globalThis.location?.replace("/");
      return;
    }

    const run = async () => {
      try {
        const returnEndpoint = API.BILLING_RETURN.includes("/api/")
          ? API.BILLING_RETURN
          : API.BILLING_RETURN.replace(
              /^(https?:\/\/[^/]+)(\/.*)?$/i,
              "$1/api$2"
            );
        globalThis.location?.replace(
          `${returnEndpoint}?session_id=${encodeURIComponent(sessionId)}`
        );
      } catch (err) {
        // Keep UX simple and visible if redirect URL building fails.
        // The static prefix is translated; the error detail stays raw.
        setMessage(
          err instanceof Error
            ? `${t("Payment completed, but redirect failed:")} ${err.message}`
            : t("Payment completed, but redirect failed.")
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

export default BillingReturn;
