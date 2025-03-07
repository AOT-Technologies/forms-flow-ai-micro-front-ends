import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 

import task from "./taskReducer";
 

const createRootReducer = (history:any) =>
  combineReducers({
    task,
    router: connectRouter(history),
  });

export default createRootReducer;