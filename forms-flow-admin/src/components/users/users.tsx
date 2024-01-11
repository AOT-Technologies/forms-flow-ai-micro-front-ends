import React from "react";
import BootstrapTable from "react-bootstrap-table-next";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Translation, useTranslation } from "react-i18next";
import Loading from "../loading";
import { AddUserRole, RemoveUserRole } from "../../services/users";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import paginationFactory from "react-bootstrap-table2-paginator";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import { toast } from "react-toastify";
import { Tooltip } from "react-bootstrap";
import "./users.scss";
import { KEYCLOAK_ENABLE_CLIENT_AUTH } from "../../constants";

const Users = React.memo((props: any) => {
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [roleNameMapper, setROleNameMapper] = React.useState({});
  const [roles, setRoles] = React.useState([]);
  const [error, setError] = React.useState();
  const [loading, setLoading] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [selectedFilter, setSelectedFilter] = React.useState();
  const { t } = useTranslation();

  React.useEffect(() => {
    props?.setFilter(selectedFilter);
  }, [selectedFilter]);

  React.useEffect(() => {
    if (props?.page?.pageNo) {
      setActivePage(props?.page?.pageNo);
    }
  }, [props?.page?.pageNo]);

  React.useEffect(() => {
    setLoading(props?.loading);
  }, [props?.loading]);

  React.useEffect(() => {
    setRoles(props.roles);
  }, [props.roles]);

  React.useEffect(() => {
    let mapper = {};
    for (let role of roles) {
      mapper[role.id] = role.name.split("/").at(-1);
    }
    setROleNameMapper(mapper);
  }, [roles]);

  const addRole = (row) => {
    setSelectedRow(row);
    setSelectedRoles([]);
  };

  const handleSearch = (e) => {
    if (selectedFilter) {
      setSelectedFilter(undefined);
    }
    props.setSearch(e.target.value);
  };

  const removePermission = (rowData, item) => {
    const user_id = rowData.id;
    const group_id = item.id;
    const payload = {
      userId: user_id,
      groupId: group_id,
      name: item.name,
    };
    RemoveUserRole(
      user_id,
      group_id,
      payload,
      () => {
        props.setInvalidated(true);
        toast.success(t("Permission updated successfully!"));
      },
      (err) => {
        setError(err);
        toast.error(t("Failed to update permission!"));
      }
    );
  };
  const handleSizeChange = (sizePerPage, page) => {
    setActivePage(page);
    setSizePerPage(sizePerPage);
  };
  const customTotal = (from, to, size) => (
    <span className="ms-2" role="main" data-testid="admin-users-custom-total">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("results")}</Translation>
    </span>
  );
  const customDropUp = ({ options, currSizePerPage, onSizePerPageChange }) => {
    return (
      <DropdownButton
        drop="up"
        variant="secondary"
        title={currSizePerPage}
        style={{ display: "inline" }}
        data-testid="admin-users-custom-drop-up"
      >
        {options.map((option) => (
          <Dropdown.Item
            key={option.text}
            type="button"
            onClick={() => onSizePerPageChange(option.page)}
            data-testid={`admin-users-drop-up-option-${option.text}`}
          >
            {option.text}
          </Dropdown.Item>
        ))}
      </DropdownButton>
    );
  };
  const getpageList = () => {
    const list = [
      {
        text: "5",
        value: 5,
      },
    ];
    return list;
  };

  const pagination = paginationFactory({
    showTotal: true,
    align: "left",
    sizePerPageList: getpageList(),
    page: activePage,
    pageStartIndex: 1,
    totalSize: props.total,
    sizePerPage: sizePerPage,
    paginationTotalRenderer: customTotal,
    onPageChange: (page) => {
      setActivePage(page);
      props.page.setPageNo(page);
      props.setInvalidated(true);
    },
    onSizePerPageChange: (size, page) => handleSizeChange(size, page),
    sizePerPageRenderer: customDropUp,
  });

  const handleTableChange = () => {};

  const handleSelectFilter = (e) => {
    if (e.target.value === "ALL") {
      return setSelectedFilter(null);
    }
    setSelectedFilter(e.target.value);
  };

  const noData = () => (
    <div>
      <h3 className="text-center">
        <Translation>{(t) => t(props.error || "No data Found")}</Translation>
      </h3>
    </div>
  );

  const columns = [
    {
      dataField: "username",
      text: <Translation>{(t) => t("Users")}</Translation>,
      headerStyle: () => {
        return { width: "10%" };
      },
      formatter: (cell, rowData) => {
        return (
          <div>
            {rowData?.firstName && (
              <div>
                {rowData.firstName} {rowData.lastName && rowData.lastName}
              </div>
            )}
            <div style={{ color: "#767676" }}>{rowData?.username}</div>
          </div>
        );
      },
    },
    {
      dataField: "email",
      text: <Translation>{(t) => t("Email")}</Translation>,
      headerStyle: () => {
        return { width: "20%" };
      },
    },
    {
      dataField: "role",
      text: <Translation>{(t) => t("Role")}</Translation>,
      formatter: (cell, rowData) => {
        return (
          <div className="d-flex flex-wrap col-12">
            {cell?.map((item, i) => (
              <div key={i} className="d-flex align-items-center justify-content-between rounded-pill px-3 py-2 my-1 small m-2" style={{background:"#EAEFFF"}}>
                <OverlayTrigger
                  placement="bottom"
                  overlay={ !KEYCLOAK_ENABLE_CLIENT_AUTH ? <Tooltip id="tooltip">{item?.path}</Tooltip> : <></>}
                >
                  <span className="">
                    {item?.name}
                    <i
                      className="fa-solid fa-xmark chip-close ms-2"
                      onClick={() => removePermission(rowData, item)}
                    ></i>
                  </span>
                </OverlayTrigger>
              </div>
            ))}
          </div>
        );
      },
    },

    {
      dataField: "id",
      text: <Translation>{(t) => t("Actions")}</Translation>,
      headerStyle: () => {
        return { width: "10%" };
      },
      formatExtraData: { roles, selectedRoles },
      formatter: (cell, rowData, rowIdx, formatExtraData) => {
        let { roles, selectedRoles } = formatExtraData;
        const updateSelectedRoles = (role) => {
          if (selectedRoles.includes(role.id)) {
            setSelectedRoles([
              ...selectedRoles.filter((item) => item !== role.id),
            ]);
            return;
          }
          setSelectedRoles([...selectedRoles, role.id]);
        };
        const getRoleRepresentation = (role, key, rowData) => {
          const userPermissions = rowData.role;
          let shouldHighLight = userPermissions.find(
            (element: any) => element.id === role.id
          );
          let isSelected = false;
          if (selectedRoles.includes(role.id)) {
            isSelected = true;
          }
          return (
            <div
              key={key}
              className={[
                `role ${shouldHighLight ? "role-highlighted" : ""} ${
                  isSelected ? "role-selected" : ""
                }`,
              ].toString()}
              onClick={() => !shouldHighLight && updateSelectedRoles(role)}
            >
              {role.name}
              {isSelected && <i className="fa fa-check"></i>}
            </div>
          );
        };

        const addUserPermission = () => {
          const promises = [];
          for (let role of selectedRoles) {
            let user_id = selectedRow.id;
            let payload = {
              userId: user_id,
              groupId: role,
              name: roleNameMapper[role],
            };
            const promise = AddUserRole(user_id, role, payload);
            promises.push(promise);
          }
          Promise.all(promises)
            .then((res) => {
              props.setInvalidated(true);
              toast.success(t("Permission updated successfully!"));
            })
            .catch((err) => {
              toast.error(t("Failed to update permission!"));
              console.log(err);
            });
        };

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
                    {roles.length > 0 ? (
                      roles.map((role, key) =>
                        getRoleRepresentation(role, key, rowData)
                      )
                    ) : (
                      <>{t("No data Found")}</>
                    )}
                  </div>
                  <hr />
                  <div className="done-button">
                    {roles.length > 0 && (
                      <Button onClick={addUserPermission}>
                        <Translation>{(t) => t("Done")}</Translation> 
                      </Button>
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            }
          >
            <Button variant="primary btn-small" onClick={() => addRole(rowData)}>
            <i className="fa-solid fa-plus me-2"></i> <Translation>{(t) => t("Add Role")}</Translation>
            </Button>
          </OverlayTrigger>
        );
      },
    },
  ];

  return (
    <>
      <div className="container-admin">
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <div className="search-role col-lg-4 col-xl-4 col-md-4 col-sm-6 col-12 px-0">
            <Form.Control
              type="text"
              placeholder={t("Search by name, username or email")}
              className="search-role-input"
              onChange={handleSearch}
              value={props.search || ""}
              title={t("Search...")}
              data-testid="search-users-input"
            />
            {props.search?.length > 0 && (
              <Button
                variant="outline-secondary btn-small clear"
                onClick={() => {
                  props.setSearch("");
                }}
                data-testid="clear-users-search-button"
              >
                {t("Clear")}
              </Button>
            )}
          </div>

          <div className="user-filter-container  col-lg-4 col-xl-4 col-md-4 col-sm-6 col-12 d-flex justify-content-end gap-2">
            <span className="my-2">{t("Filter By:")} </span>
            <Form.Select 
             className="bg-light text-dark"
             onChange={handleSelectFilter} 
             title={t("Filter here")} 
             data-testid="users-roles-filter-select">
              <option value="ALL" selected={!props.filter} data-testid="users-all-roles-option">
                {t("All roles")}
              </option>
              {roles?.map((role, i) => (
                <option key={i} value={role.name} data-testid={`users-role-option-${i}`}>
                  {role.name}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>
        {!loading ? (
          <BootstrapTable
            remote={{
              pagination: true,
            }}
            keyField="id"
            data={props?.users}
            loading={loading}
            columns={columns}
            pagination={pagination}
            bordered={false}
            wrapperClasses="user-table-container px-4"
            rowStyle={{
              color: "#09174A",
              fontWeight: 600,
            }}
            noDataIndication={noData}
            onTableChange={handleTableChange}
            data-testid="admin-users-table"
          />
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
});

export default Users;
