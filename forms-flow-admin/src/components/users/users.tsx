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
import { MULTITENANCY_ENABLED } from "../../constants";
import "./users.scss";

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
        toast.success("Permission updated successfully!");
      },
      (err) => {
        setError(err);
        toast.error(err.message || "Failed to update permission!");
      }
    );
  };
  const handleSizeChange = (sizePerPage, page) => {
    setActivePage(page);
    setSizePerPage(sizePerPage);
  };
  const customTotal = (from, to, size) => (
    <span className="react-bootstrap-table-pagination-total" role="main">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("Results")}</Translation>
    </span>
  );
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

  const handleTableChange = () => { };

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
            <div style={{ color: "grey" }}>{rowData?.username}</div>
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
          <div className="role-container">
            {cell?.map((item, i) => (
              <div key={i} className="chip-element mr-2">
                <OverlayTrigger
                  placement="bottom"
                  overlay={!MULTITENANCY_ENABLED ? (<Tooltip id="tooltip">{item?.path}</Tooltip>) : (<span></span>)}
                >
                  <span className="chip-label">
                    {item?.name}{" "}
                    <i
                      className="fa fa-close chip-close"
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
                `role ${shouldHighLight ? "role-highlighted" : ""} ${isSelected ? "role-selected" : ""
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
              toast.success("Permision updated successfully!");
            })
            .catch((err) => {
              toast.error(err.message || "Failed to update permision!");
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
                      <>No data found</>
                    )}
                  </div>
                  <hr />
                  <div className="done-button">
                    {roles.length > 0 && (
                      <Button onClick={addUserPermission}>Done</Button>
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            }
          >
            <Button variant="primary" onClick={() => addRole(rowData)}>
              <i className="fa fa-l fa-plus-circle mr-1" /> Add Role
            </Button>
          </OverlayTrigger>
        );
      },
    },
  ];

  return (
    <>
      <div className="container-admin">
        <div className="sub-container">
          <div className="search-role">
            <Form.Control
              type="text"
              placeholder="Search by name, username or email"
              className="search-role-input"
              onChange={handleSearch}
              value={props.search || ""}
            />
            {props.search?.length > 0 && (
              <Button
                variant="outline-secondary clear"
                onClick={() => {
                  props.setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="user-filter-container">
            <span>Filter By: </span>
            <Form.Select size="lg" onChange={handleSelectFilter}>
              <option value="ALL" selected={!props.filter}>
                All roles
              </option>
              {roles?.map((role, i) => (
                <option key={i} value={role.name}>
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
            wrapperClasses="user-table-container"
            rowStyle={{
              color: "#09174A",
              fontWeight: 600,
            }}
            noDataIndication={noData}
            onTableChange={handleTableChange}
          />
        ) : (
          <Loading />
        )}
      </div>
    </>
  );
});

export default Users;
