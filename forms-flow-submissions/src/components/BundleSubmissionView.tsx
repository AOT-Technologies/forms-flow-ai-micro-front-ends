import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { connect, ConnectedProps, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { useAppDispatch } from "../hooks";
import {
  Form,
  Errors,
  selectRoot,
  selectError,
} from "@aot-technologies/formio-react";
import _ from "lodash";

import {
  fetchFormById,
  getBundleCustomSubmissionData,
  fetchBundleSubmissionData,
} from "../api/queryServices/analyzeSubmissionServices";

import { textTruncate } from "../helper/helper";

import { BreadCrumbs, V8CustomButton } from "@formsflow/components";
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
  const dispatch = useAppDispatch();
  const formRef = useRef<any>(null);

  const [formStep, setFormStep] = useState(0);
  const [loadingForm, setLoadingForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [cacheSubmissions, setCacheSubmissions] = useState<Record<string, any>>(
    {}
  );
  const [formCache, setFormCache] = useState<Record<string, any>>({});

  const bundleLoading = useSelector(
    (state: any) => state.submissionBundle.bundleLoading
  );
  const bundleSubmission = useSelector(
    (state: any) => state.submissionBundle?.bundleSubmission
  );
  const taskDetailsLoading = useSelector(
    (state: any) => state.submissionBundle?.submissionBundleLoading
  );
  const selectedForms = useSelector(
    (state: any) => state.submissionBundle?.submissionBundleForms || []
  );
  const { error } = useSelector((state: any) => state?.form);

  const isReadOnly = true;

  // pick correct fetch function once
  const fetchSubmissionFn = CUSTOM_SUBMISSION_ENABLE
    ? getBundleCustomSubmissionData
    : fetchBundleSubmissionData;

  const stepLabels = selectedForms?.map((form) => {
    let stplabal = form.formName.includes(" ")
      ? form.formName
      : textTruncate(30, 20, form.formName);
    return stplabal;
  });

  /* ----------------------- handle stepper label click ----------------------- */
  const onLabelClick = (step) => {
    if (step === formStep) {
      return;
    } else {
      setFormStep(step);
    }
  };

  const getFormAndSubmission = useCallback(async () => {
    if (!selectedForms?.length) return;

    dispatch(clearFormError("form"));
    setLoadingForm(true);

    const { formId } = selectedForms[formStep];
    const cachedSubmission = cacheSubmissions[formId];
    const readOnlyOrHasSubmissionId =
      isReadOnly || bundleFormData?.submissionId;

    try {
      const promises: Promise<any>[] = [fetchFormById(formId)];

      if (!cachedSubmission && readOnlyOrHasSubmissionId) {
        promises.push(
          fetchSubmissionFn(
            bundleFormData?.formId,
            bundleFormData?.submissionId,
            formId
          )
        );
      }

      const [formRes, submissionRes] = await Promise.all(promises);
      const formData = formRes.data;

      if (readOnlyOrHasSubmissionId) {
        const submissionData =
          cachedSubmission || submissionRes?.data?.data || {};
        dispatch(
          setBundleSubmissionData({
            data: {
              ..._.cloneDeep(bundleSubmission?.data),
              ..._.cloneDeep(submissionData),
            },
          })
        );

        if (!cachedSubmission) {
          setCacheSubmissions((prev) => ({
            ...prev,
            [formId]: submissionData,
          }));
        }
      }

      setForm(formData);

      if (!isReadOnly && !formCache[formData._id]) {
        setFormCache((prev) => ({ ...prev, [formData._id]: formData }));
      }
    } catch (err: any) {
      dispatch(
        setFormFailureErrorData("form", err?.response?.data || err?.message)
      );
    } finally {
      setLoadingForm(false);
    }
  }, [
    formStep,
    selectedForms,
    bundleFormData,
    cacheSubmissions,
    isReadOnly,
    dispatch,
    formCache,
    fetchSubmissionFn,
  ]);

  useEffect(() => {
    getFormAndSubmission();
    document.getElementById("main")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [formStep, getFormAndSubmission]);

  // Deep-cloning the (potentially large) submission data inline produced a new
  // object identity on every render, forcing formio-react's deep isEquals walk
  // each time — clone once per data change instead.
  const mergedSubmission = useMemo(
    () => ({
      data: {
        ..._.cloneDeep(bundleSubmission?.data),
        ..._.cloneDeep(submission?.data),
      },
    }),
    [bundleSubmission?.data, submission?.data]
  );

  // formio compares options by reference — keep a stable memoized instance.
  const formOptions = useMemo(
    () => ({
      buttonSettings: { showSubmit: false },
      ...options,
      noAlerts: false,
      i18n: RESOURCE_BUNDLES_DATA,
      readOnly: isReadOnly,
    }),
    [options, isReadOnly]
  );

  return (
    <>
      <BreadCrumbs
        items={stepLabels.map((label: string, i: number) => ({
          label,
          id: String(i),
        }))}
        variant="medium"
        activeIndex={formStep}
        onBreadcrumbClick={(item: { id?: string; label: string }) =>
          onLabelClick(Number(item.id))
        }
      />

      <div className="p-3 analyze-Submission-bundle-view ">
        {taskDetailsLoading || loadingForm || !selectedForms?.length ? (
          <div className="container">
            <Loading />
          </div>
        ) : (
          <>
            <Errors errors={error} />

            <Form
              key={isReadOnly ? "readonly" : "editable"}
              src={form}
              submission={mergedSubmission}
              options={formOptions}
              formReady={(instance: any) => (formRef.current = instance)}
            />

            <div className="d-flex justify-content-end">
              {formStep > 0 && (
                <V8CustomButton
                  label="Previous Form"
                  variant="secondary"
                  onClick={() => setFormStep((prev) => prev - 1)}
                  dataTestId="bundle-previous-form"
                  ariaLabel="Previous Form"
                  className="me-2"
                />
              )}
              {formStep < selectedForms.length - 1 && (
                <V8CustomButton
                  label="Next Form"
                  variant="primary"
                  onClick={() => setFormStep((prev) => prev + 1)}
                  disabled={bundleLoading}
                  dataTestId="bundle-next-form"
                  ariaLabel="Next Form"
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Stable references for mapStateToProps: fresh object/array literals per store
// notification defeated connect's shallow compare, re-rendering the formio
// <Form> wrapper on every dispatch.
const BUNDLE_FORM_OPTIONS = { noAlerts: false };

const selectFormErrors = createSelector(
  [
    (state: any) => selectError("submission", state),
    (state: any) => selectError("form", state),
  ],
  (submissionError, formError) => [submissionError, formError]
);

const mapStateToProps = (state: any) => ({
  form: selectRoot("form", state),
  submission: selectRoot("submission", state),
  options: BUNDLE_FORM_OPTIONS,
  errors: selectFormErrors(state),
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(BundleSubmissionForm);
