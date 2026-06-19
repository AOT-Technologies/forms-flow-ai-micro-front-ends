import { combineReducers } from "@reduxjs/toolkit";
import analyzeSubmission from "./analizeSubmissionReducer";
import { submission, form } from "@aot-technologies/formio-react";
import applications from './applicationReducer';
import customSubmission from './customSubmissionReducer';
import taskAppHistory from './taskAppHistoryReducer';
import process from './processReducer';
import submissionBundle from './bundleReducer';
import tenants from './tenantReducer';

const createRootReducer = () =>
  combineReducers({
    analyzeSubmission: analyzeSubmission,
    applications: applications,
    taskAppHistory: taskAppHistory,
    submission: submission({ name: "submission" }),
    customSubmission: customSubmission,
    form: form({ name: "form" }),
    process: process,
    submissionBundle: submissionBundle,
    tenants: tenants,
  });

export default createRootReducer;
export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
