import React, { useMemo } from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import {
  selectRoot,
  selectError,
  Form,
} from "@aot-technologies/formio-react";
import Loading from "./Loading";
import { RESOURCE_BUNDLES_DATA } from "../resourceBundles/i18n";
import {
  CUSTOM_SUBMISSION_ENABLE,
  CUSTOM_SUBMISSION_URL,
} from "../constants";

interface TaskFormProps extends PropsFromRedux {
  currentUser: string;
  taskAssignee: string;
  onFormSubmit?: (submission: any) => void;
  onCustomEvent?: (event: any) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({
  currentUser,
  taskAssignee,
  form: { form, isActive: isFormActive },
  submission: reduxSubmission,
  errors,
  options,
  onFormSubmit,
  onCustomEvent = () => {},
}) => {
  const language = localStorage.getItem("lang") ?? "en";
  const isReadOnly = taskAssignee !== currentUser;
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
    isFormActive ?? reduxSubmission?.isActive ?? !form ?? !safeSubmission?.data;
// Show loading UI if loading
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

  // Render the Form
  return (
    <div>
      <div className="main-header">
        <h3 className="task-head text-truncate form-title">{form?.title}</h3>
      </div>
        <div className="ms-4 mb-5 me-4 wizard-tab service-task-details">
          <Form
            form={form}
            submission={safeSubmission}
            url={reduxSubmission?.url}
            options={{
              ...options,
              i18n: RESOURCE_BUNDLES_DATA,
              language,
              readOnly: isReadOnly,
              viewAsHtml: isReadOnly,
            }}
            onSubmit={isReadOnly ? undefined : onFormSubmit}
            onCustomEvent={onCustomEvent}
          />
        </div>
    </div>
  );
};

// Map Redux state to component props
const mapStateToProps = (state: any) => ({
  form: selectRoot("form", state),
  submission: selectRoot("submission", state),
  options: {
    noAlerts: false,
  },
  errors: [selectError("submission", state), selectError("form", state)],
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(TaskForm);
