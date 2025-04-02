import { combineReducers } from "@reduxjs/toolkit";
import { connectRouter } from "connected-react-router"; 
import { form } from "@aot-technologies/formio-react";


import task from "./taskReducer";
 

const createRootReducer = (history:any) =>
  combineReducers({
    task,
    router: connectRouter(history),
    form: form({ name: "form" }),
  });

export default createRootReducer;