import Submissions from ".";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
          <Routes>
            <Route path={`${BASE_ROUTE}*`} element={<Submissions {...props} />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
