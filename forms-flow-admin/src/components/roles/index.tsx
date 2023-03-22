import React from "react";
import { fetchRoles } from "../../services/roles";
import Roles from "./roles";

const RoleManagement = React.memo((props: any) => {
  const { setTab, setCount } = props;

  const [roles, setRoles] = React.useState([]);
  const [error, setError] = React.useState();
  const [invalidated, setInvalidated] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (invalidated) {
      setLoading(true);
      fetchRoles((data) => {
        setRoles(data);
        setCount(data.length);
        setInvalidated(false);
        setLoading(false);
      }, setError);
    }
  }, [invalidated]);

  React.useEffect(() => {
    setTab("Roles");
    setLoading(true);
    fetchRoles((data) => {
      setRoles(data);
      setCount(data.length);
      setLoading(false);
    }, (err)=>{
      setError(err);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Roles
        {...props}
        roles={roles}
        setInvalidated={setInvalidated}
        loading={loading}
        error={error}
      />
    </>
  );
});

export default RoleManagement;
