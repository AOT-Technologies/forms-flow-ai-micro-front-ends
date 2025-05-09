import React from "react";
import { connect } from "react-redux";
import { selectRoot, Form, Errors } from "@aot-technologies/formio-react";
import LoadingOverlay from "react-loading-overlay-ts";
import { Translation } from "react-i18next";
import { RESOURCE_BUNDLES_DATA } from "../../resourceBundles/i18n";

interface EditProps {
  form: {
    form: any;
    isActive: boolean;
  };
  submission: {
    submission: any;
    isActive: boolean;
    url?: string;
  };
  errors: any[];
  options: any;
  onCustomEvent?: (event: any) => void;
}

const Edit: React.FC<EditProps> = ({
  form: { form, isActive: isFormActive },
  submission: { submission, isActive: isSubActive, url },
  errors,
  options,
  onCustomEvent = () => {},
}) => {
  const isLoading = isFormActive || isSubActive || !form || !submission?.data;
  let language = localStorage.getItem("lang");
  if (isLoading) {
    return (
      <div className="container">
        <div className="main-header">
          <h3 className="task-head text-truncate form-title">Loading...</h3>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="main-header">
        <h3 className="task-head text-truncate form-title">{form?.title}</h3>
      </div>
      <Errors errors={errors} />
      <LoadingOverlay
        active={false}
        spinner
        text="Loading..."
        className="col-12"
      >
        <div className="ms-4 mb-5 me-4 wizard-tab service-task-details">
          <Form
            form={form}
            submission={submission}
            url={url}
            options={{
              ...options,
              i18n: RESOURCE_BUNDLES_DATA,
              language: language,
            }}
            onCustomEvent={onCustomEvent}
          />
        </div>
      </LoadingOverlay>
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    form: selectRoot("form", state),
    submission: selectRoot("submission", state) || {
      submission: null,
      isActive: false,
    },
    options: {
      noAlerts: false,
      i18n: {
        en: {
          error: (
            <Translation>
              {(t) => t("Please fix the errors before submitting again.")}
            </Translation>
          ),
        },
      },
    },
  };
};

export default connect(mapStateToProps)(Edit);
