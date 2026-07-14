import Admin from ".";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import BillingReturn from "./components/billing-return";
import BillingManage from "./components/billing-manage";

export default function Root(props: any) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/billing/return" element={<BillingReturn />} />
        <Route path="/billing/manage" element={<BillingManage />} />
        <Route path="/tenant/:tenantId/billing/manage" element={<BillingManage />} />
        <Route path={`${BASE_ROUTE.replace(/\/$/, '')}/admin/*`} element={<Admin props={props} />} />
      </Routes>
    </BrowserRouter>
  );
}
