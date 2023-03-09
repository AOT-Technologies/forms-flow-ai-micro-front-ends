import React, { useState } from "react";
import BootstrapTable from "react-bootstrap-table-next";
import "./roles.scss";
import { Translation, useTranslation } from "react-i18next";
import paginationFactory from "react-bootstrap-table2-paginator";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { fetchUsers } from "../../services/users";
import { CreateRole, DeleteRole, UpdateRole } from "../../services/roles";
import Popover from "@material-ui/core/Popover";
import ListGroup from "react-bootstrap/ListGroup";
import Modal from "react-bootstrap/Modal";
import Loading from "../loading";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";

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
  const [anchorEl, setAnchorEl] = React.useState(null);
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

  React.useEffect(() => {
    setRoles(props.roles);
  }, [props.roles]);

  const handlFilter = (e) => {
    let roleList = props?.roles.filter((role) => {
      return (
        role.name.toLowerCase().search(e.target.value.toLowerCase()) !== -1
      );
    });
    setRoles(roleList);
  };

  const deleteRole = (rowData) => {
    DeleteRole(
      rowData.id,
      () => {
        props.setInvalidated(true);
        handleCloseDeleteModal();
      },
      setError
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
    CreateRole(
      payload,
      (data) => {
        props.setInvalidated(true);
        handleCloseRoleModal();
      },
      setError
    );
  };
  const handleUpdateRole = () => {
    if (!validateRolePayload(editCandidate)) {
      return;
    }
    UpdateRole(
      editCandidate,
      (data) => {
        props.setInvalidated(true);
        handleCloseEditRoleModal();
      },
      setError
    );
  };

  // handlers for user list popover
  const handleClick = (event, rowData) => {
    setShow(!show);
    setLoading(true);
    setAnchorEl(event.currentTarget);
    fetchUsers(
      rowData.name,
      null,
      null,
      (data) => {
        setUsers(data);
        setLoading(false);
      },
      setError,
      false
    );
  };
  const handleClose = () => {
    setShow(false);
    setAnchorEl(null);
    setUsers([]);
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
  };
  const handleShowDeleteModal = () => setShowConfirmDelete(true);

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
          <Button variant="danger" onClick={() => deleteRole(deleteCandidate)}>
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
              <Form.Control
                type="text"
                placeholder="Eg: Account Manager"
                required
                onChange={handleChangeName}
              />
              <Form.Label className="mt-2">Description</Form.Label>
              <Form.Control
                as="textarea"
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
          <Button variant="primary" onClick={handleCreateRole}>
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
              <Form.Control
                type="text"
                placeholder="Eg: Account Manager"
                required
                onChange={handleEditName}
                value={editCandidate.name}
              />
              <Form.Label className="mt-2">Description</Form.Label>
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
          <Button variant="primary" onClick={handleUpdateRole}>
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
      text: <Translation>{(t) => t("Role name")}</Translation>,
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
          <>
            <div className="user-list" onClick={(e) => handleClick(e, rowData)}>
              <p>view</p>
              <i className="fa fa-caret-down ml-1" />
            </div>
            <Popover
              data-testid="popup-component"
              id={show ? "simple-popover" : undefined}
              open={show}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
            >
              <ListGroup>
                {!loading ? (
                  users.length > 0 ? (
                    users?.map((item, key) => (
                      <ListGroup.Item key={key} as="button">
                        {item.id}
                      </ListGroup.Item>
                    ))
                  ) : (
                    <ListGroup.Item>{`${t(
                      "No results found"
                    )}`}</ListGroup.Item>
                  )
                ) : (
                  <ListGroup.Item>{`${t("Loading...")}`}</ListGroup.Item>
                )}
              </ListGroup>
            </Popover>
          </>
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
          <Form.Control
            type="text"
            placeholder="Search by role name"
            className="search-role"
            onChange={handlFilter}
          />
          <Button variant="primary" onClick={handleShowRoleModal}>
            <i className="fa fa-l fa-plus-circle mr-1" /> Create New Role
          </Button>
        </div>
       {!props?.loading ? <BootstrapTable
          keyField="id"
          data={roles}
          columns={columns}
          pagination={pagination}
          bordered={false}
          wrapperClasses="table-container"
          rowStyle={{
            color: "#09174A",
            fontWeight: 600
          }}
          noDataIndication={noData}
        />: <Loading />}
        {showCreateModal()}
        {confirmDelete()}
        {showEditModal()}
      </div>
    </>
  );
});

export default Roles;
