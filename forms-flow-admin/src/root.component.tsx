import Admin from "."
import {BrowserRouter} from "react-router-dom";

export default function Root(props) {    
  return <BrowserRouter><Admin props={props} /> </BrowserRouter>
}
