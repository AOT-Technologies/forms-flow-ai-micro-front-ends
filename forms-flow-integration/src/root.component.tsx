import Integration from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";

export default function Root(props) {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={BASE_ROUTE} render={() => <Integration props={props} />}></Route>
      </Switch>
    </BrowserRouter>
  );
}
