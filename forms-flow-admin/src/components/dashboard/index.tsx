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
  const [search, setSearch] = React.useState(undefined);

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
      if (search === undefined) return;
      let delay = setTimeout(() => {
        setLoading(true);
        // fetchdashboards(
        //   filter,
        //   1,
        //   search,
        //   sizePerPage,
        //   (results) => {
        //     setDashboards(results.data);
        //     setLoading(false);
        //   },
        //   (err) => {
        //     setError(err);
        //     setLoading(false);
        //   }
        // );
      }, 1500);
  
      return () => clearTimeout(delay);
    }, [search]);

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
      search={search}
      setSearch={setSearch}
    />
  );
});

export default AdminDashboard;
