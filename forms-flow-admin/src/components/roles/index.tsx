import React from "react";
import { fetchRoles } from "../../services/roles";
import Roles from "./roles";

const RoleManagement = React.memo((props : any) => {
  
    const {setTab, setCount} = props;

    const [roles, setRoles] = React.useState([]);
    const [error, setError] = React.useState({});
    const [invalidated, setInvalidated] = React.useState(false);

  React.useEffect(()=>{
    if(invalidated){
      fetchRoles((data)=>{
        setRoles(data)
        setCount(data.length)
        setInvalidated(false)
      }, setError);
    }
  },[invalidated])

  React.useEffect(() => {
    setTab("Roles");
    fetchRoles((data)=>{
      setRoles(data)
      setCount(data.length)

    }, setError);
  }, []);

  return (
    <>
    <Roles {...props} roles={roles} setInvalidated={setInvalidated} />
    </>
  );
});

export default RoleManagement;
