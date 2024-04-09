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
import Modal from "react-bootstrap/Modal"; // Import Modal from react-bootstrap
import "./users.scss";
import { KEYCLOAK_ENABLE_CLIENT_AUTH,MULTITENANCY_ENABLED } from "../../constants";
import Select from "react-select";
import { CreateUser } from "../../services/users";
const Users = React.memo((props: any) => {
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [roleNameMapper, setRoleNameMapper] = React.useState({});
  const [roles, setRoles] = React.useState([]);
  const [error, setError] = React.useState(null); // Initialize error state with null instead of undefined
  const [loading, setLoading] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [selectedFilter, setSelectedFilter] = React.useState(null); // Initialize selectedFilter with null
  const [searchKey, setSearchKey] = React.useState("");
  const [showInviteModal, setShowInviteModal] = React.useState(false); // Add state for managing invite modal
  const { t } = useTranslation();
  const [selectedRolesModal, setSelectedRolesModal] = React.useState([]);
  const [formData, setFormData] = React.useState({ user: ""});
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');

  const openSuccessModal = () => {
    setShowSuccessModal(true);
    closeInviteModal();
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    clearForm();
    props.setInvalidated(true);
  }; 
  
  React.useEffect(() => {
    props?.setFilter(selectedFilter);
    props?.setSearch(searchKey);
  }, [selectedFilter, searchKey]);

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
    setRoleNameMapper(mapper); // Corrected the function name from setROleNameMapper to setRoleNameMapper
  }, [roles]);

  const addRole = (row) => {
    setSelectedRow(row);
    setSelectedRoles([]);
  };
  const handleRoleSelectChange = (selectedOptions) => {
    setSelectedRolesModal(selectedOptions);
  };
  const handleSearch = (e) => {
    setSearchKey(e.target.value);
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
              <div
                key={i}
                className="d-flex align-items-center justify-content-between rounded-pill px-3 py-2 my-1 small m-2"
                style={{ background: "#EAEFFF" }}
              >
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    !KEYCLOAK_ENABLE_CLIENT_AUTH ? (
                      <Tooltip id="tooltip">{item?.path}</Tooltip>
                    ) : (
                      <></>
                    )
                  }
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
            (element) => element.id === role.id
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
              <Popover
                id={`popover-positioned-bottom`}
                data-testid="users-add-role-popover"
              >
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
                      <Button
                        onClick={addUserPermission}
                        data-testid="add-role-popover-done-button"
                      >
                        <Translation>{(t) => t("Done")}</Translation>
                      </Button>
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            }
          >
            <Button
              variant="primary btn-small"
              onClick={() => addRole(rowData)}
              data-testid="users-add-role-button"
            >
              <i className="fa-solid fa-plus me-2"></i>{" "}
              <Translation>{(t) => t("Add Role")}</Translation>
            </Button>
          </OverlayTrigger>
        );
      },
    },
  ];

  const clearForm = () => {
    setFormData({ user: "" });
    setSelectedRolesModal([]);
  };

  const openInviteModal = () => {      
    setValidationError(null);
    setShowInviteModal(true);
  }
  const closeInviteModal = () => {
    clearForm();
    setShowInviteModal(false);
  }
  const sendInvites = () => {
    const selectedRolesIds = selectedRolesModal.map(role => ({ roleId: role.value, name: role.label }));
    const payload = {
      roles: selectedRolesIds,
      user: formData.user,
    };
    CreateUser(
      payload,
      (data) => {
        openSuccessModal();
        
      },
      (err) => {
        setValidationError(t("User doesn't exist!"));
      }
    );
  };
  

  return (
    <>
      <Modal
        show={showSuccessModal}
        onHide={closeSuccessModal}
        centered
        className="overflow-hidden">
        <Modal.Header closeButton>
          <Modal.Title></Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-md d-flex align-items-center justify-content-center">
          <div className="p-3 text-center">
            <div className="d-flex flex-column align-items-center">
              <div className="mb-2">
                <i className="fa fa-check-circle fa-3x success"></i>

              </div>
              <div className="mb-2 fw-bold">
                {t("Success")}
              </div>
              <p>{t("User added")}</p>
            </div>
          </div>
        </Modal.Body>
      </Modal>


      <div className="container-admin">
        <div className="d-flex align-items-center justify-content-between flex-wrap">
          <div className="search-role col-lg-4 col-xl-4 col-md-4 col-sm-6 col-12 px-0">
            <Form.Control
              type="text"
              placeholder={t("Search by name, username or email")}
              className="search-role-input"
              onChange={handleSearch}
              value={searchKey}
              title={t("Search...")}
              data-testid="search-users-input"
            />
            {searchKey && (
              <Button
                variant="outline-secondary btn-small clear"
                onClick={() => {
                  setSearchKey("");
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
              data-testid="users-roles-filter-select"
            >
              <option
                value="ALL"
                selected={!props.filter}
                data-testid="users-roles-filter-option-all"
              >
                {t("All roles")}
              </option>
              {roles?.map((role, i) => (
                <option
                  key={i}
                  value={role.name}
                  data-testid={`users-roles-filter-option-${i}`}
                >
                  {role.name}
                </option>
              ))}
            </Form.Select>
          </div>

          {MULTITENANCY_ENABLED && (
  <>
    <Button variant="primary" onClick={openInviteModal}>
    {t("Add Registered Users")}
    </Button>

    {showInviteModal && (
      <Modal show={showInviteModal} onHide={closeInviteModal}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Add registered user to the application")}</Modal.Title>
        </Modal.Header>

                  <Modal.Body>
                    <Form>
                      <Form.Group>
                        <Form.Label>{t("Username or Email")}</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.user}
                          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                        />
                        {validationError && (
                          <p className="text-danger mt-2 ms-1 small">
                            <i className="fa fa-times-circle-o text-danger"></i> {validationError}
                          </p>
                        )}

                      </Form.Group>

                      <hr />
                      <Form.Group>
                        <Form.Label>{t("Add Role")}</Form.Label>
                        <br />
                        <Select
                          options={roles.map((role) => ({
                            value: role.id,
                            label: role.name,
                          }))}
                          isMulti
                          value={selectedRolesModal}
                          onChange={handleRoleSelectChange}
                        />
                      </Form.Group>
                    </Form>
                  </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeInviteModal}>
          {t("Cancel")}
          </Button>
          <Button variant="primary" onClick={sendInvites} disabled={!formData.user || selectedRolesModal.length === 0}>
          {t("Add User")}
          </Button>
        </Modal.Footer>
      </Modal>
    )}
  </>
)}

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
