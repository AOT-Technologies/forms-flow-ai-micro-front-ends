// rootReducer.ts (or wherever createRootReducer is defined)
import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 
import { form, submission } from "@aot-technologies/formio-react";
import TaskHandler from "./taskReducer";
import { History } from 'history';
import customSubmission from "./customSubmissionReducer";
import tenants from "./tenantReducer";
const createRootReducer = (history: History) =>
  combineReducers({
    task: TaskHandler,
    router: connectRouter(history),
    form: form({ name: "form" }),
    customSubmission:customSubmission,
    tenants: tenants,
    submission: submission({ name: "submission" }),
  });

export default createRootReducer;
export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
