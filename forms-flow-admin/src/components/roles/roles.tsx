import React, { useState } from "react";
import "./roles.scss";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchUsers } from "../../services/users";
import {
  CreateRole,
  DeleteRole,
  UpdateRole,
  fetchPermissions,
} from "../../services/roles";
import Loading from "../loading";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { toast } from "react-toastify";
import PermissionTree from "./permissionTree";
import { removingTenantId } from "../../utils/utils.js";
import {
  AppModal,
  CustomSearch,
  CloseIcon,
  CopyIcon,
  FormInput,
  FormTextArea,
  DeleteIcon,
  CustomInfo,
  ConfirmModal,
  V8CustomButton,
  ReusableTable,
} from "@formsflow/components";
import { Tabs, Tab } from "react-bootstrap";
import { getColumnPresetSizing } from "@formsflow/service";

const DEFAULT_SORT_MODEL: any[] = [];

const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
  const { tenantId: tenantIdFromParams } = useParams();
  const tenantId = props.tenantId ?? tenantIdFromParams;
  const [roles, setRoles] = React.useState([]);
  const [activePage, setActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [error, setError] = useState({});
  const [handleConfirmation, setHandleConfirmation] = React.useState(false);
  const [users, setUsers] = React.useState<any[]>([]);
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
  const [key, setKey] = useState("Details");
  const lastCreateTriggerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const trigger = props.openCreateRoleTrigger ?? 0;
    if (
      lastCreateTriggerRef.current !== null &&
      trigger !== lastCreateTriggerRef.current
    ) {
      handleShowRoleModal();
    }
    lastCreateTriggerRef.current = trigger;
  }, [props.openCreateRoleTrigger]);

  const filterList = (filterTerm: string, List: any) => {
    let roleList = removingTenantId(List, tenantId);

    // Escape backslashes and square brackets in filterTerm for safe regex use
    const escapedFilterTerm = filterTerm.replace(/([\\[])/g, "\\$1");

    let newRoleList = roleList.filter((role: { name: string; }) => {
      return (
        role.name.toLowerCase().search(escapedFilterTerm.toLowerCase()) !== -1
      );
    });
    return newRoleList;
  };

  React.useEffect(() => {
    setDisabled(!(payload.name?.trim() && payload.permissions.length !== 0));
  }, [payload]);

  React.useEffect(() => {
    setDisabled(
      !(editCandidate.name?.trim() && editCandidate.permissions.length !== 0)
    );
  }, [editCandidate]);

  /**
   * Full candidate-group string for copy / Camunda from API `name`.
   * Resolves by id on props.roles (unmodified list) so copy stays correct when
   * removingTenantId strips the table row’s display name.
   */
  const resolveFullCandidateGroup = React.useCallback(
    (displayRow: { id?: string; name?: string }) => {
      const raw = (props.roles ?? []).find(
        (r: { id?: string }) => r.id === displayRow.id
      );
      if (!raw) return String(displayRow.name ?? "").trim();
      const nameVal =
        raw.name != null && String(raw.name).trim() !== ""
          ? String(raw.name).trim()
          : "";
      return nameVal || String(displayRow.name ?? "").trim();
    },
    [props.roles]
  );

  const handleCopyCandidateGroup = React.useCallback(
    async (text: string) => {
      const value = text.trim();
      if (!value) return;
      const clip = globalThis.navigator?.clipboard;
      if (!clip?.writeText) {
        toast.error(t("Could not copy"));
        return;
      }
      try {
        await clip.writeText(value);
        toast.success(t("Copied to clipboard"));
      } catch {
        toast.error(t("Could not copy"));
      }
    },
    [t]
  );

  React.useEffect(() => {
    let updatedRoles = props.roles ?? [];

    if (search) {
      updatedRoles = filterList(search, updatedRoles);
    }

    updatedRoles = removingTenantId(updatedRoles, tenantId);

    updatedRoles = updatedRoles.map((role) => ({
      ...role,
      candidateGroupFull: resolveFullCandidateGroup(role),
    }));

    setRoles(updatedRoles);
    console.log("preset",getColumnPresetSizing("primaryName"));
  }, [props.roles, search, tenantId, resolveFullCandidateGroup]);

  React.useEffect(() => {
    fetchPermissions(
      (data) => {
        // Filter out manage_bundles, manage_integrations, and manage_templates  and analyze_metrics_view permissions
        // Hide because v8 out of scope - will be restored later
        const filteredData = data.filter(
          (permission) =>
            permission.name !== "manage_integrations" &&
            permission.name !== "manage_templates" &&
            // permission.name !== "analyze_metrics_view" &&
            permission.name !== "view_dashboards" &&
            permission.name !== "manage_dashboard_authorizations"
        );
        setPermissionData(filteredData);
      },
      (err) => {
        setError(err);
      }
    );
  }, []);

  const handlFilter = (e) => {
    if (e && e.key === "Enter") {
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
    }
    setPayload({ ...payload, permissions: updatedPermissions });
  };

  const validateRolePayload = (payload) => {
    return !(payload.name === "" || payload.permissions.length === 0);
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
        toast.error(t(`${err}`));
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
  };
  const handleCloseEditRoleModal = () => {
    setShowEditRoleModal(false);
    setEditCandidate(initialRoleType);
    setSelectedRoleIdentifier("");
  };
  const handleShowEditRoleModal = () => {
    setKey("Details");
    setShowEditRoleModal(true);
  };
  const handleCloseDeleteModal = () => {
    setShowConfirmDelete(false);
    setDeleteCandidate(initialRoleType);
    setDisabled(true);
  };

  const handleClearSearch = () => {
    setSearch("");
    let updatedRoleName = removingTenantId(props.roles, tenantId);
    setRoles(updatedRoleName);
  };

  const closeConfirmation = () => {
    setHandleConfirmation(false);
  };

  let tabs = [
    {
      eventKey: "Details",
      title: "Details",
      content: (
        <div className="role-tab-body role-details">
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
            value={
              showEditRoleModal
                ? editCandidate.description
                : payload.description
            }
            onChange={
              showEditRoleModal
                ? handleEditDescription
                : handleChangeDescription
            }
            aria-label={t("Description of role")}
            data-testid="role-description"
            maxRows={3}
            minRows={3}
          />
          {showEditRoleModal && (
            <div className="role-delete-container">
              <div className="buttons-row">
                <V8CustomButton
                  label={t("Delete This Role")}
                  onClick={() => {
                    handleCloseEditRoleModal();
                    setHandleConfirmation(true);
                  }}
                  dataTestId="role-delete-button"
                  icon={<DeleteIcon />}
                  ariaLabel="Role delete button"
                  // iconWithText
                  />
              </div>
              <CustomInfo
                className="note"
                heading="Note"
                variant="warning"
                content={t(
                  "Deleting this role will revoke access for everyone associated with this role. This cannot be undone."
                )}
                dataTestId="delete-role-note"
              />
              <div>7 users currently have this role.</div>
            </div>

          )}
        </div>
      ),
    },
    {
      eventKey: "Permissions",
      title: "Permissions",
      content: (
        <div className="role-tab-body">
          <div className="role-permissions-container">
            <PermissionTree
              permissions={permissionData}
              payload={showEditRoleModal ? editCandidate : payload}
              handlePermissionCheck={
                showEditRoleModal
                ? handleEditPermissionCheck
                : handlePermissionCheck
              }
              setPayload={showEditRoleModal ? setEditCandidate : setPayload}
            />
          </div>
        </div>
      ),
    },
  ];

  const renderRoleModal = () => {
    const isEditMode = showEditRoleModal;
    const modalTitle = isEditMode ? editCandidate.name : t("Add New Role");
    const modalShow = isEditMode ? showEditRoleModal : showRoleModal;
    const modalCloseHandler = isEditMode
      ? handleCloseEditRoleModal
      : handleCloseRoleModal;
    const submitLabel = isEditMode ? t("Save Changes") : t("Create");
    const submitAction = isEditMode ? handleUpdateRole : handleCreateRole;
    const submitTestId = isEditMode ? "edit-role-button" : "create-new-role-button";
    const ariaLabel = isEditMode
      ? "Edit role button"
      : "Create new role button";
    
    if (isEditMode) {
      const columns = [
    {
      field: "username",
      headerName: t("Users"),
      flex: 1,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => {
        const rowData = params.row;
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
      field: "email",
      headerName: t("Email"),
      flex: 2,
      minWidth: 200,
      sortable: false,
      renderCell: (params:any) => params.row?.email,
    },
    {
      field: "id",
      headerName: t("Status"),
      width: 130,
      minWidth: 130,
      flex: 0,
      sortable: false,
      headerAlign: "right",
      align: "right",
      renderCell: (params:any) => params.row?.status ? t("Active") : t("Inactive")
    },
  ];
      const userTab = {
        eventKey: "Users",
        title: "Users",
        content: (
          <div className="role-tab-body role-users">
            {!loading ? (
            <div
              className="user-table-container"
              data-testid="role-users-table"
              >
              <div className="user-count">{props && props.total ? props.total : '0'} users have this role</div>
              <ReusableTable
                columns={columns}
                rows={props?.users || []}
                rowCount={props.total ? props.total : 0}
                loading={loading}
                getRowId={(row: any) => row.id}
                sortModel={DEFAULT_SORT_MODEL}
                paginationMode="server"
                sortingMode="client"
                disableColumnMenu
                disableRowSelectionOnClick
                emptyStateMessage={props.error || t("No users found")}
                paginationModel={{
                  page: activePage - 1,
                  pageSize: props?.limit?.sizePerPage || 5,
                }}
                onPaginationModelChange={({ page, pageSize }) => {
                  if (pageSize !== props?.limit?.sizePerPage) {
                    handleLimitChange(pageSize);
                  } else {
                    handlePageChange(page + 1);
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
        ),
      };
      tabs= [userTab, ...tabs];
    }

    return (
      <div data-testid={isEditMode ? "edit-role-modal" : "create-role-modal"}>
        <AppModal
          show={modalShow}
          onHide={modalCloseHandler}
          size="lg"
          centered={!isEditMode}
          restoreFocus={false}
          dialogClassName="role-modal-dialog"
        >
          <AppModal.Header>
            <AppModal.Title>
              <p>{modalTitle}</p>
            </AppModal.Title>
            <div
              className="icon-close"
              onClick={modalCloseHandler}
              data-testid="role-modal-close"
              aria-label={t("Close")}
            >
              <CloseIcon color="#525254" />
            </div>
          </AppModal.Header>
          <AppModal.Body className="with-tabs">
            <div className="pill-tabs-container">
              <Tabs
                activeKey={key}
                onSelect={(key) => key && setKey(key)}
                id="profile-settings-tabs"
                data-testid="profile-settings-tabs"
                className="pill-tabs"
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.eventKey}
                    eventKey={tab.eventKey}
                    title={
                      <span data-testid={`profile-settings-${tab.eventKey}-tab`}>
                        {tab.title}
                      </span>
                    }
                  >
                    {/* Empty content; this is navigation. Body renders based on activeTab. */}
                  </Tab>
                ))}
              </Tabs>
            </div>
            <div className="pill-tabs-content">
              {tabs.find((tab) => tab.eventKey === key)?.content}
            </div>
          </AppModal.Body>
          <AppModal.Footer>
            <div className="buttons-row">
              {isEditMode && (
                <V8CustomButton
                  label={t("Discard Changes")}
                  onClick={handleCloseEditRoleModal}
                  dataTestId="edit-role-cancel-button"
                  ariaLabel="Edit role cancel button"
                  secondary
                />
              )}
              <V8CustomButton
                label={submitLabel}
                disabled={disabled}
                onClick={submitAction}
                dataTestId={submitTestId}
                ariaLabel={ariaLabel}
              />
            </div>
          </AppModal.Footer>
        </AppModal>
      </div>
    );
  };

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setSizePerPage(newLimit);
    setActivePage(1);
  };
 
  const columns = [
    {
      field: "name",
      headerName: t("Role"),
      preset: "primaryName",
      ...getColumnPresetSizing("primaryName"),
      flex:2.5,
      sortable: false,
      cellClassName: "text-break",
      renderCell: (params:any) => {
        return (
          <div className="d-flex align-items-center">
            <div className="role-badge">owner</div>
            {params.row?.name}
          </div>
          
        );
      },
    },
    {
      field: "candidateGroupFull",
      headerName: t("Candidate Groups"),
      preset:"longText",
      ...getColumnPresetSizing("longText"),
      sortable: false,
      headerClassName: "roles-candidate-group-header",
      cellClassName: "text-break roles-candidate-group-cell",
      renderCell: (params) => {
        const row = params.row as { id?: string };
        const value = (params.row?.candidateGroupFull as string) ?? "";
        const displayValue = value.replace(/\//g, "");
        return (
          <span className="roles-candidate-group-inner">
            <span className="roles-candidate-group-text">{displayValue}</span>
            <button
              type="button"
              className="btn btn-link roles-candidate-group-copy"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyCandidateGroup(value);
              }}
              aria-label={t("Copy candidate group")}
              title={t("Copy candidate group")}
              data-testid={`admin-roles-copy-candidate-group-${row.id}`}
            >
              <CopyIcon />
            </button>
          </span>
        );
      },
    },
    {
      field: "description",
      headerName: t("Description"),
      preset:"longText",
      ...getColumnPresetSizing("longText"),
      sortable: false,
      cellClassName: "text-break",
      renderCell: (params: any) => params.row?.description,
    },
    {
      field: "users",
      headerName: t("Users"),
      preset: "count",
      ...getColumnPresetSizing("count"),
      sortable: false,
      renderCell: (params:any) => params.row?.userCount || 0,
    },
    {
      field: "id",
      headerName: t(""),
      preset: "actions",
      ...getColumnPresetSizing("actions"),
      headerAlign: "right",
      renderCell: (params:any) => {
        const rowData = params.row;
        return (
          <div className="ms-3">
            <V8CustomButton
              label={t("View")}
              onClick={() => {
                const { candidateGroupFull: _omitCg, ...roleForModal } =
                  rowData;
                setSelectedRoleIdentifier(rowData.id);
                setEditCandidate(roleForModal);
                handleShowEditRoleModal();
                setDeleteCandidate(roleForModal);
                // setSelectedRoleIdentifier(
                //   KEYCLOAK_ENABLE_CLIENT_AUTH ? rowData.name : rowData.id
                // );
              }}
              aria-label={t("Edit role")}
              data-testid="admin-roles-edit-icon"
            />
            {/* <i
              className="fa fa-pencil"
              style={{ color: "#7E7E7F", cursor: "pointer" }}
              
            /> */}
          </div>
        );
      },
    },
  ];
  return (
    <>
      <div className="container-admin-roles">
        <div className="search-role col-xl-4 col-lg-4 col-md-6 col-sm-5 px-0">
          <CustomSearch
            handleClearSearch={handleClearSearch}
            search={search}
            setSearch={setSearch}
            handleSearch={handlFilter}
            placeholder={t("Search by role name")}
            title={t("Search")}
            dataTestId="search-role-input"
          />
        </div>

        {!props?.loading ? (
          <div>
            <div data-testid="admin-roles-table">
              <ReusableTable
                columns={columns}
                rows={roles}
                loading={props?.loading}
                getRowId={(row) => row.id}
                sortModel={DEFAULT_SORT_MODEL}
                paginationMode="client"
                sortingMode="client"
                disableColumnMenu
                disableRowSelectionOnClick
                emptyStateMessage={props.error || t("No data Found")}
                paginationModel={{
                  page: activePage - 1,
                  pageSize: sizePerPage,
                }}
                onPaginationModelChange={({ page, pageSize }) => {
                  if (pageSize !== sizePerPage) {
                    handleLimitChange(pageSize);
                  } else {
                    handlePageChange(page + 1);
                  }
                }}
                pageSizeOptions={[5, 25, 50, 100]}
                disableVirtualization
                dataGridProps={{ getRowHeight: () => "auto" }}
              />
            </div>
          </div>
        ) : (
          <Loading />
        )}
        {renderRoleModal()}
      </div>
      {handleConfirmation && (
        <ConfirmModal
          show={handleConfirmation}
          title={t("Delete This Role?")}
          message={
            "Deleting a role is permanent and cannot be undone."
          }
          primaryBtnAction={closeConfirmation}
          onClose={closeConfirmation}
          primaryBtnText={t("Cancel")}
          secondaryBtnText={t("Delete Role")}
          secondaryBtnAction={() => {
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
