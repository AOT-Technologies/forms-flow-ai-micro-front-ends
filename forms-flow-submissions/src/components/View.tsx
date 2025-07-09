import React, { useMemo } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { Form, selectRoot, selectError } from "@aot-technologies/formio-react";
// import { push } from "connected-react-router";
import { useTranslation } from "react-i18next";
import { RESOURCE_BUNDLES_DATA } from "../resourceBundles/i18n";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
} from "../constants/constants";
import { RootState } from "../reducers/index";
import { RouteComponentProps } from "react-router-dom";
import Loading from "./Loading";

interface OwnProps extends RouteComponentProps<{ formId: string }> {
  page?: string;
}

const mapStateToProps = (state: RootState, props: OwnProps) => {
  const isDraftView = props.page === "draft-detail";

  return {
    form: selectRoot("form", state),
    submission: selectRoot("submission", state),
    options: {
      readOnly: true,
      language: state.applications.lang,
    },
    errors: [selectError("submission", state), selectError("form", state)],
  };
};

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

const View: React.FC<PropsFromRedux> = React.memo((props) => {
  const { t } = useTranslation();
  const {
    options,
    form: { form },
    submission: reduxSubmission,
  } = props;
    const customSubmission = useSelector(
    (state: any) => state.customSubmission?.submission ?? {}
  );

  const rawSubmission = useMemo(() => {
    if (CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE) {
      return customSubmission;
    }
    return reduxSubmission.submission;
  }, [customSubmission, reduxSubmission]);

  // Deep clone submission to prevent mutation issues
  const safeSubmission = useMemo(() => {
    return rawSubmission ? JSON.parse(JSON.stringify(rawSubmission)) : null;
  }, [rawSubmission]);

  const isLoading =
   reduxSubmission?.isActive || !form || !safeSubmission?.data;

   if (isLoading) {
    return (
      <div className="container">
        <div className="main-header">
          <h3 className="task-head text-truncate form-title">
          </h3>
        </div>
        <Loading />
      </div>
    );
  }

  return (
    <div className="scrollable-overview bg-white ps-3 pe-3 m-0 form-border">
      <div className="sub-container wizard-tab">
        <Form
          form={form}
          submission={safeSubmission}
          options={{
            ...options,
            i18n: RESOURCE_BUNDLES_DATA,
            viewAsHtml: true,
            buttonSettings: { showCancel: false },
          }}
        />
      </div>
    </div>
  );
});

export default connector(View);
