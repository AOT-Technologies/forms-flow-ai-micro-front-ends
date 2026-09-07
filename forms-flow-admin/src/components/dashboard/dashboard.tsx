import React from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";
import Loading from "../loading";
import { useParams } from "react-router-dom";
import { formatRoleDisplayName } from "../../utils/utils.js";
import { MULTITENANCY_ENABLED } from "../../constants";

import { updateAuthorization, fetchdashboards } from "../../services/dashboard";
import { useTranslation } from "react-i18next";
import { V8CustomButton, ReusableTable, CustomSearch, AddWithDropdown } from "@formsflow/components";
import { getColumnPresetSizing, StorageService } from "@formsflow/service";

const DEFAULT_SORT_MODEL: any[] = [];

const InsightDashboard = React.memo((props: any) => {
  const { dashboards, groups, setCount, loading: parentLoading } = props;

  const isGroupUpdated = groups.length > 0;
  const [dashboardList, setDashboardList] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const { t } = useTranslation();
  const { tenantId: urlTenantId } = useParams<{ tenantId?: string }>();
  const tenantKeyForRoleDisplay =
    MULTITENANCY_ENABLED && (urlTenantId || StorageService.get("tenantKey"))
      ? String(urlTenantId || StorageService.get("tenantKey"))
      : "";
  const [remainingGroups, setRemainingGroups] = React.useState([]);

  const [activeRow, setActiveRow] = React.useState(null);
  const [activePage, setActivePage] = React.useState(1);
  const [err, setErr] = React.useState({});
  const [limit, setLimit] = React.useState(5);
  const [searchKey, setSearchKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
  };

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
        fetchdashboards(
          (data) => {
            setDashboardList(data);
            setCount(data.length);
            setIsLoading(false);
            toast.success(t("Update success!"));
          },
          (err) => {
            setErr(err);
            toast.error(t("Update failed!"));
          }
        );
      },
      setErr
    );
  };

  const addDashboardAuth = (data) => {
    let currentRow = { ...activeRow };
    currentRow.roles = [...activeRow.roles, data.path];
    setActiveRow(currentRow);
    setIsLoading(true);
    updateAuthorization(
      currentRow,
      () => {
        fetchdashboards(
          (data) => {
            setDashboardList(data);
            setCount(data.length);
            setIsLoading(false);
            toast.success(t("Update success!"));
          },
          (err) => {
            setErr(err);
            toast.error(t("Update failed!"));
          }
        );
      },
      setErr
    );
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setActivePage(1);
  };

  React.useEffect(() => {
      setLoading(props?.loading);
  }, [props?.loading]);
  
  const handleSearch = (e) => {
    if (e && e.key === "Enter") {
      setSearchKey(e.target.value);
    }
  };
  const handleClearSearch = () => {
    setSearchKey("");
  };

  const columns = [
    {
      field: "dashboardName",
      headerName: t("Dashboard"),
      preset: "primaryName",
      ...getColumnPresetSizing("primaryName"),
      textAlign: "left",
      sortable: false,
      renderCell: (params) => params.row?.resourceDetails?.name,
    },
    {
      field: "roles",
      headerName: t("Access Roles"),
      preset: "chipSet",
      ...getColumnPresetSizing("chipSet"),
      textAlign: "left",
      sortable: false,
      renderCell: (params) => {
        const rowData = params.row;
        const cell = rowData?.roles;
        return (
          <div className="d-flex flex-wrap col-12">
            {cell?.map((label, i) => (
              <div
                key={i}
                className="role-badge user-role-badge"
                data-testid={`dashboard-access-group-${i}`}
              >
                <span className="">
                  {formatRoleDisplayName(label, tenantKeyForRoleDisplay)}
                  <i
                    className="fa-solid fa-xmark chip-close ms-2"
                    onClick={() => removeDashboardAuth(rowData, label)}
                    aria-label={t("Remove role access")}
                    data-testid={`dashboard-remove-auth-btn-${i}`}
                  ></i>
                </span>
              </div>
            ))}
            <AddWithDropdown
              id={`dashboard-add-auth-${params.id}`}
              name="Add Dashboard Auth"
              options={remainingGroups}
              onSelect={addDashboardAuth}
              emptyMessage={t("No groups available")}
              dataTestId={`dashboard-add-auth-dropdown-${params.id}`}
            />
          </div>
        );
      },
    },
    // {
    //   field: "resourceId",
    //   headerName: t("Action"),
    //   width: 140,
    //   minWidth: 140,
    //   flex: 0,
    //   sortable: false,
    //   headerAlign: "center",
    //   align: "center",
    //   renderCell: (params) => {
    //     const rowData = params.row;
    //     return (
    //       <OverlayTrigger
    //         trigger="click"
    //         key={params.id}
    //         placement="left"
    //         rootClose={true}
    //         container={document.body}
    //         overlay={
    //           <Popover id={`popover-positioned-bottom`}>
    //             <Popover.Body>
    //               <div className="role-list">
    //                 {remainingGroups.length > 0 ? (
    //                   remainingGroups.map((item, key) => (
    //                     <div
    //                       className="role"
    //                       key={key}
    //                       onClick={() => addDashboardAuth(item)}
    //                       data-testid={`dashboard-remaining-group-${key}`}
    //                     >
    //                       {formatRoleDisplayName(
    //                         item.path,
    //                         tenantKeyForRoleDisplay
    //                       )}
    //                     </div>
    //                   ))
    //                 ) : (
    //                   <div className="role">{`${t(
    //                     "All groups have access to the dashboard"
    //                   )}`}</div>
    //                 )}
    //               </div>
    //             </Popover.Body>
    //           </Popover>
    //         }
    //       >
    //         <V8CustomButton
    //           label={t("Add")}
    //           onClick={(e) => handleClick(e, rowData)}
    //           variant="primary"
    //           data-testid={params.id}
    //           disabled={!isGroupUpdated}
    //           icon={<i className="fa-solid fa-plus me-2"></i>}
    //         />
    //       </OverlayTrigger>
    //     );
    //   },
    // },
  ];

  return (
    <>
      <div className="" role="definition">
        <div>
          {!isLoading ? (
            <div
              className="table-container-admin mb-3"
              data-testid="admin-dashboard-table"
            >
              <div className="col-lg-4 col-xl-4 col-md-4 col-sm-6 col-12">
                <CustomSearch
                  search={searchKey}
                  setSearch={setSearchKey}
                  handleSearch={handleSearch}
                  handleClearSearch={handleClearSearch}
                  searchLoading={loading}
                  placeholder={t("Search by dashboard")}
                  title={t("Search...")}
                  dataTestId="search-dashboards-input"
                />
              </div>
              <hr/>
              <ReusableTable
                columns={columns}
                rows={dashboardList}
                loading={isLoading}
                getRowId={(row) => row.resourceId}
                sortModel={DEFAULT_SORT_MODEL}
                paginationMode="client"
                sortingMode="client"
                disableColumnMenu
                disableRowSelectionOnClick
                emptyStateMessage={props.error || t("No data Found")}
                paginationModel={{ page: activePage - 1, pageSize: limit }}
                onPaginationModelChange={({ page, pageSize }) => {
                  if (pageSize !== limit) {
                    handleLimitChange(pageSize);
                  } else {
                    setActivePage(page + 1);
                  }
                }}
                pageSizeOptions={[5, 25, 50, 100]}
                disableVirtualization
                dataGridProps={{ getRowHeight: () => "auto" }}
              />
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
