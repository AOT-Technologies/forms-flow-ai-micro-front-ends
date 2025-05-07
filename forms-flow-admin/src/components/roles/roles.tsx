import React, { useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import "./roles.scss";
import { useParams } from "react-router-dom";
import { Translation, useTranslation } from "react-i18next";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { fetchUsers } from "../../services/users";
import {
  CreateRole,
  DeleteRole,
  UpdateRole,
  fetchPermissions,
} from "../../services/roles";
import Modal from "react-bootstrap/Modal";
import Loading from "../loading";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";


import {removingTenantId} from "../../utils/utils.js";
import { TableFooter, CustomSearch } from "@formsflow/components";
const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
  const { tenantId } = useParams();
  const [roles, setRoles] = React.useState([]);
  const [activePage, setActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [error, setError] = useState({});

  const [users, setUsers] = React.useState([]);
  // Toggle for user list popover
  const [show, setShow] = React.useState(false);
  // Toggle for create/edit role
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [loading, setLoading] = React.useState(false);
  const [payload, setPayload] = React.useState({
    name: "",
    description: "",
    permissions: [],
  });
  // Toggle for Delete Confirm modal
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const initialRoleType = {
    name: "",
    id: "",
    description: "",
    permissions: [],
  };
  const [deleteCandidate, setDeleteCandidate] = React.useState(initialRoleType);
  const [selectedRoleIdentifier, setSelectedRoleIdentifier] =
    React.useState("");
  const [editCandidate, setEditCandidate] = React.useState(initialRoleType);
  const [disabled, setDisabled] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [permission, setPermission] = React.useState([]);

  const filterList = (filterTerm, List) => {
    let roleList = removingTenantId(List, tenantId);
  
    // Escape backslashes and square brackets in filterTerm for safe regex use
    const escapedFilterTerm = filterTerm.replace(/([\\[])/g, '\\$1');
  
    let newRoleList = roleList.filter((role) => {
      return role.name.toLowerCase().search(escapedFilterTerm.toLowerCase()) !== -1;
    });
    return newRoleList;
  };

  React.useEffect(() => {
    setDisabled(
      !(
        payload.name?.trim() &&
        payload.permissions.length !== 0
      )
    );
  }, [payload]);

  React.useEffect(() => {
    setDisabled(
      !(
        editCandidate.name?.trim() &&
        editCandidate.permissions.length !== 0
      )
    );
  }, [editCandidate]);

  React.useEffect(() => {
    let updatedRoles = props.roles;

    if (search) {
      updatedRoles = filterList(search, updatedRoles);
    }

    if (updatedRoles.length > 0) {
      updatedRoles = removingTenantId(updatedRoles,tenantId);
    }

    setRoles(updatedRoles);
  }, [props.roles, search]);

  React.useEffect(() => {
    fetchPermissions(
      (data) => {
        setPermission(data);
      },
      (err) => {
        setError(err);
      }
    );
  }, []);

  const handlFilter = (e) => {
    if (e && e.key === 'Enter') {
      setSearch(e.target.value);
      setRoles(filterList(e.target.value, props.roles));

    }    
  };

  const deleteRole = (rowData) => {
    setDisabled(true);
    DeleteRole(
      rowData,
      () => {
        props.setInvalidated(true);
        handleCloseDeleteModal();
        toast.success(t("Role deleted successfully!"));
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(t("Failed to delete role!"));
      }
    );
  };

  const handleChangeName = (e) => {
    setPayload({ ...payload, name: e.target.value });
  };
  const handleChangeDescription = (e) => {
    setPayload({ ...payload, description: e.target.value });
  };
  const handlePermissionCheck = (
    permissionName: string,
    dependsOn: string[]
  ) => {
    let updatedPermissions: string[] = [...payload.permissions];
    const isChecked = updatedPermissions.includes(permissionName);

    if (!isChecked) {
      updatedPermissions.push(permissionName);
      dependsOn.forEach((dependency) => {
        if (!updatedPermissions.includes(dependency)) {
          updatedPermissions.push(dependency);
        }
      });
    } else {
      updatedPermissions = updatedPermissions.filter(
        (permission) => permission !== permissionName
      );
      dependsOn.forEach((dependency) => {
        updatedPermissions = updatedPermissions.filter(
          (permission) => permission !== dependency
        );
      });
    }
    setPayload({ ...payload, permissions: updatedPermissions });
  };

  const validateRolePayload = (payload) => {
    return !(
      payload.name === "" ||
      payload.permissions.length === 0
    );
  };
  //check regex exept _ -
  const hasSpecialCharacters = (text) => {
    const regex = /[^A-Za-z0-9_-]/;
    return regex.test(text);
  };
  //check regex exept _ - /
  const hasSpecialCharacterswithslash = (text) => {
    const regex = /[^A-Za-z0-9_\-\/]/;
    return regex.test(text);
  };
  const handleCreateRole = () => {
    if (!validateRolePayload(payload)) {
      return;
    }
    // if (KEYCLOAK_ENABLE_CLIENT_AUTH) {
    //   if (hasSpecialCharacters(payload.name)) {
    //     toast.error(
    //       t("Role names cannot contain special characters except   _ , -")
    //     );
    //     return;
    //   }
    // } else {
    if (hasSpecialCharacterswithslash(payload.name)) {
      toast.error(
        t("Role names cannot contain special characters except _ , - , / ")
      );
      return;
    }
    // }
    setDisabled(true);
    CreateRole(
      payload,
      (data) => {
        props.setInvalidated(true);
        handleCloseRoleModal();
        toast.success(t("Role created successfully!"));
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(t("Failed to create role!"));
      }
    );
  };
  const handleUpdateRole = () => {
    if (!validateRolePayload(editCandidate)) {
      return;
    }
    // if (KEYCLOAK_ENABLE_CLIENT_AUTH) {
    //   if (hasSpecialCharacters(editCandidate.name)) {
    //     toast.error(
    //       t("Role names cannot contain special characters except   _ , -")
    //     );
    //     return;
    //   }
    // } else {
    if (hasSpecialCharacterswithslash(editCandidate.name)) {
      toast.error(
        t("Role names cannot contain special characters except _ , - , / ")
      );
      return;
    }
    // }
    setDisabled(true);
    UpdateRole(
      selectedRoleIdentifier,
      editCandidate,
      (data) => {
        props.setInvalidated(true);
        handleCloseEditRoleModal();
        toast.success(t("Role updated successfully!"));
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(t("Failed to update role!"));
      }
    );
  };
  // handlers for user list popover
  const handleClick = (event, rowData) => {
    setShow(!show);
    setLoading(true);
    fetchUsers(
      rowData.name,
      null,
      null,
      null,
      (results) => {
        setUsers(results.data);
        setLoading(false);
      },
      (err) => {
        setUsers([]);
        setError(err);
        setLoading(false);
      },
      false,
      false
    );
  };

  const handleEditName = (e) => {
    setEditCandidate({ ...editCandidate, name: e.target.value });
  };
  const handleEditDescription = (e) => {
    setEditCandidate({ ...editCandidate, description: e.target.value });
  };

  const handleEditPermissionCheck = (
    permissionName: string,
    dependsOn: string[]
  ) => {
    let updatedPermissions: string[] = [...editCandidate.permissions];
    const isChecked = updatedPermissions.includes(permissionName);

    if (!isChecked) {
      updatedPermissions.push(permissionName);
      dependsOn.forEach((dependency) => {
        if (!updatedPermissions.includes(dependency)) {
          updatedPermissions.push(dependency);
        }
      });
    } else {
      updatedPermissions = updatedPermissions.filter(
        (permission) => permission !== permissionName
      );
      dependsOn.forEach((dependency) => {
        updatedPermissions = updatedPermissions.filter(
          (permission) => permission !== dependency
        );
      });
    }
    setEditCandidate({ ...editCandidate, permissions: updatedPermissions });
  };

  // handlers for role create/edit modal
  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setPayload({ name: "", description: "", permissions: [] });
  };
  const handleShowRoleModal = () => setShowRoleModal(true);
  const handleCloseEditRoleModal = () => {
    setShowEditRoleModal(false);
    setEditCandidate(initialRoleType);
    setSelectedRoleIdentifier("");
  };
  const handleShowEditRoleModal = () => setShowEditRoleModal(true);
  const handleCloseDeleteModal = () => {
    setShowConfirmDelete(false);
    setDeleteCandidate(initialRoleType);
    setDisabled(true);
  };
  const handleShowDeleteModal = () => {
    setShowConfirmDelete(true);
    setDisabled(false);
  };

  const handleClearSearch = () => {
    setSearch("");
    let updatedRoleName = removingTenantId(props.roles,tenantId);
    setRoles(updatedRoleName);
  };

  // Delete confirmation
  const confirmDelete = () => (
    <div data-testid="roles-confirm-delete-modal">
      <Modal show={showConfirmDelete} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title><p>{t("Confirm Delete")}</p></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {`${t("Are you sure deleting the role")} ${deleteCandidate.name}`}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-link text-dark"
            onClick={handleCloseDeleteModal}
            data-testid="roles-cancel-delete-button"
          >
            {t("Cancel")}
          </button>
          <Button
            variant="danger"
            disabled={disabled}
            onClick={() => deleteRole(deleteCandidate)}
            data-testid="roles-confirm-delete-button"
          >
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  const showCreateModal = () => (
    <div data-testid="create-role-modal">
      <Modal show={showRoleModal} onHide={handleCloseRoleModal} centered={true}>
        <Modal.Header closeButton>
          <Modal.Title><p>{t("Create Role")}</p></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="role-name" aria-required>
              {t("Role Name")}
            </Form.Label>
            <i className="text-danger">*</i>
            <Form.Control
              id="role-name"
              type="text"
              placeholder={t("Eg: Account Manager")}
              required
              onChange={handleChangeName}
              title={t("Enter role name")}
            />
            <Form.Label htmlFor="role-description" className="mt-2">
              {t("Description")}
            </Form.Label>
            <Form.Control
              id="role-description"
              as="textarea"
              placeholder="Eg: Lorem ipsum..."
              rows={3}
              onChange={handleChangeDescription}
              title={t("Enter Description")}
            />

            <Form.Label
              htmlFor="role-permissions"
              aria-required
              className="mt-2"
              title={t("Select Permissions")}
              data-testid="permissions-label"
            >
              {t("Permissions")}
            </Form.Label>
            <i className="text-danger">*</i>
            <div className="row">
              {permission.map((permission) => (
                <div
                  key={permission.name}
                  className="col-md-6 mb-2"
                  data-testid={`permission-${permission.name}`}
                >
                  <Form.Check
                    type="checkbox"
                    id={`role-permissions-${permission.name}`}
                    label={t(permission.description)}
                    checked={payload.permissions.includes(permission.name)}
                    onChange={() =>
                      handlePermissionCheck(
                        permission.name,
                        permission.depends_on
                      )
                    }
                    aria-label={t(permission.description)}
                  />
                </div>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-link text-dark"
            onClick={handleCloseRoleModal}
            data-testid="create-new-role-modal-cancel-button"
          >
            {t("Cancel")}
          </button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleCreateRole}
            type="submit"
            data-testid="create-new-role-modal-submit-button"
          >
            {t("Create")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  const showEditModal = () => (
    <div data-testid="edit-role-modal">
      <Modal show={showEditRoleModal} onHide={handleCloseEditRoleModal} centered={true}>
        <Modal.Header closeButton>
          <Modal.Title><p>{t("Edit Role")}</p></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="edit-role-name" aria-required>
              {t("Role Name")}
            </Form.Label>
            <i style={{ color: "#e00" }}>*</i>
            <Form.Control
              id="edit-role-name"
              type="text"
              placeholder={"Eg: Account Manager"}
              required
              onChange={handleEditName}
              value={editCandidate.name}
            />
            <Form.Label htmlFor="edit-description" className="mt-2">
              {t("Description")}
            </Form.Label>
            <Form.Control
              id="edit-description"
              as="textarea"
              rows={3}
              onChange={handleEditDescription}
              value={editCandidate.description}
            />
            <Form.Label
              htmlFor="role-edit-permissions"
              aria-required
              className="mt-2"
              title={t("Edit Permissions")}
              data-testid="edit-permissions-label"
            >
              {t("Permissions")}
            </Form.Label>
            <i className="text-danger">*</i>
            <div className="row">
              {permission.map((permission) => (
                <div
                  key={permission.name}
                  className="col-md-6 mb-2"
                  data-testid={`edit-permission-${permission.name}`}
                >
                  <Form.Check
                    type="checkbox"
                    id={`role-edit-permissions-${permission.name}`}
                    label={t(permission.description)}
                    checked={editCandidate.permissions.includes(
                      permission.name
                    )}
                    onChange={() =>
                      handleEditPermissionCheck(
                        permission.name,
                        permission.depends_on
                      )
                    }
                    aria-label={t(permission.description)}
                  />
                </div>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-link text-dark"
            onClick={handleCloseEditRoleModal}
            data-testid="edit-role-modal-cancel-button"
          >
            {t("Cancel")}
          </button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleUpdateRole}
            type="submit"
            data-testid="edit-role-modal-save-button"
          >
            {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  const noData = () => (
    <div data-testid="roles-no-data-msg">
      <h3 className="text-center">
        <Translation>{(t) => t(props.error || "No data Found")}</Translation>
      </h3>
    </div>
  );

  const customTotal = (from, to, size) => (
    <span className="ms-2" role="main">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("results")}</Translation>
    </span>
  );
  const getPageList = () => [
    { text: '5', value: 5 },
    { text: '25', value: 25 },
    { text: '50', value: 50 },
    { text: '100', value: 100 },
    { text: 'All', value: roles.length },
  ];
  const paginatedRoles = roles.slice(
    (activePage - 1) * sizePerPage, 
    activePage * sizePerPage 
  );

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };


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

  const handleLimitChange = (newLimit: number) => {
    setSizePerPage(newLimit);
    setActivePage(1); 
  };

  const columns = [
    {
      dataField: "name",
      text: <Translation>{(t) => t("Role Name")}</Translation>,
    },
    {
      dataField: "description",
      text: <Translation>{(t) => t("Description")}</Translation>,
    },
    {
      dataField: "",
      text: <Translation>{(t) => t("Users")}</Translation>,
      formatExtraData: { show, users, loading },
      formatter: (cell, rowData, rowIdx, formatExtraData) => {
        const { show, users, loading } = formatExtraData;
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
                    {!loading ? (
                      users.length > 0 ? (
                        users?.map((item, key) => (
                          <div className="role-user">{item.username}</div>
                        ))
                      ) : (
                        <div>{`${t("No results found")}`}</div>
                      )
                    ) : (
                      <>{`${t("Loading...")}`}</>
                    )}
                  </div>
                </Popover.Body>
              </Popover>
            }
          >
            <div
              className="user-list"
              onClick={(e) => handleClick(e, rowData)}
              data-testid="user-list-view-dropdown"
            >
              <p>
                <Translation>{(t) => t("View")}</Translation>
              </p>
              <i className="fa fa-caret-down ms-2" />
            </div>
          </OverlayTrigger>
        );
      },
    },
    {
      dataField: "id",
      text: <Translation>{(t) => t("Actions")}</Translation>,
      formatter: (cell, rowData, rowIdx, formatExtraData) => {
        return (
          <div>
            <i
              className="fa fa-pencil  me-4"
              style={{ color: "#7E7E7F", cursor: "pointer" }}
              onClick={() => {
                setSelectedRoleIdentifier(rowData.id);
                setEditCandidate(rowData);
                handleShowEditRoleModal();
                // setSelectedRoleIdentifier(
                //   KEYCLOAK_ENABLE_CLIENT_AUTH ? rowData.name : rowData.id
                // );
              }}
              data-testid="admin-roles-edit-icon"
            />
            <i
              className="fa fa-trash delete_button"
              style={{ color: "#D04444" }}
              onClick={() => {
                setDeleteCandidate(rowData);
                handleShowDeleteModal();
              }}
              data-testid="admin-roles-delete-icon"
            />
          </div>
        );
      },
    },
  ];
  return (
    <>
      <div className="container-admin">
        <div className="d-flex align-items-center justify-content-between">
          <div className="search-role col-xl-4 col-lg-4 col-md-6 col-sm-5 px-0">
             <CustomSearch
              handleClearSearch={handleClearSearch}
              search={search}
              setSearch={setSearch}
              handleSearch={handlFilter}
              placeholder="Search by role name"
              title="Search"
              dataTestId="search-role-input"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleShowRoleModal}
            data-testid="roles-create-new-role-button"
          >
            <i className="fa-solid fa-plus me-2"></i>{" "}
            <Translation>{(t) => t("Create New Role")}</Translation>
          </Button>
        </div>
        {!props?.loading ? (
          <div>
          <BootstrapTable
            keyField="id"
            data={paginatedRoles}
            columns={columns}
            bordered={false}
            wrapperClasses="table-container px-4"
            rowStyle={{
              color: "#09174A",
              fontWeight: 400,
            }}
            noDataIndication={noData}
            data-testid="admin-roles-table"
          />
    
          <table className="table mt-3">
            <tfoot>
            <TableFooter
            limit={sizePerPage}
            activePage={activePage}
            totalCount={roles.length}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageOptions={getPageList()}
          />
            </tfoot>
          </table>
        </div>
        ) : (
          <Loading />
        )}
        {showCreateModal()}
        {confirmDelete()}
        {showEditModal()}
      </div>
    </>
  );
});

export default Roles;