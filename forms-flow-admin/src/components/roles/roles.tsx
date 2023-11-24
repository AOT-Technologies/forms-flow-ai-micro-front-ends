import React, { useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import "./roles.scss";
import { useParams } from "react-router-dom";
import { Translation, useTranslation } from "react-i18next";
import paginationFactory from "react-bootstrap-table2-paginator";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { fetchUsers } from "../../services/users";
import { CreateRole, DeleteRole, UpdateRole } from "../../services/roles";
import Modal from "react-bootstrap/Modal";
import Loading from "../loading";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";
import { KEYCLOAK_ENABLE_CLIENT_AUTH, MULTITENANCY_ENABLED } from "../../constants";
import { DEFAULT_ROLES } from "../../constants";

const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
  const  {tenantId}  = useParams();
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
  const [payload, setPayload] = React.useState({ name: "", description: "" });
  // Toggle for Delete Confirm modal
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const initialRoleType = {
    name: "",
    id: "",
    description: "",
  };
  const [deleteCandidate, setDeleteCandidate] = React.useState(initialRoleType);
  const [selectedRoleIdentifier, setSelectedRoleIdentifier] = React.useState("");
  const [editCandidate, setEditCandidate] = React.useState(initialRoleType);
  const [disabled, setDisabled] = React.useState(true);
  const [search, setSerach] = React.useState("");

  const filterList = (filterTerm, List) => {
    let roleList = List.filter((role) => {
      return role.name.toLowerCase().search(filterTerm.toLowerCase()) !== -1;
    });
    return roleList;
  };

  React.useEffect(() => {
    setDisabled(!(payload.name?.trim() && payload.description?.trim()));
  }, [payload]);

  React.useEffect(() => {
    setDisabled(
      !(editCandidate.name?.trim() && editCandidate.description?.trim())
    );
  }, [editCandidate]);

  React.useEffect(() => {
    if (search) {
      return setRoles(filterList(search, props.roles));
    }
    setRoles(props.roles);
  }, [props.roles]);

  const handlFilter = (e) => {
    setSerach(e.target.value);
    setRoles(filterList(e.target.value, props.roles));
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

  const validateRolePayload = (payload) => {
    return !(payload.name === "" || payload.description === "");
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
    if (KEYCLOAK_ENABLE_CLIENT_AUTH) {
      if (hasSpecialCharacters(payload.name)) {
        toast.error(t("Role names cannot contain special characters except   _ , -"));
        return;
      }
    } else {
      if (hasSpecialCharacterswithslash(payload.name)) {
        toast.error(t("Role names cannot contain special characters except _ , - , / "));
        return;
      }
    }
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
    if (KEYCLOAK_ENABLE_CLIENT_AUTH) {
      if (hasSpecialCharacters(editCandidate.name)) {
        toast.error(t("Role names cannot contain special characters except   _ , -"));
        return;
      }
    } else {
      if (hasSpecialCharacterswithslash(editCandidate.name)) {
        toast.error(t("Role names cannot contain special characters except _ , - , / "));
        return;
      }
    }
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

  // handlers for role create/edit modal
  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setPayload({ name: "", description: "" });
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

  const checkDefaultRoleOrNot  = (role:any) =>{
    if(MULTITENANCY_ENABLED && tenantId){
      const roles = [
        `${tenantId}-designer`,
        `${tenantId}-client`,
        `${tenantId}-reviewer`,
        `${tenantId}-admin`,
      ];
      return roles.includes(role)
    }else{
      return DEFAULT_ROLES.includes(role);
    }
  }
  // Delete confirmation

  const confirmDelete = () => (
    <div>
  <Modal show={showConfirmDelete} onHide={handleCloseDeleteModal}>
    <Modal.Header closeButton>
      <Modal.Title>{t("Confirm Delete")}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {`${t("Are you sure deleting the role")} ${deleteCandidate.name}`}
    </Modal.Body>
    <Modal.Footer>
      <button type="button"
            className="btn btn-link text-dark" onClick={handleCloseDeleteModal}>
        {t("Cancel")}
      </button>
      <Button
        variant="danger"
        disabled={disabled}
        onClick={() => deleteRole(deleteCandidate)}
      >
        {t("Delete")}
      </Button>
    </Modal.Footer>
  </Modal>
</div>
  );

  const showCreateModal = () => (
    <div>
      <Modal show={showRoleModal} onHide={handleCloseRoleModal}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Create Role")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label aria-required>{t("Role Name")}</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                type="text"
                placeholder={t("Eg: Account Manager")}
                required
                onChange={handleChangeName}
                title={t("Enter role name")}
              />
              <Form.Label className="mt-2">{t("Description")}</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                as="textarea"
                placeholder="Eg: Lorem ipsum..."
                rows={3}
                onChange={handleChangeDescription}
                title={t("Enter Description")}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button type="button"
            className="btn btn-link text-dark" onClick={handleCloseRoleModal}>
            {t("Cancel")}
          </button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleCreateRole}
          >
            {t("Create")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  const showEditModal = () => (
    <div>
      <Modal show={showEditRoleModal} onHide={handleCloseEditRoleModal}>
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Role")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label aria-required>{t("Role Name")}</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                type="text"
                placeholder={("Eg: Account Manager")}
                required
                onChange={handleEditName}
                value={editCandidate.name}
              />
              <Form.Label className="mt-2">{t("Description")}</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                as="textarea"
                rows={3}
                onChange={handleEditDescription}
                value={editCandidate.description}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <button type="button"
            className="btn btn-link text-dark" onClick={handleCloseEditRoleModal}>
            {t("Cancel")}
          </button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleUpdateRole}
          >
           {t("Save")}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  const noData = () => (
    <div>
      <h3 className="text-center">
        <Translation>{(t) => t(props.error || "No data Found")}</Translation>
      </h3>
    </div>
  );

  const customTotal = (from, to, size) => (
    <span className="ml-2" role="main">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("results")}</Translation>
    </span>
  );
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
        value: roles.length,
      },
    ];
    return list;
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
  const pagination = paginationFactory({
    showTotal: true,
    align: "center",
    className:"d-flex",
    sizePerPageList: getpageList(),
    page: activePage,
    sizePerPage: sizePerPage,
    paginationTotalRenderer: customTotal,
    onPageChange: (page) => setActivePage(page),
    sizePerPageRenderer: customDropUp,
  });

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
            <div className="user-list" onClick={(e) => handleClick(e, rowData)}>
              <p><Translation>{(t) => t("View")}</Translation></p>
              <i className="fa fa-caret-down ml-2" />
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
          checkDefaultRoleOrNot(rowData.name) ? null :
          <div>
            <i
              className="fa fa-pencil  mr-4"
              style={{ color: "#7E7E7F", cursor: "pointer" }}
              onClick={() => {
                setSelectedRoleIdentifier(KEYCLOAK_ENABLE_CLIENT_AUTH ? rowData.name : rowData.id)
                setEditCandidate(rowData);
                handleShowEditRoleModal();
              }}
            />
            <i
              className="fa fa-trash delete_button"
              style={{ color: "#D04444" }}
              onClick={() => {
                setDeleteCandidate(rowData);
                handleShowDeleteModal();
              }}
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
            <Form.Control
              type="text"
              placeholder={t("Search by role name")}
              className="search-role-input"
              onChange={handlFilter}
              value={search}
              title={t("Search...")}
            />

            {search.length > 0 && (
              <Button
                variant="outline-secondary btn-small clear"
                onClick={() => {
                  setSerach("");
                  setRoles(props.roles);
                }}
              >
                {t("Clear")}
              </Button>
            )}
          </div>
          <Button variant="primary"  onClick={handleShowRoleModal}>
          <i className="fa-solid fa-plus mr-2"></i> <Translation>{(t) => t("Create New Role")}</Translation>
          </Button>
        </div>
        {!props?.loading ? (
          <BootstrapTable
            keyField="id"
            data={roles}
            columns={columns}
            pagination={pagination}
            bordered={false}
            wrapperClasses="table-container"
            rowStyle={{
              color: "#09174A",
              fontWeight: 600,
            }}
            noDataIndication={noData}
          />
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
