import Admin from ".";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { BASE_ROUTE } from "./constants";
import BillingReturn from "./components/billing-return";
import BillingManage from "./components/billing-manage";

// Defaults copied verbatim from forms-flow-web's App.jsx. They are deliberate there -
// react-query v3 would otherwise retry three times and refetch on window focus and on
// reconnect, none of which the effects it replaced ever did. The usage card is rendered in
// both apps, so letting the two diverge would give the same number different refresh
// behaviour depending on which page you were looking at.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 0,
    },
  },
});

export default function Root(props: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/billing/return" element={<BillingReturn />} />
          <Route path="/billing/manage" element={<BillingManage />} />
          <Route
            path="/tenant/:tenantId/billing/manage"
            element={<BillingManage />}
          />
          <Route
            path={`${BASE_ROUTE.replace(/\/$/, "")}/admin/*`}
            element={<Admin props={props} />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
