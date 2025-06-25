import { combineReducers } from "@reduxjs/toolkit";
import analyzeSubmission from "./analizeSubmissionReducer";
import { connectRouter } from "connected-react-router"; 
import { History } from 'history';
const createRootReducer = (history: History) =>
  combineReducers({
    router: connectRouter(history),
    analyzeSubmission: analyzeSubmission,
  });

export default createRootReducer;
export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
