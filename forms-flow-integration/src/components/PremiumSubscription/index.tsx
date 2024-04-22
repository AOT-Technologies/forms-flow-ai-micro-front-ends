import React from "react";
import { Translation } from "react-i18next";
import '../../index.scss';
const PremiumSubscription = () => {
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="vh-100 d-flex flex-column align-items-center justify-content-center">
            <div className="d-flex">
            <span>
              <i className="fa-solid fa-crown premium"></i>
            </span>
              <h1 className="fw-bold ms-2">
                <Translation>{(t) => t("Premium Subscription")}</Translation>
              </h1>
            </div>

            <h4 className="text-center mt-4 fs-5">
              <Translation>
                {(t) =>
                  t(
                    "We facilitate hundreds of native integrations via our ‘Native Integrations Pro’ package."
                  )
                }
              </Translation>
              <br />
              <Translation>
                {(t) =>
                  t(
                    " This feature is not available by default in the 14 day trial. If your trial requires this feature, you can let us know and we can enable this for you."
                  )
                }
              </Translation>
            </h4>

            <a
              href="https://formsflow.ai/about-us/#contact-us"
              className="btn btn-primary mt-5"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Translation>
                {(t) => t("Get Connected With Us Now!")}
              </Translation>
            </a>

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
        </div>
      </div>
    </div>
  );
};

export default PremiumSubscription;
