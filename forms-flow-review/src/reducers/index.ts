import { combineReducers } from "@reduxjs/toolkit";
import { form, submission } from "@aot-technologies/formio-react";
import TaskHandler from "./taskReducer";
import customSubmission from "./customSubmissionReducer";
import tenants from "./tenantReducer";

const createRootReducer = () =>
  combineReducers({
    task: TaskHandler,
    form: form({ name: "form" }),
    customSubmission: customSubmission,
    tenants: tenants,
    submission: submission({ name: "submission" }),
  });

export default createRootReducer;
export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
