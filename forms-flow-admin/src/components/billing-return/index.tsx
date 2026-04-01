import React from "react";
import API from "../../endpoints";

const BillingReturn: React.FC = () => {
  const [message, setMessage] = React.useState("Completing payment...");

  React.useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setMessage("Missing session id. Redirecting...");
      window.location.replace("/");
      return;
    }

    const run = async () => {
      try {
        const returnEndpoint = API.BILLING_RETURN.includes("/api/")
          ? API.BILLING_RETURN
          : API.BILLING_RETURN.replace(/^(https?:\/\/[^/]+)(\/.*)?$/i, "$1/api$2");
        window.location.replace(`${returnEndpoint}?session_id=${encodeURIComponent(sessionId)}`);
      } catch (err) {
        // Keep UX simple and visible if redirect URL building fails.
        setMessage(
          err instanceof Error
            ? `Payment completed, but redirect failed: ${err.message}`
            : "Payment completed, but redirect failed."
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
