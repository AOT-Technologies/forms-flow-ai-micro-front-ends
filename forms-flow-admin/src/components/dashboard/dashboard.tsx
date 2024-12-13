import React from "react";
import { Button } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";
import Loading from "../loading";
import { useParams } from "react-router-dom";
import {removeTenantKey} from "../../utils/utils.js";
import { MULTITENANCY_ENABLED } from "../../constants";

import {
  updateAuthorization,
  fetchAuthorizations,
} from "../../services/dashboard";
import { Translation, useTranslation } from "react-i18next";
import { TableFooter } from "@formsflow/components";  

const InsightDashboard = React.memo((props: any) => {
  const { dashboards, groups, authorizations, setCount, authReceived } = props;

  const isGroupUpdated = groups.length > 0;
  const [authDashBoardList, setAuthDashboardList] = React.useState([]);
  const [isAuthUpdated, setIsAuthUpdated] = React.useState(false);

  const { t } = useTranslation();
  const { tenantId } = useParams();
  const [remainingGroups, setRemainingGroups] = React.useState([]);

  const [activeRow, setActiveRow] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [err, setErr] = React.useState({});
  const [limit, setLimit] = React.useState(5); 
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (props.error) {
      setIsLoading(false);
    }
  }, [props.error]);

  React.useEffect(() => {
    if (!props.loading) {
      setIsLoading(false);
    }
  }, [props.loading])

  function compare(a, b) {
    if (Number(a.resourceId) < Number(b.resourceId)) {
      return -1;
    }
    if (Number(a.resourceId) > Number(b.resourceId)) {
      return 1;
    }
    return 0;
  }

  const updateAuthList = (authorizations) => {
    let newList = [...authorizations];
    let authIds = newList.map((item) => item.resourceId);
    for (let item of dashboards?.results) {
      if (!authIds.includes(String(item.id))) {
        let obj = {
          resourceId: String(item.id),
          resourceDetails: {
            name: item.name,
          },
          roles: [],
        };
        newList.push(obj);
      }
    }
    return newList.sort(compare);
  };

  React.useEffect(() => {
    if (
      dashboards?.results?.length > 0 &&
      authReceived &&
      !isAuthUpdated
    ) {
      let authList = updateAuthList(authorizations);
      setAuthDashboardList(authList);
      setCount(authList.length)
      setIsAuthUpdated(true);
      setIsLoading(false);
    }
  }, [dashboards, authReceived, isAuthUpdated]);

  // handles the add button click event
  const handleClick = (event, rowData) => {
    let approvedGroupIds = rowData.roles;
    let listGroup = groups.filter(
      (item) => approvedGroupIds.includes(item.path) === false
    );
    setActiveRow(rowData);
    setRemainingGroups(listGroup);
    setShow(!show);
  };

  const id = show ? "simple-popover" : undefined;

  const removeDashboardAuth = (rowData, groupPath) => {
    let dashboard = {
      ...authDashBoardList.find(
        (element) => element.resourceId === rowData.resourceId
      ),
    };
    let modifiedRoles = dashboard.roles.filter((item) => item !== groupPath);
    dashboard.roles = modifiedRoles;
    setIsLoading(true);
    updateAuthorization(
      dashboard,
      () => {
        fetchAuthorizations((data) => {
          setAuthDashboardList(updateAuthList(data));
          setIsLoading(false);
          toast.success(t("Update success!"))
        }, (err) => {
          setErr(err);
          toast.error(t("Update failed!"))
        });
      },
      setErr
    );
  };

  const addDashboardAuth = (data) => {
    let currentRow = { ...activeRow };
    currentRow.roles = [...activeRow.roles, data.path];
    setActiveRow(currentRow);
    setShow(!show);
    setIsLoading(true);
    updateAuthorization(
      currentRow,
      () => {
        fetchAuthorizations((data) => {
          setAuthDashboardList(updateAuthList(data));
          setIsLoading(false);
          toast.success(t("Update success!"))
        }, (err) => {
          setErr(err);
          toast.error(t("Update failed!"))
        });
      },
      setErr
    );
  };
  const noData = () => (
    <div data-testid="dashboard-no-data-msg">
      <h3 className="text-center">
        <Translation>{(t) => t(props.error || "No data Found")}</Translation>
      </h3>
    </div>
  );

  const columns = [
    {
      dataField: "resourceDetails.name",
      text: <Translation>{(t) => t("Dashboard")}</Translation>,
    },
    {
      dataField: "roles",
      text: <Translation>{(t) => t("Access Roles")}</Translation>,
      formatter: (cell, rowData) => {
        return (
          <div className="d-flex flex-wrap col-12">
            {cell?.map((label, i) => (
              <div key={i} className="d-flex align-items-center justify-content-between rounded-pill px-3 py-2 small m-2"
                style={{ background: "#EAEFFF" }}
                data-testid={`dashboard-access-group-${i}`}>
                <span className="">
                  {MULTITENANCY_ENABLED ? removeTenantKey(label,tenantId) : label}
                  <i
                    className="fa-solid fa-xmark chip-close ms-2"
                    onClick={() => removeDashboardAuth(rowData, label)}
                    data-testid={`dashboard-remove-auth-btn-${i}`}
                  ></i>
                </span>
              </div>
            ))}
          </div>
        );
      },
    },
    {
      dataField: "resourceId",
      text: <Translation>{(t) => t("Action")}</Translation>,
      formatExtraData: { show, remainingGroups, isGroupUpdated },
      formatter: (cell, rowData, rowIdx, formatExtraData) => {
        let { show, remainingGroups, isGroupUpdated } = formatExtraData;
        return (
          <OverlayTrigger
            trigger="click"
            key={rowIdx}
            placement="left"
            rootClose={true}
            overlay={
              <Popover id={`popover-positioned-bottom`}>
                <Popover.Body>
                  <div className="role-list">
                    {remainingGroups.length > 0 ? (
                      remainingGroups.map((item, key) => (
                        <div
                          className="role"
                          key={key}
                          onClick={() => addDashboardAuth(item)}
                          data-testid={`dashboard-remaining-group-${key}`}
                        >
                          {MULTITENANCY_ENABLED ? removeTenantKey(item.path, tenantId) : item.path}
                        </div>
                      ))
                    ) : (
                      <div className="role">{`${t(
                        "All groups have access to the dashboard"
                      )}`}</div>
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            }
          >
            <Button
              data-testid={rowIdx}
              onClick={(e) => handleClick(e, rowData)}
              className="btn btn-primary"
              disabled={!isGroupUpdated}
            >
              <i className="fa-solid fa-plus me-2"></i>
              <Translation>{(t) => t("Add")}</Translation>
            </Button>
          </OverlayTrigger>
        );
      },
    },
  ];

  const getpageList = () => {
    const list = [
      {
        text: "5",
        value: 5,
      },
      {
        text: "25",
        value: 25,
      },
      {
        text: "50",
        value: 50,
      },
      {
        text: "100",
        value: 100,
      },
      {
        text: t("All"),
        value: authDashBoardList.length
      },
    ];
    return list;
  };

  return (
    <>
      <div className="" role="definition">
        <br />
        <div>
          {!isLoading ? (
            <div>
            <BootstrapTable
              keyField="resourceId"
              data={authDashBoardList}
              columns={columns}
              bordered={false}
              wrapperClasses="table-container-admin mb-3 px-4"
              rowStyle={{
                color: "#09174A",
                fontWeight: 400,
              }}
              noDataIndication={noData}
              data-testid="admin-dashboard-table"
            />
            <table className="table">
              <tfoot>
              <TableFooter
              limit={limit}
              activePage={activePage}
              totalCount={authDashBoardList.length}
              handlePageChange={(page) => setActivePage(page)}
              onLimitChange={setLimit}
              pageOptions={getpageList()}
            />
              </tfoot>
          </table>
          </div>
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </>
  );
});

export default InsightDashboard;