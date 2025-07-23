import { combineReducers } from "@reduxjs/toolkit";
import analyzeSubmission from "./analizeSubmissionReducer";
import { connectRouter } from "connected-react-router"; 
import { History } from 'history';
import { submission, form } from "@aot-technologies/formio-react";
import  applications from './applicationReducer';
import customSubmission from './customSubmissionReducer';
import taskAppHistory from './taskAppHistoryReducer';


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
