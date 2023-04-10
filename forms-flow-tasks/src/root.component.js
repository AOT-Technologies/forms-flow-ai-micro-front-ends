import Task from '.';
import {BrowserRouter} from "react-router-dom";

export default function Root(props) {
  return <section>{props.name} is mounted!</section>;
}
