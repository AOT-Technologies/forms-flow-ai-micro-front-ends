import React from "react";
import { Translation } from "react-i18next";
import Footer from "../Footer/footer";

const PremiumSubscription = () => {
  return (
    <div className="main-container ">
      <div className="container">
        <div className="min-container-height d-flex flex-column align-items-center justify-content-center">
          <div className="d-flex justify-content-center align-items-center">
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.9576 14.25H34.0409M15.8326 4.75L12.6659 14.25L18.9993 32.4583L25.3326 14.25L22.1659 4.75M19.9723 32.0823L34.1568 15.0609C34.3972 14.7724 34.5174 14.6282 34.5634 14.4672C34.6039 14.3252 34.6039 14.1748 34.5634 14.0328C34.5174 13.8718 34.3972 13.7276 34.1568 13.4391L27.2957 5.20577C27.1561 5.03824 27.0863 4.95447 27.0008 4.89425C26.9249 4.8409 26.8403 4.80127 26.7508 4.77718C26.6498 4.75 26.5407 4.75 26.3227 4.75H11.6759C11.4578 4.75 11.3488 4.75 11.2477 4.77718C11.1582 4.80127 11.0736 4.8409 10.9978 4.89425C10.9122 4.95447 10.8424 5.03824 10.7028 5.20577L3.84168 13.4391C3.60129 13.7276 3.48109 13.8718 3.43516 14.0328C3.39466 14.1748 3.39466 14.3252 3.43516 14.4672C3.48109 14.6282 3.60129 14.7724 3.84168 15.0609L18.0262 32.0823C18.3604 32.4833 18.5274 32.6838 18.7275 32.7569C18.903 32.8211 19.0955 32.8211 19.271 32.7569C19.4711 32.6838 19.6382 32.4833 19.9723 32.0823Z"
                stroke="#FEB602"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <h1 className="fw-bold ms-2">
              <Translation>{(t) => t("Premium Subscription")}</Translation>
            </h1>
          </div>

          <h4 className="text-center mt-4 fs-5">
            <Translation>
              {(t) =>
                t(
                  " For further insights on this exclusive premium feature, kindly connect"
                )
              }
            </Translation>
            <br />
            <Translation>
              {(t) =>
                t(
                  " with our dedicated marketing team for detailed information."
                )
              }
            </Translation>
          </h4>

          <div className="mt-5">
            <a
              href="https://formsflow.ai/about-us/#contact-us"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>
                {(t) => t("Get Connected With Us Now!")}
              </Translation>
            </a>
          </div>

          <div className="mt-4">
            <Translation>{(t) => t("Visit our")}</Translation>{" "}
            <a
              href="https://formsflow.ai/pricing-plans/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>{(t) => t("Pricing page")}</Translation>
            </a>{" "}
            <Translation>{(t) => t("for more details.")}</Translation>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PremiumSubscription;
