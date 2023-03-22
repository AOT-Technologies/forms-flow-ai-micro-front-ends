import React from "react";
import { fetchRoles } from "../../services/roles";
import { fetchUsers } from "../../services/users";
import Users from "./users";

const UserManagement = React.memo((props: any) => {
  const { setTab, setCount } = props;

  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState();
  const [invalidated, setInvalidated] = React.useState(false);
  const [pageNo, setPageNo] = React.useState(1);
  const [search, setSearch] = React.useState(undefined);
  const [filter, setFilter] = React.useState(undefined);
  const [total, setTotal] = React.useState(undefined);

  React.useEffect(() => {
    if (filter === undefined) return;
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
        setTotal(results.count);
        setSearch(undefined);
      },
      (err) => {
        setError(err);
        setUsers([]);
        setTotal(0);
        setLoading(false);
      }
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
          setTotal(results.count);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setUsers([]);
          setTotal(0);
          setLoading(false);
        }
      );
    }, 1500);

    return () => clearTimeout(delay);
  }, [search]);

  React.useEffect(() => {
    if (invalidated) {
      setLoading(true);
      fetchUsers(
        filter,
        pageNo,
        search,
        (results) => {
          setUsers(results.data);
          setTotal(results.count);
          setInvalidated(false);
          setLoading(false);
        },
        (err) => {
          setError(err);
          setUsers([]);
          setTotal(0);
          setLoading(false);
        }
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
        setTotal(results.count);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
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
        filter={filter}
        setFilter={setFilter}
        total={total}
        error={error}
      />
    </>
  );
});

export default UserManagement;
