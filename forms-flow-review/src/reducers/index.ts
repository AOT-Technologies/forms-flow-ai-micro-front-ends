import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 
import taskReducer from "./taskReducer";
import tableReducer  from "./tableReducer";
// Define the type for your root state (if needed)
import { History } from 'history';

const createRootReducer = (history:any) =>
  combineReducers({
    task: taskReducer,
    taskList: tableReducer,
    router: connectRouter(history),
  });

export default createRootReducer;