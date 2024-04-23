import React from "react";
import { Translation } from "react-i18next";
import "../../index.scss";
import Footer from "../Footer/footer";
import { IntegrationSVG } from "./integrationImage";


const PremiumSubscription = () => {
  return (
    <div className="main-container ">
      <div className="container">
        <div className="min-container-height d-flex flex-column align-items-center justify-content-center">
          <IntegrationSVG
            className="img-fluid mb-4"
          />
          <div className="d-flex justify-content-center align-items-center">
            <span>
              <i className="fa-solid fa-crown premium"></i>
            </span>
            <h1 className="fw-bold ms-2">
              <Translation>
                {(t) => t("Native Integrations Pro")}
              </Translation>
            </h1>
          </div>

          <h4 className="text-center mt-4 fs-5 col-md-10 col-lg-8 col-xl-6">
            <Translation>
              {(t) => (
                <span>
                  {t("We facilitate hundreds of native integrations via our ")}
                  <span className="fw-bold">{t("‘Native Integrations Pro’")}</span>
                  {t(
                    " package. This feature is not available by default in the 14 day trial. If your trial requires this feature, you can let us know and we can enable this for you."
                  )}
                </span>
              )}
            </Translation>
          </h4>
          <div className="mt-5 text-center">
            <a
              href="https://formsflow.ai/integrations"
              className="btn checkout-btn btn-primary fw-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>
                {(t) => t("Learn more about the feature")}
              </Translation>
            </a>
          </div>

          <div className="mt-4">
            <a
              href="https://formsflow.ai/about-us/#contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>{(t) => t("Connect with")}</Translation>
            </a>
            <a
              href="https://formsflow.ai/about-us/#contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>{(t) => t(" formsflow.ai ")}</Translation>
            </a>
            <a
              href="https://formsflow.ai/about-us/#contact-us"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>{(t) => t(" team.")}</Translation>
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default PremiumSubscription;
