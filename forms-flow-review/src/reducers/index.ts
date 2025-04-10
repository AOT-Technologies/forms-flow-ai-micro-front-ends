// rootReducer.ts (or wherever createRootReducer is defined)
import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 
import { form } from "@aot-technologies/formio-react";
import taskReducer from "./taskReducer";
import tableReducer  from "./tableReducer";
// Define the type for your root state (if needed)
import { History } from 'history';

const createRootReducer = (history: History) =>
  combineReducers({
    task: taskReducer,
    taskList: tableReducer,
    router: connectRouter(history),
    form: form({ name: "form" }),
  });

export default createRootReducer;
