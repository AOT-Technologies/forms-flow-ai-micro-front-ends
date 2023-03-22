import React from "react";
import InsightDashboard from "./dashboard";

import {
  fetchdashboards,
  fetchGroups,
  fetchAuthorizations,
} from "../../services/dashboard";
import "./insightDashboard.scss";

const AdminDashboard = React.memo((props : any) => {
  const {setTab, setCount} = props;
  const [dashboards, setDashboards] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [authorizations, setAuthorizations] = React.useState([]);
  const [error, setError] = React.useState();
  
  React.useEffect(() => {
    setTab("Dashboard");
    fetchdashboards(setDashboards, setError);
    fetchGroups(setGroups, setError);
    fetchAuthorizations((data)=>{
      setAuthorizations(data)
    }, setError);
  }, []);

  return (
    <InsightDashboard
      {...props}
      dashboards={dashboards}
      groups={groups}
      authorizations={authorizations}
      setCount={setCount}
      error={error}
    />
  );
});

export default AdminDashboard;
