import { combineReducers } from "@reduxjs/toolkit";
import analyzeSubmission from "./analizeSubmissionReducer";
import { connectRouter } from "connected-react-router"; 
import { submission, form } from "@aot-technologies/formio-react";
import { History } from 'history';
import  applications from './applicationReducer';
import taskAppHistory from './taskAppHistoryReducer'
import customSubmission from './customSubmissionReducer'
const createRootReducer = (history: History) =>
  combineReducers({
    router: connectRouter(history),
    analyzeSubmission: analyzeSubmission,
    applications: applications,
    taskAppHistory: taskAppHistory,
    submission: submission({ name: "submission" }),
    customSubmission: customSubmission,
    form: form({ name: "form" }),
  });

export default createRootReducer;
export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
