import React from "react";
import { fetchUsers } from "../../services/users";
import Users from "./users";

const UserManagement = React.memo((props : any) => {
  
    const {setTab, setCount} = props;

    const [users, setUsers] = React.useState([]);
    const [error, setError] = React.useState({});
    const [invalidated, setInvalidated] = React.useState(false);

  React.useEffect(()=>{
    if(invalidated){
      fetchUsers(null, (data)=>{
        setUsers(data)
        setCount(data.length)
        setInvalidated(false)
      }, setError);
    }
  },[invalidated])

  React.useEffect(() => {
    setTab("Users");
    fetchUsers(null, (data)=>{
      setUsers(data)
      setCount(data.length)

    }, setError);
  }, []);

  return (
    <>
    <Users {...props} users={users} setInvalidated={setInvalidated} />
    </>
  );
});

export default UserManagement;