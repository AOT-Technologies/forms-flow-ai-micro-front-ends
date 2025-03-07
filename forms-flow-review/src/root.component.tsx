import Review from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import { Provider } from "react-redux";
import StoreService from "./services/StoreService";
import { ConnectedRouter } from "connected-react-router";

export default function Root(props: any) {
  const store = StoreService.configureStore();
  const history = StoreService.history;
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
