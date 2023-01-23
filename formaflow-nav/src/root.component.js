import NavBar from "./Navbar";
export default function Root(props) {
  console.log("The props from root conf", props)
  return <NavBar props={props} />;
}
