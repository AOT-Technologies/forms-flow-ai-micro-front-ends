import React from "react";
import { fetchRoles } from "../../services/roles";
import { fetchUsers } from "../../services/users";
import Users from "./users";

const UserManagement = React.memo((props: any) => {
  const { setTab, setCount } = props;

  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState({});
  const [invalidated, setInvalidated] = React.useState(false);
  const [pageNo, setPageNo] = React.useState(1);
  const [search, setSearch] = React.useState(undefined);
  const [filter, setFilter] = React.useState(undefined);

  React.useEffect(() => {
    setLoading(true);
    fetchUsers(
      filter,
      1,
      search,
      (results) => {
        setUsers(results.data);
        setInvalidated(false);
        setPageNo(1);
        setLoading(false);
      },
      setError
    );
  }, [filter]);

  React.useEffect(() => {
    if (search === undefined) return;
    let delay = setTimeout(() => {
      setLoading(true);
      fetchUsers(
        filter,
        1,
        search,
        (results) => {
          setUsers(results.data);
          setInvalidated(false);
          setPageNo(1);
          setLoading(false);
        },
        setError
      );
    }, 1500);

    return () => clearTimeout(delay);
  }, [search]);

  React.useEffect(() => {
    if (invalidated) {
      setLoading(true);
      fetchUsers(
        null,
        pageNo,
        search,
        (results) => {
          setUsers(results.data);
          setInvalidated(false);
          setLoading(false);
        },
        setError
      );
    }
  }, [invalidated]);

  React.useEffect(() => {
    setTab("Users");
    setLoading(true);
    fetchUsers(
      null,
      pageNo,
      null,
      (results) => {
        setUsers(results.data);
        setCount(results.count);
        setLoading(false);
      },
      setError
    );

    fetchRoles((data) => {
      setRoles(data);
    }, setError);
  }, []);

  return (
    <>
      <Users
        {...props}
        users={users}
        roles={roles}
        setInvalidated={setInvalidated}
        page={{ pageNo, setPageNo }}
        loading={loading}
        search={search}
        setSearch={setSearch}
        setFilter={setFilter}
      />
    </>
  );
});

export default UserManagement;
