import Admin from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";
import BillingReturn from "./components/billing-return";
import BillingManage from "./components/billing-manage";

export default function Root(props) {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/billing/return" render={() => <BillingReturn />} />
        <Route exact path="/billing/manage" render={() => <BillingManage />} />
        <Route exact path="/tenant/:tenantId/billing/manage" render={() => <BillingManage />} />
        <Route path={BASE_ROUTE} render={() => <Admin props={props} />}></Route>
      </Switch>
    </BrowserRouter>
  );
}
