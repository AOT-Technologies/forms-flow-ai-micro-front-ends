import React from "react";
import { toast } from "react-toastify";
import { fetchRoles } from "../../services/roles";
import { fetchUsers } from "../../services/users";
import Users from "./users";
import {useTranslation} from "react-i18next";
import {removingTenantId} from "../../utils/utils.js";
import { useParams } from "react-router-dom";
import { MULTITENANCY_ENABLED } from "../../constants";
const UserManagement = React.memo((props: any) => {
  const { setTab, setCount } = props;
  const { tenantId } = useParams();

  const [users, setUsers] = React.useState([]);
  const [roles, setRoles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState();
  const [invalidated, setInvalidated] = React.useState(false);
  const [pageNo, setPageNo] = React.useState(1);
  const [search, setSearch] = React.useState(undefined);
  const [filter, setFilter] = React.useState(undefined);
  const [total, setTotal] = React.useState(undefined);
  const { t } = useTranslation();
  const [sizePerPage, setSizePerPage] = React.useState(5);
  
  React.useEffect(() => {
    if (filter === undefined) return;
    setLoading(true);
    fetchUsers(
      filter,
      1,
      search,
      sizePerPage,
      (results) => {
        setUsers(removeTenantIdFromUserRoles(results.data));
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
        sizePerPage,
        (results) => {
          setUsers(removeTenantIdFromUserRoles(results.data));
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
        sizePerPage,
        (results) => {
          setUsers(removeTenantIdFromUserRoles(results.data));
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
      sizePerPage,
      (results) => {
        
        setUsers(removeTenantIdFromUserRoles(results.data));
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
      setRoles(removingTenantId(data,tenantId));
    }, (err)=>{
      setError(err);
      toast.error(t("Failed to fetch roles!"))
    });
  }, [sizePerPage]);

  const removeTenantIdFromUserRoles = (data)=>{
    let updatedUserData = []
        if(MULTITENANCY_ENABLED){
          data?.forEach((user)=>{
             user.role = removingTenantId(user.role, tenantId,true) 
             updatedUserData.push(user)
          })
        }else{
          updatedUserData = data
        } 
    return updatedUserData
  }
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
        limit = {{sizePerPage , setSizePerPage}}
      />
    </>
  );
});

export default UserManagement;
