import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, connect, ConnectedProps, useSelector } from "react-redux";
import { Form, Errors, selectRoot, selectError } from "@aot-technologies/formio-react";
import { StepperComponent } from "@formsflow/components";
import { textTruncate } from "../helper/helper"
import _ from "lodash";
import {
  fetchFormById,
  getBundleCustomSubmissionData,
  fetchBundleSubmissionData,
} from "../api/services/filterServices";
import { RESOURCE_BUNDLES_DATA } from "../resourceBundles/i18n";
import {
  clearFormError,
  setBundleSubmissionData,
  setFormFailureErrorData,
} from "../actions/taskActions";
import { CUSTOM_SUBMISSION_ENABLE } from "../constants";
import Loading from "./Loading";

interface TaskFormProps extends PropsFromRedux {
  currentUser: string;
  bundleFormData: { formId: string; submissionId: string };
  onChange?: (event: any) => void;
  onFormSubmit?: (submission: any) => void;
  onCustomEvent?: (event: any) => void;
}

const BundleTaskForm: React.FC<TaskFormProps> = ({
  currentUser,
  options,
  bundleFormData,
  onChange,
  onFormSubmit,
  onCustomEvent,
}) => {
  const dispatch = useDispatch();
  const formRef = useRef<any>();
  
  const [formStep, setFormStep] = useState(0);
  const [getFormLoading, setGetFormLoading] = useState(false);
  const [form, setForm] = useState<any>({});
  const [cacheSubmissions, setCacheSubmissions] = useState<any>({});
  const [formCache, setFormCache] = useState<any>({});
  const [submission, setSubmission] = useState<any>(null);
  const bundleLoading = useSelector((state: any) => state.task.bundleLoading);
  const bundleSubmission = useSelector((state: any) => state.task?.bundleSubmission);
  const taskAssignee = useSelector((state: any) => state?.task?.taskAssignee);
  const taskDetailsLoading = useSelector((state: any) => state?.task?.taskDetailsLoading);
  const selectedForms = useSelector((state: any) => state?.task?.selectedForms || []);
  const { error } = useSelector((state: any) => state?.form);

  const isReadOnly = useMemo(() => taskAssignee !== currentUser, [taskAssignee, currentUser]);
  console.log(isReadOnly, taskAssignee, currentUser,"=====task assignee current user");
 

  useEffect(() => {
    setSubmission(bundleSubmission?.data ? _.cloneDeep(bundleSubmission) : { data: {} });
  }, [bundleSubmission]);

  const fetchSubmissionFn = useMemo(
    () => (CUSTOM_SUBMISSION_ENABLE ? getBundleCustomSubmissionData : fetchBundleSubmissionData),
    []
  );

  const handleSubmisionData = () => {
    dispatch(setBundleSubmissionData({
      data: { ..._.cloneDeep(bundleSubmission?.data), ..._.cloneDeep(submission?.data) },
    }));
  };

  const getFormAndSubmission = async () => {
    if (!selectedForms?.length) return;

    dispatch(clearFormError("form"));
    setGetFormLoading(true);

    const { formId } = selectedForms[formStep];
    const cachedData = cacheSubmissions[formId];
    const readOnlyOrHasSubmissionId = isReadOnly || bundleFormData?.submissionId;

    try {
      const promises = [fetchFormById(formId)];

      if (!cachedData && readOnlyOrHasSubmissionId) {
        promises.push(fetchSubmissionFn(bundleFormData?.formId, bundleFormData?.submissionId, formId));
      }

      const result = await Promise.all(promises);
      const formData = result[0].data;

      if (readOnlyOrHasSubmissionId) {
        const submissionData = cachedData || result[1]?.data?.data;
        dispatch(setBundleSubmissionData({
          data: { ..._.cloneDeep(bundleSubmission?.data), ..._.cloneDeep(submissionData) },
        }));
        if (!cachedData) {
          setCacheSubmissions(prev => ({ ...prev, [formId]: submissionData }));
        }
      }

      setForm(formData);
      setGetFormLoading(false);

      if (!isReadOnly && !formCache[formData._id]) {
        setFormCache(prev => ({ ...prev, [formData._id]: formData }));
      }
    } catch (err: any) {
      setGetFormLoading(false);
      dispatch(setFormFailureErrorData("form", err?.response?.data || err?.message));
    }
  };


  useEffect(() => {
    getFormAndSubmission();
    document.getElementById("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [formStep]);


  const handleNextForm = () => {
    if (!isReadOnly) handleSubmisionData();
    setFormStep(prev => prev + 1);
  };

  const handleBackForm = () => {
    setFormStep(prev => prev - 1);
    if (!isReadOnly) handleSubmisionData();
  };

  const stepLabels = selectedForms?.map((form) => {
    let stplabal = form.formName.includes(" ") ? form.formName : textTruncate(30, 20, form.formName);
    return stplabal;
    }
  );

const onLabelClick = (step) => {
  if (step === formStep) {
    return;
  }
  else {
      setFormStep(step);
  }
};
  
  return (
    <>
      <StepperComponent
        steps={stepLabels}
        activeStep={formStep}
        onClick={(index) => {
          onLabelClick(index);
        }}
      />
    
    <div className="scrollable-overview-with-header bg-white m-0 form-border p-5">
         { taskDetailsLoading || getFormLoading ? 
         <div className="container">
        <Loading />
      </div> : (<>
         <Errors errors={error} />
        <Form
        key={isReadOnly ? "readonly" : "editable"}
        form={form}
        submission={{ data: { ..._.cloneDeep(bundleSubmission?.data), ...submission?.data } }}
        options={{
            buttonSettings: {
              showSubmit: false
            },
            ...options,
            noAlerts: false,
            i18n: RESOURCE_BUNDLES_DATA,
            readOnly: isReadOnly,
          }}
          onSubmit={() => {
            if (!isReadOnly) handleSubmisionData();
            onFormSubmit?.({ 
              data: { ..._.cloneDeep(bundleSubmission?.data), ..._.cloneDeep(submission?.data) }
            });
          }}
        onCustomEvent={onCustomEvent} 
        formReady={(e) => (formRef.current = e)}
        onChange={(e) => {
          if (!e.changed && !submission) setSubmission({ data: e.data });
          if (!e.changed) return;
          setSubmission({ data: e.data });
          onChange?.({ data: e.data });
        }}
      />
      <div className="d-flex justify-content-end">
        {formStep > 0 && <button onClick={handleBackForm} className="btn btn-secondary me-2">Previous Form</button>}
        { selectedForms.length - 1 !== formStep && <button
          onClick={ handleNextForm }
          disabled={bundleLoading}
          className="btn btn-primary"
        >
          {"Next Form"}
        </button>}
      </div> 
      </>) }
    </div>
    </>
  );
};

const mapStateToProps = (state: any) => ({
  form: selectRoot("form", state),
  submission: selectRoot("submission", state),
  options: { noAlerts: false },
  errors: [selectError("submission", state), selectError("form", state)],
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(BundleTaskForm);
