// rootReducer.ts (or wherever createRootReducer is defined)
import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 
import taskReducer from "./taskReducer";

// Define the type for your root state (if needed)
import { History } from 'history';

const createRootReducer = (history: History) =>
  combineReducers({
    task: taskReducer,
    router: connectRouter(history),
  });

export default createRootReducer;
