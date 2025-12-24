import React from "react";
import BootstrapTable from "react-bootstrap-table-next";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";
import Loading from "../loading";
import { useParams } from "react-router-dom";
import { removeTenantKey } from "../../utils/utils.js";
import { MULTITENANCY_ENABLED } from "../../constants";

import {
  updateAuthorization,
  fetchdashboards,
} from "../../services/dashboard";
import { Translation, useTranslation } from "react-i18next";
import { TableFooter, V8CustomButton, BreadCrumbs } from "@formsflow/components";
import { useHistory } from "react-router-dom";  

const InsightDashboard = React.memo((props: any) => {
  const { dashboards, groups, setCount, authReceived, loading: parentLoading } = props;

  const isGroupUpdated = groups.length > 0;
  const [dashboardList, setDashboardList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const { t } = useTranslation();
  const { tenantId } = useParams();
  const history = useHistory();
  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  const [remainingGroups, setRemainingGroups] = React.useState([]);

  const [activeRow, setActiveRow] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [err, setErr] = React.useState({});
  const [limit, setLimit] = React.useState(5); 

  // Use the authorizations data passed from parent
  React.useEffect(() => {
    // Set loading to false when parent has finished loading
    if (!parentLoading) {
      setIsLoading(false);
    }
  }, [parentLoading]);

  // Update dashboard list when dashboards data changes
  React.useEffect(() => {
    if (dashboards && Array.isArray(dashboards)) {
      setDashboardList(dashboards);
      setCount(dashboards.length);
    }
  }, [dashboards, setCount]);

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
      ...dashboardList.find(
        (element) => element.resourceId === rowData.resourceId
      ),
    };
    let modifiedRoles = dashboard.roles.filter((item) => item !== groupPath);
    dashboard.roles = modifiedRoles;
    setIsLoading(true);
    updateAuthorization(
      dashboard,
      () => {
        fetchdashboards((data) => {
          setDashboardList(data);
          setCount(data.length);
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
        fetchdashboards((data) => {
          setDashboardList(data);
          setCount(data.length);
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

  const paginatedDashboard = dashboardList.slice(
    (activePage - 1) * limit, 
    activePage * limit 
  );

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setActivePage(1); 
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
            <V8CustomButton
              label={t("Add")}
              onClick={(e) => handleClick(e, rowData)}
              variant="primary"
              data-testid={rowIdx}
              disabled={!isGroupUpdated}
              icon={<i className="fa-solid fa-plus me-2"></i>}
            />
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
        value: dashboardList.length
      },
    ];
    return list;
  };

  // Breadcrumb configuration
  const breadcrumbItems = [
    { label: t("Manage"), id: "manage" },
    { label: t("Dashboards"), id: "dashboards" }
  ];

  const handleBreadcrumbClick = (item: { label: string; id?: string }) => {
    if (item.id === "manage" || item.id === "dashboards") {
      history.push(`${baseUrl}admin/dashboard`);
    }
  };

  return (
    <>
      <div style={{ marginBottom: "15px" }}>
        <BreadCrumbs
          items={breadcrumbItems}
          variant="default"
          onBreadcrumbClick={handleBreadcrumbClick}
          dataTestId="admin-dashboard-breadcrumbs"
        />
      </div>
      <div className="" role="definition">
        <br />
        <div>
          {!isLoading ? (
            <div>
            <BootstrapTable
              keyField="resourceId"
              data={paginatedDashboard}
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
            <table className="table old-design">
              <TableFooter
              limit={limit}
              activePage={activePage}
              totalCount={dashboardList.length}
              handlePageChange={(page: number) => setActivePage(page)}
              onLimitChange={handleLimitChange}
              pageOptions={getpageList()}
            />
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