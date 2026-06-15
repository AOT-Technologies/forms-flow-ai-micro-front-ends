import Task from ".";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import { Provider } from "react-redux";
import StoreService from "./services/StoreService";
import { useEffect } from "react";
import { StorageService} from "@formsflow/service";
import { resetTaskListParams } from "./actions/taskActions";
export default function Root(props: any) {
  const TASK_APP_KEY = "TASK_APP_DATA";
  const store = StoreService.configureStore();

  useEffect(()=>{
    /**
     * * This is to check if the user has come from the task app and if so, we need to set the task list params in the redux store.
     * * This is done to avoid the user from going back to the task app and losing the data in the redux store.
     */
    const existingTaskData = StorageService.getParsedData(TASK_APP_KEY);
    if(existingTaskData){
      store.dispatch(resetTaskListParams({...existingTaskData,filterCached:true}));
    }
    StorageService.delete(TASK_APP_KEY);
    return()=>{
        // if user logout we don't want to keep their data so while logout the auth token will be clear from session storage
        const isAuth = StorageService.get("AUTH_TOKEN");
        if(isAuth){
          StorageService.saveDataToSessionStorage(TASK_APP_KEY,store.getState().task);
        }
    }
  },[])

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route
            path={`${BASE_ROUTE}*`}
            element={<Task {...props} />}
          />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
