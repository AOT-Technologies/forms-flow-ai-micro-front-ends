import React, { useMemo } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { Form, selectRoot, selectError } from "@aot-technologies/formio-react";
import { RESOURCE_BUNDLES_DATA } from "../resourceBundles/i18n.js";
import {
  CUSTOM_SUBMISSION_URL,
  CUSTOM_SUBMISSION_ENABLE,
  MULTITENANCY_ENABLED,
} from "../constants/constants";
import { RootState } from "../reducers/index";
import { RouteComponentProps } from "react-router-dom";
import Loading from "./Loading";
import { HelperServices } from "@formsflow/service";

interface OwnProps extends RouteComponentProps<{ formId: string }> {
  page?: string;
}

const mapStateToProps = (state: RootState, props: OwnProps) => {
  return {
    form: selectRoot("form", state),
    submission: selectRoot("submission", state),
    options: {
      readOnly: true,
    },
    errors: [selectError("submission", state), selectError("form", state)],
  };
};


const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

const View: React.FC<PropsFromRedux> = React.memo((props) => {
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

  // Deep clone submission to prevent mutation issues and process currentUserRoles
  const safeSubmission = useMemo(() => {
    if (!rawSubmission) return null;
    
    const clonedSubmission = JSON.parse(JSON.stringify(rawSubmission));
    
    // Remove tenant name from currentUserRoles when multitenancy is enabled
    if (MULTITENANCY_ENABLED && clonedSubmission.data?.currentUserRoles) {
      const tenantKey = localStorage.getItem("tenantKey");
      if (tenantKey) {
        const rolesString = clonedSubmission.data.currentUserRoles;
        if (typeof rolesString === "string") {
          clonedSubmission.data.currentUserRoles = HelperServices.removeTenantFromRoles(rolesString, tenantKey);
        }
      }
    }
    
    return clonedSubmission;
  }, [rawSubmission]);

  const isLoading =
   reduxSubmission?.isActive || !form || !safeSubmission?.data;

   let scrollableOverview = "scrollable-overview";

   if (form?.display === "wizard") {
    scrollableOverview =  "scrollable-overview-with-custom-header-and-wizard"
  }

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
    <div className={`${scrollableOverview} bg-white ps-3 pe-3 m-0 form-border`}>
      <div className="sub-container wizard-tab">
        <Form
          src={form}
          submission={safeSubmission}
          options={{
            ...options,
            i18n: RESOURCE_BUNDLES_DATA,
            viewAsHtml: true,
            buttonSettings: { showCancel: false },
          } as any}
        />
      </div>
    </div>
  );
});

export default connector(View);