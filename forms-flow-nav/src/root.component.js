import NavBar from "./Navbar";
import { BrowserRouter as Router } from "react-router-dom";

export default function Root(props) {
  return (
    <Router>
      <NavBar props={props} />
    </Router>
  );
}
