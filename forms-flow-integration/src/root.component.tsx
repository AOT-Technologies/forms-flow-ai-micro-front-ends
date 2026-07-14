import Integration from ".";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { BASE_ROUTE } from "./constants";

export default function Root(props) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={`${BASE_ROUTE}*`} element={<Integration props={props} />} />
      </Routes>
    </BrowserRouter>
  );
}
