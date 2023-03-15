import React from "react";
import { Button } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import "react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css";
import paginationFactory from "react-bootstrap-table2-paginator";
import { toast } from "react-toastify";
import Loading from "../loading";
import {
  updateAuthorization,
  fetchAuthorizations,
} from "../../services/dashboard";
import { Translation, useTranslation } from "react-i18next";

const customDropUp = ({ options, currSizePerPage, onSizePerPageChange }) => {
  return (
    <DropdownButton
      drop="up"
      variant="secondary"
      title={currSizePerPage}
      style={{ display: "inline" }}
    >
      {options.map((option) => (
        <Dropdown.Item
          key={option.text}
          type="button"
          onClick={() => onSizePerPageChange(option.page)}
        >
          {option.text}
        </Dropdown.Item>
      ))}
    </DropdownButton>
  );
};

export const InsightDashboard = React.memo((props: any) => {
  const { dashboards, groups, authorizations, setCount } = props;

  const isGroupUpdated = groups.length > 0;
  const [authDashBoardList, setAuthDashboardList] = React.useState([]);  
  const [isAuthUpdated, setIsAuthUpdated] = React.useState(false);

  const { t } = useTranslation();

  const [remainingGroups, setRemainingGroups] = React.useState([]);

  const [activeRow, setActiveRow] = React.useState(null);
  const [show, setShow] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [err, setErr] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);

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
    let authIds = newList.map((item) => Number(item.resourceId));
    for (let item of dashboards?.results) {
      if (!authIds.includes(item.id)) {
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
      authorizations.length > 0 &&
      !isAuthUpdated
    ) {
      let authList = updateAuthList(authorizations);
      setAuthDashboardList(authList);
      setCount(authList.length)
      setIsAuthUpdated(true);
      setIsLoading(false);
    }
  }, [dashboards, authorizations, isAuthUpdated]);

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
          toast.success("Update success!")
        }, (err)=>{
          setErr(err);
          toast.error("Update failed!")
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
          toast.success("Update success!")
        }, (err)=>{
          setErr(err);
          toast.error("Update failed!")
        });
      },
      setErr
    );
  };

  const noData = () => (
    <div>
      <h3 className="text-center">
        <Translation>{(t) => t("No data Found")}</Translation>
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
      text: <Translation>{(t) => t("Access Groups")}</Translation>,
      formatter: (cell, rowData) => {
        return (
          <div className="d-flex flex-wrap">
            {cell?.map((label, i) => (
              <div key={i} className="chip-element mr-2">
                <span className="chip-label">
                  {label}{" "}
                  <i
                    className="fa fa-close chip-close"
                    onClick={() => removeDashboardAuth(rowData, label)}
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
                        >
                          {item.path}
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
              className="btn btn-primary btn-md form-btn pull-left btn-left"
              disabled={!isGroupUpdated}
            >
              <Translation>{(t) => t("Add")}</Translation> <b>+</b>
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
        text: "All",
        value: authDashBoardList.length
      },
    ];
    return list;
  };

  const customTotal = (from, to, size) => (
    <span className="react-bootstrap-table-pagination-total" role="main">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("Results")}</Translation>
    </span>
  );

  const pagination = paginationFactory({
    showTotal: true,
    align: "center",
    sizePerPageList: getpageList(),
    page: activePage,
    paginationTotalRenderer: customTotal,
    onPageChange: (page) => setActivePage(page),
    sizePerPageRenderer: customDropUp,
  });

  return (
    <>
      <div className="container-admin" role="definition">
        <br />
        <div>
          {!isLoading ? (
            <BootstrapTable
              keyField="resourceId"
              data={authDashBoardList}
              columns={columns}
              pagination={pagination}
              bordered={false}
              wrapperClasses="table-container-admin"
              rowStyle={{
                color: "#09174A",
                fontWeight: 600,
              }}
              noDataIndication={noData}
            />
          ) : (
            <Loading />
          )}
        </div>
      </div>
    </>
  );
});

export default InsightDashboard;
