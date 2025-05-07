import Review from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import { Provider } from "react-redux";
import StoreService from "./services/StoreService";
import { ConnectedRouter } from "connected-react-router";
import { useEffect } from "react";
import { StorageService} from "@formsflow/service";
 import { restTaskListParams } from "./actions/taskActions";
export default function Root(props: any) {
  const REVIEW_APP_KEY = "TASK_APP_DATA";
  const store = StoreService.configureStore();
  const history = StoreService.history;

  useEffect(()=>{
    /**
     * * This is to check if the user has come from the review app and if so, we need to set the task list params in the redux store.
     * * This is done to avoid the user from going back to the review app and losing the data in the redux store.
     */
    const existingTaskData = StorageService.getParsedData(REVIEW_APP_KEY);
    if(existingTaskData){
      store.dispatch(restTaskListParams({...existingTaskData,filterCached:true}));
    }
    StorageService.delete(REVIEW_APP_KEY);
    return()=>{
       StorageService.saveDataToSessionStorage(REVIEW_APP_KEY,store.getState().task);
    }
  },[])

  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <BrowserRouter>
          <Switch>
            <Route
              path={BASE_ROUTE}
              render={() => <Review {...props} />}
            ></Route>
          </Switch>
        </BrowserRouter>
      </ConnectedRouter>
    </Provider>
  );
}
