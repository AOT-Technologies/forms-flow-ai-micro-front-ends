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
  const [dashboardLoading, setDashboardLoading] = React.useState(true);
  const [groupLoading, setGroupLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    setTab("Dashboard");
    setLoading(true);
    fetchdashboards((data)=>{
      setDashboards(data);
      setDashboardLoading(false);
    }, setError);
    fetchGroups((data)=>{
      setGroups(data);
      setGroupLoading(false);
    }, setError);
    fetchAuthorizations((data)=>{
      setAuthorizations(data);
      setAuthLoading(false);
    }, setError);
  }, []);

  React.useEffect(()=>{
    if(!dashboardLoading && !groupLoading && !authLoading){
      setLoading(false)
    }
  },[dashboardLoading, groupLoading, authLoading])

  return (
    <InsightDashboard
      {...props}
      dashboards={dashboards}
      groups={groups}
      authorizations={authorizations}
      setCount={setCount}
      error={error}
      loading={loading}
    />
  );
});

export default AdminDashboard;
