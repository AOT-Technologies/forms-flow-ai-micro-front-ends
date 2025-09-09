import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, connect, ConnectedProps, useSelector } from "react-redux";
import { Form, Errors, selectRoot, selectError } from "@aot-technologies/formio-react";
import _ from "lodash";

import {
  fetchFormById,
  getBundleCustomSubmissionData,
  fetchBundleSubmissionData,
} from "../api/queryServices/analyzeSubmissionServices";

import { textTruncate } from "../helper/helper";

import { StepperComponent } from '@formsflow/components';
import { RESOURCE_BUNDLES_DATA } from "../resourceBundles/i18n";
import {
  clearFormError,
  setBundleSubmissionData,
  setFormFailureErrorData,
} from "../actions/bundleSubmissionActions";
import Loading from "./Loading";
import { CUSTOM_SUBMISSION_ENABLE } from "../constants/constants";

interface TaskFormProps extends PropsFromRedux {
  bundleFormData: { formId: string; submissionId: string };
}

const BundleSubmissionForm: React.FC<TaskFormProps> = ({
  options,
  bundleFormData,
  submission,
}) => {
  const dispatch = useDispatch();
  const formRef = useRef<any>(null);

  const [formStep, setFormStep] = useState(0);
  const [loadingForm, setLoadingForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [cacheSubmissions, setCacheSubmissions] = useState<Record<string, any>>({});
  const [formCache, setFormCache] = useState<Record<string, any>>({});

  const bundleLoading = useSelector((state: any) => state.submissionBundle.bundleLoading);
  const bundleSubmission = useSelector((state: any) => state.submissionBundle?.bundleSubmission);
  const taskDetailsLoading = useSelector((state: any) => state.submissionBundle?.submissionBundleLoading);
  const selectedForms = useSelector((state: any) => state.submissionBundle?.submissionBundleForms || []);
  const { error } = useSelector((state: any) => state?.form);

  const isReadOnly = true;

  // pick correct fetch function once
  const fetchSubmissionFn = CUSTOM_SUBMISSION_ENABLE
    ? getBundleCustomSubmissionData
    : fetchBundleSubmissionData;

  const stepLabels = selectedForms?.map((form) => {
        let stplabal = form.formName.includes(" ") ? form.formName : textTruncate(30, 20, form.formName);
        return stplabal;
      }
  );

  /* ----------------------- handle stepper label click ----------------------- */
  const onLabelClick = (step) => {
    if (step === formStep) {
      return;
    }
    else {
        setFormStep(step);
    }

  
  };


  const getFormAndSubmission = useCallback(async () => {
    if (!selectedForms?.length) return;

    dispatch(clearFormError("form"));
    setLoadingForm(true);

    const { formId } = selectedForms[formStep];
    const cachedSubmission = cacheSubmissions[formId];
    const readOnlyOrHasSubmissionId = isReadOnly || bundleFormData?.submissionId;

    try {
      const promises: Promise<any>[] = [fetchFormById(formId)];

      if (!cachedSubmission && readOnlyOrHasSubmissionId) {
        promises.push(fetchSubmissionFn(bundleFormData?.formId, bundleFormData?.submissionId, formId));
      }

      const [formRes, submissionRes] = await Promise.all(promises);
      const formData = formRes.data;

      if (readOnlyOrHasSubmissionId) {
        const submissionData = cachedSubmission || submissionRes?.data?.data || {};
        dispatch(setBundleSubmissionData({
          data: { ..._.cloneDeep(bundleSubmission?.data), ..._.cloneDeep(submissionData) },
        }));

        if (!cachedSubmission) {
          setCacheSubmissions(prev => ({ ...prev, [formId]: submissionData }));
        }
      }

      setForm(formData);

      if (!isReadOnly && !formCache[formData._id]) {
        setFormCache(prev => ({ ...prev, [formData._id]: formData }));
      }
    } catch (err: any) {
      dispatch(setFormFailureErrorData("form", err?.response?.data || err?.message));
    } finally {
      setLoadingForm(false);
    }
  }, [formStep, selectedForms, bundleFormData, cacheSubmissions, isReadOnly, dispatch, formCache, fetchSubmissionFn]);

  useEffect(() => {
    getFormAndSubmission();
    document.getElementById("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [formStep, getFormAndSubmission]);


  return (
    <>
      <StepperComponent
        steps={stepLabels}
        activeStep={formStep}
        onClick={(index) => {
          onLabelClick(index);
        }}
      />
  
      <div className="p-3 analyze-Submission-buindle-view ">
        {taskDetailsLoading || loadingForm || !selectedForms?.length ? (
          <div className="container">
            <Loading />
          </div>
        ) : (
          <>
            <Errors errors={error} />
  
            <Form
              key={isReadOnly ? "readonly" : "editable"}
              form={form}
              submission={{
                data: {
                  ..._.cloneDeep(bundleSubmission?.data),
                  ..._.cloneDeep(submission?.data),
                },
              }}
              options={{
                buttonSettings: { showSubmit: false },
                ...options,
                noAlerts: false,
                i18n: RESOURCE_BUNDLES_DATA,
                readOnly: isReadOnly,
              }}
              formReady={(instance: any) => (formRef.current = instance)}
            />
  
            <div className="d-flex justify-content-end">
              {formStep > 0 && (
                <button
                  onClick={() => setFormStep((prev) => prev - 1)}
                  className="btn btn-secondary me-2"
                >
                  Previous Form
                </button>
              )}
              {formStep < selectedForms.length - 1 && (
                <button
                  onClick={() => setFormStep((prev) => prev + 1)}
                  disabled={bundleLoading}
                  className="btn btn-primary"
                >
                  Next Form
                </button>
              )}
            </div>
          </>
        )}
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
export default connector(BundleSubmissionForm);
