import React, { useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import "./roles.scss";
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
import InputGroup from "react-bootstrap/InputGroup";

const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
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
    setDisabled(!(payload.name.trim() && payload.description.trim()));
  }, [payload]);

  React.useEffect(() => {
    setDisabled(
      !(editCandidate.name.trim() && editCandidate.description.trim())
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
      rowData.id,
      () => {
        props.setInvalidated(true);
        handleCloseDeleteModal();
        toast.success("Role deleted successfully!");
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(err.message || "Failed to delete role!");
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

  const handleCreateRole = () => {
    if (!validateRolePayload(payload)) {
      return;
    }
    setDisabled(true);
    CreateRole(
      payload,
      (data) => {
        props.setInvalidated(true);
        handleCloseRoleModal();
        toast.success("Role created successfully!");
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(err.message || "Failed to create role!");
      }
    );
  };
  const handleUpdateRole = () => {
    if (!validateRolePayload(editCandidate)) {
      return;
    }
    setDisabled(true);
    UpdateRole(
      editCandidate,
      (data) => {
        props.setInvalidated(true);
        handleCloseEditRoleModal();
        toast.success("Role updated successfully!");
      },
      (err) => {
        setError(err);
        setDisabled(false);
        toast.error(err.message || "Failed to update role!");
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
      setError,
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
  const handleCloseRoleModal = () => setShowRoleModal(false);
  const handleShowRoleModal = () => setShowRoleModal(true);
  const handleCloseEditRoleModal = () => {
    setShowEditRoleModal(false);
    setEditCandidate(initialRoleType);
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

  // Delete confirmation

  const confirmDelete = () => (
    <div>
      <Modal show={showConfirmDelete} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure deleting the role {deleteCandidate.name}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={disabled}
            onClick={() => deleteRole(deleteCandidate)}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  const showCreateModal = () => (
    <div>
      <Modal show={showRoleModal} onHide={handleCloseRoleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Create Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label aria-required>Role Name</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                type="text"
                placeholder="Eg: Account Manager"
                required
                onChange={handleChangeName}
              />
              <Form.Label className="mt-2">Description</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                as="textarea"
                placeholder="Eg: Lorem ipsum..."
                rows={3}
                onChange={handleChangeDescription}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={handleCloseRoleModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleCreateRole}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  const showEditModal = () => (
    <div>
      <Modal show={showEditRoleModal} onHide={handleCloseEditRoleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label aria-required>Role Name</Form.Label>
              <i style={{ color: "red" }}>*</i>
              <Form.Control
                type="text"
                placeholder="Eg: Account Manager"
                required
                onChange={handleEditName}
                value={editCandidate.name}
              />
              <Form.Label className="mt-2">Description</Form.Label>
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
          <Button variant="light" onClick={handleCloseEditRoleModal}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={disabled}
            onClick={handleUpdateRole}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  const noData = () => (
    <div>
      <h3 className="text-center">
        <Translation>{(t) => t("No data Found")}</Translation>
      </h3>
    </div>
  );

  const customTotal = (from, to, size) => (
    <span className="react-bootstrap-table-pagination-total" role="main">
      <Translation>{(t) => t("Showing")}</Translation> {from}{" "}
      <Translation>{(t) => t("to")}</Translation> {to}{" "}
      <Translation>{(t) => t("of")}</Translation> {size}{" "}
      <Translation>{(t) => t("Results")}</Translation>
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
        text: "All",
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
              <p>View</p>
              <i className="fa fa-caret-down ml-1" />
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
              className="fa fa-pencil fa-lg mr-4"
              style={{ color: "#7E7E7F", cursor: "pointer" }}
              onClick={() => {
                setEditCandidate(rowData);
                handleShowEditRoleModal();
              }}
            />
            <i
              className="fa fa-trash fa-lg delete_button"
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
        <div className="sub-container">
          <div className="search-role">
            <Form.Control
              type="text"
              placeholder="Search by role name"
              className="search-role-input"
              onChange={handlFilter}
              value={search}
            />

            {search.length > 0 && (
              <Button
                variant="outline-secondary clear"
                onClick={() => {
                  setSerach("");
                  setRoles(props.roles);
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <Button variant="primary" onClick={handleShowRoleModal}>
            <i className="fa fa-l fa-plus-circle mr-1" /> Create New Role
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
