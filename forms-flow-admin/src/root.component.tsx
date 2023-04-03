import Admin from ".";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { BASE_ROUTE } from "./constants";

export default function Root(props) {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={BASE_ROUTE} render={() => <Admin props={props} />}></Route>
      </Switch>
    </BrowserRouter>
  );
}
