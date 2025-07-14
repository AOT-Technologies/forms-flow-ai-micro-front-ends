import Submissions from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import { Provider } from "react-redux";
import StoreService from "./services/StoreServices";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const store = StoreService.configureStore();

export default function Root(props) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Switch>
            <Route path={BASE_ROUTE} render={() => <Submissions {...props} />} />
          </Switch>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
