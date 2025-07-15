import React, { useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import "./roles.scss";
import { useParams } from "react-router-dom";
import { Translation, useTranslation } from "react-i18next";
import Form from "react-bootstrap/Form";
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
import PermissionTree from "./permissionTree";
import {removingTenantId} from "../../utils/utils.js";
import { TableFooter,
   CustomSearch, 
   CloseIcon, 
   CustomTabs, 
   FormInput, 
   FormTextArea,
   CustomButton,
   DeleteIcon,
   CustomInfo, 
   ConfirmModal } 
from "@formsflow/components";
const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
  const { tenantId } = useParams();
  const [roles, setRoles] = React.useState([]);
  const [activePage, setActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [error, setError] = useState({});
  const [handleConfirmation, setHandleConfirmation] = React.useState(false);
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
  const [permissionData, setPermissionData] = React.useState([]);
  const  [key,setKey] = useState("Details");

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
        setPermissionData(data);
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
  const handleShowRoleModal = () => {
    setKey("Details");
    setShowRoleModal(true);
  }
  const handleCloseEditRoleModal = () => {
    setShowEditRoleModal(false);
    setEditCandidate(initialRoleType);
    setSelectedRoleIdentifier("");
  };
  const handleShowEditRoleModal = () => {
    setKey("Details");
    setShowEditRoleModal(true);
  }
  const handleCloseDeleteModal = () => {
    setShowConfirmDelete(false);
    setDeleteCandidate(initialRoleType);
    setDisabled(true);
  };

  const handleClearSearch = () => {
    setSearch("");
    let updatedRoleName = removingTenantId(props.roles,tenantId);
    setRoles(updatedRoleName);
  };

  const closeConfirmation = () => {
     setHandleConfirmation(false);
  }

  const tabs = [
    {
      eventKey: "Details",
      title: "Details",
      content: (
        <div className="role-details">
        <FormInput
        required
        value={showEditRoleModal ? editCandidate.name : payload.name}
        label={t("Name")}
        onChange={showEditRoleModal ? handleEditName : handleChangeName}
        dataTestId="role-name"
        name="role-name"
        ariaLabel={t("Role Name")}
        maxLength={200} 
        />
        <FormTextArea
        dataTestId="role-description"
        label={t("Description")}
        name="description"
        value={showEditRoleModal ? editCandidate.description : payload.description}
        onChange={showEditRoleModal ? handleEditDescription : handleChangeDescription}
        aria-label={t("Description of role")}
        data-testid="role-description"
        maxRows={3}
        minRows={3}
      />
      {showEditRoleModal && (
        <div className="buttons-row">
          <CustomButton
            label={t("Delete This Role")}
            onClick={() => {
              handleCloseEditRoleModal();
              setHandleConfirmation(true);
            }}
            dataTestId="role-delete-button"
            icon={<DeleteIcon />}
            ariaLabel="Role delete button"
            iconWithText
          />
        </div>
      )}
      </div>
      )
    },
    {
      eventKey: "Permissions",
      title: "Permissions",
      content: (
        <PermissionTree
        permissions={permissionData}
        payload={showEditRoleModal ? editCandidate : payload}
        handlePermissionCheck={showEditRoleModal ? handleEditPermissionCheck : handlePermissionCheck}
        setPayload={showEditRoleModal ? setEditCandidate : setPayload}
      />

      )
    }]

    
  const showCreateModal = () => (
    <div data-testid="create-role-modal">
      <Modal show={showRoleModal} onHide={handleCloseRoleModal} size="sm">
        <Modal.Header>
          <Modal.Title><p>{t("Create Role")}</p></Modal.Title>
          <div className="icon-close" onClick={handleCloseRoleModal} data-testid="role-modal-close">
            <CloseIcon dataTestId="action-modal-close"/>
          </div>
        </Modal.Header>
        <Modal.Body className="with-tabs">
          <div className="tabs">
            <CustomTabs
              defaultActiveKey={key}
              onSelect={setKey}
              tabs={tabs}
              dataTestId="create-roles-tabs"
              ariaLabel="Create roles tabs"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="buttons-row">
          <CustomButton
            label={t("Save Changes")}
            disabled={disabled}
            onClick={handleCreateRole}
            dataTestId="create-new-role-button"
            ariaLabel="Create new role button"
            />
          <CustomButton
            label={t("Discard Changes")}
            onClick={handleCloseRoleModal}
            dataTestId="create-new-role-cancel-button"
            ariaLabel="Create new role cancel button"
            secondary
          />
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
  const showEditModal = () => (
    <div data-testid="edit-role-modal">
      <Modal show={showEditRoleModal} onHide={handleCloseEditRoleModal} size="sm">
        <Modal.Header>
          <Modal.Title><p>{editCandidate.name}</p></Modal.Title>
          <div className="icon-close" onClick={handleCloseEditRoleModal} data-testid="role-modal-close">
            <CloseIcon/>
          </div>
        </Modal.Header>
        <Modal.Body className="with-tabs">
          <div className="tabs">
            <CustomTabs
              defaultActiveKey={key}
              onSelect={setKey}
              tabs={tabs}
              dataTestId="edit-roles-tabs"
              ariaLabel="Edit roles tabs"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="buttons-row">
          <CustomButton
            label={t("Save Changes")}
            disabled={disabled}
            onClick={handleUpdateRole}
            dataTestId="edit-role-button"
            ariaLabel="Edit role button"
            />
          <CustomButton
            label={t("Discard Changes")}
            onClick={handleCloseEditRoleModal}
            dataTestId="edit-role-cancel-button"
            ariaLabel="Edit role cancel button"
            secondary
          />
          </div>
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
          <div className="ms-3">
            <i
              className="fa fa-pencil"
              style={{ color: "#7E7E7F", cursor: "pointer" }}
              onClick={() => {
                setSelectedRoleIdentifier(rowData.id);
                setEditCandidate(rowData);
                handleShowEditRoleModal();
                setDeleteCandidate(rowData);
                // setSelectedRoleIdentifier(
                //   KEYCLOAK_ENABLE_CLIENT_AUTH ? rowData.name : rowData.id
                // );
              }}
              data-testid="admin-roles-edit-icon"
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
          <CustomButton
            onClick={handleShowRoleModal}
            data-testid="roles-create-new-role-button"
            label="New Role"
            ariaLabel="New Role"
            action
          />
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
    
          <table className="table mt-3 old-design">
            <TableFooter
            limit={sizePerPage}
            activePage={activePage}
            totalCount={roles.length}
            handlePageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageOptions={getPageList()}
          />
          </table>
        </div>
        ) : (
          <Loading />
        )}
        {showCreateModal()}
        {showEditModal()}
      </div>
      {handleConfirmation && (
        <ConfirmModal
          show={handleConfirmation}
          title={t("Delete This Role?")}
          message={
            <CustomInfo
              className="note"
              heading="Note"
              content={t(
                "All users that have this role assigned to them might loose access to certain feature of formsflow. This action cannot be undone."
              )}
              dataTestId="delete-role-note"
            />
          }
          primaryBtnAction={closeConfirmation}
          onClose={closeConfirmation}
          primaryBtnText={t("No, Keep This Role")}
          secondaryBtnText={t("Yes, Delete This Role")}
          secondaryBtnAction={() => 
            {
             deleteRole(deleteCandidate);
             closeConfirmation();
            }}
          secondoryBtndataTestid="confirm-delete-role-button"
        />
      )}
    </>
  );
});

export default Roles;