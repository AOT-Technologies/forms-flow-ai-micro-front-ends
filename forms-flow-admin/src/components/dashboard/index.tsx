import React from "react";
import InsightDashboard from "./dashboard";

import { fetchdashboards, fetchGroups } from "../../services/dashboard";
import "./insightDashboard.scss";

const AdminDashboard = React.memo((props: any) => {
  const { setTab, setCount } = props;
  const [dashboards, setDashboards] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [error, setError] = React.useState();
  const [dashboardLoading, setDashboardLoading] = React.useState(true);
  const [groupLoading, setGroupLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setTab("Dashboard");
    setLoading(true);

    fetchdashboards(
      (data) => {
        setDashboards(data);
        setDashboardLoading(false);
      },
      (error) => {
        setError(error);
        setDashboardLoading(false);
      }
    );

    fetchGroups(
      (data) => {
        setGroups(data);
        setGroupLoading(false);
      },
      (error) => {
        setError(error);
        setGroupLoading(false);
      }
    );
  }, []);

  React.useEffect(() => {
    if (!dashboardLoading && !groupLoading) {
      setLoading(false);
    }
  }, [dashboardLoading, groupLoading]);

  return (
    <InsightDashboard
      {...props}
      dashboards={dashboards}
      groups={groups}
      setCount={setCount}
      error={error}
      loading={loading}
    />
  );
});

export default AdminDashboard;
