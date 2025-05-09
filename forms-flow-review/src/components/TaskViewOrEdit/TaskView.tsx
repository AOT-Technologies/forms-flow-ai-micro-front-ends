import React, { useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
import { useSelector } from "react-redux";
import {
  selectRoot,
  resetSubmissions,
  saveSubmission,
  Form,
  selectError,
} from "@aot-technologies/formio-react";
import { push } from "connected-react-router";
import Loading from "../../components/Loading";
import { useTranslation } from "react-i18next";
import { RESOURCE_BUNDLES_DATA } from "../../resourceBundles/i18n";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
} from "../../constants/index";

const View: React.FC<PropsFromRedux> = (props) => {
  const { t } = useTranslation();
  let language = localStorage.getItem("lang");
  const {
    // onSubmit,
    options,
    form: { form, isActive: isFormActive },
    submission: { submission, isActive: isSubActive, url },
  } = props;

  const customSubmission = useSelector(
    (state: any) => state.customSubmission?.submission || {}
  );

  const updatedSubmission = useMemo(() => {
    return CUSTOM_SUBMISSION_URL && CUSTOM_SUBMISSION_ENABLE
      ? customSubmission
      : submission;
  }, [customSubmission, submission]);

  if (isFormActive || isSubActive || !updatedSubmission?.data) {
    return <Loading />;
  }

  return (
    <div className="sub-container wizard-tab">
      <Form
        form={form}
        submission={updatedSubmission}
        url={url}
        // onSubmit={onSubmit}
        options={{
          ...options,
          i18n: RESOURCE_BUNDLES_DATA,
          language: language,
          viewAsHtml: true,
        }}
      />
    </div>
  );
};

// Redux mapping
const mapStateToProps = (state: any) => {
  //   const isDraftView = props.page === "draft-detail";
  return {
    form: selectRoot("form", state),
    submission: { ...selectRoot("submission", state) },
    options: {
      readOnly: true,
    },
    errors: [selectError("submission", state), selectError("form", state)],
  };
};


const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(View);
