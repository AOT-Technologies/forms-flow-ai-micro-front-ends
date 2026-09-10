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
import { getStatusDisplay, removingTenantId } from "../../utils/utils.js";
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
  V8CustomDropdownButton,
  ReusableTable,
} from "@formsflow/components";
import { Tabs, Tab } from "react-bootstrap";
import { getColumnPresetSizing } from "@formsflow/service";

const DEFAULT_SORT_MODEL: any[] = [];

// Built-in tiers sort first, ranked by permission level; custom roles follow, alphabetically.
const BUILT_IN_ROLE_ORDER = ["Owner", "Admin", "Manager", "Creator", "Viewer"];

const arePermissionSetsEqual = (a: string[] = [], b: string[] = []) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((permission, index) => permission === sortedB[index]);
};

const Roles = React.memo((props: any) => {
  const { t } = useTranslation();
  const { tenantId: tenantIdFromParams } = useParams();
  const tenantId = props.tenantId ?? tenantIdFromParams;
  const [roles, setRoles] = React.useState([]);
  const [activePage, setActivePage] = React.useState(1);
  const [usersActivePage, setUsersActivePage] = React.useState(1);
  const [sizePerPage, setSizePerPage] = React.useState(5);
  const [error, setError] = useState({});
  const [handleConfirmation, setHandleConfirmation] = React.useState(false);
  const [users, setUsers] = React.useState<any>([]);
  const [usersCount, setUsersCount] = React.useState(0);
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
    userCount: 0,
  };
  const [deleteCandidate, setDeleteCandidate] = React.useState(initialRoleType);
  const [selectedRoleIdentifier, setSelectedRoleIdentifier] =
    React.useState("");
  const [editCandidate, setEditCandidate] = React.useState(initialRoleType);
  // Snapshot of the role as it was when the edit modal was opened, used to
  // keep the Update button disabled until something actually changes.
  const [originalEditCandidate, setOriginalEditCandidate] =
    React.useState(initialRoleType);
  const [disabled, setDisabled] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [permissionData, setPermissionData] = React.useState([]);
  const [key, setKey] = useState("Details");
  const lastCreateTriggerRef = React.useRef<number | null>(null);
  const [usersSizePerPage, setUsersSizePerPage] = React.useState(5);

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

  const sortRoles = (roleList: any[]) => {
    roleList = removingTenantId(roleList, tenantId)
    
    return [...roleList].sort((a, b) => {
      if (a.isDefault && b.isDefault) {
        const aRank = BUILT_IN_ROLE_ORDER.indexOf(a.name);
        const bRank = BUILT_IN_ROLE_ORDER.indexOf(b.name);
        return (
          (aRank === -1 ? BUILT_IN_ROLE_ORDER.length : aRank) -
          (bRank === -1 ? BUILT_IN_ROLE_ORDER.length : bRank)
        );
      }
      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }
      return (a.name ?? "").localeCompare(b.name ?? "");
    });
  };

  React.useEffect(() => {
    setDisabled(!(payload.name?.trim() && payload.permissions.length !== 0));
  }, [payload]);

  React.useEffect(() => {
    const invalid = !(
      editCandidate.name?.trim() && editCandidate.permissions?.length !== 0
    );
    const unchanged =
      editCandidate.name === originalEditCandidate.name &&
      editCandidate.description === originalEditCandidate.description &&
      arePermissionSetsEqual(
        editCandidate.permissions,
        originalEditCandidate.permissions
      );
    setDisabled(invalid || unchanged);
  }, [editCandidate, originalEditCandidate]);

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

    setRoles(sortRoles(updatedRoles));
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
      setRoles(sortRoles(filterList(e.target.value, props.roles)));
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
  // fetch users based on the role
  const getUsersbyRole = (rowData:any) => {
    fetchUsers(
      rowData.name,
      1,
      null,
      null,
      (results: any) => {
        setUsers(results.data);
        setUsersCount(results.count)
      },
      (err) => {
        setUsers([]);
        setError(err);
        setUsersCount(0);
      },
      false,
      true
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
    setOriginalEditCandidate(initialRoleType);
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
    setRoles(sortRoles(updatedRoleName));
  };

  const closeConfirmation = () => {
    setHandleConfirmation(false);
  };

  // Built-in tiers open read-only: locked permission tree, no name/description
  // edits, and no Update/Delete actions.
  const isViewOnlyRole = showEditRoleModal && !!(editCandidate as any)?.isDefault;

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
            disabled={isViewOnlyRole}
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
            disabled={isViewOnlyRole}
          />
          {showEditRoleModal && !isViewOnlyRole && (
            <div className="role-delete-container">
              <div className="buttons-row">
                <V8CustomButton
                  style={{ borderColor: "#D45E5E" }}
                  label={t("Delete Role")}
                  onClick={() => {
                    handleCloseEditRoleModal();
                    setHandleConfirmation(true);
                  }}
                  dataTestId="role-delete-button"
                  ariaLabel="Role delete button"
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
              <div>{usersCount || 0} users currently have this role.</div>
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
              disabled={isViewOnlyRole}
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
    const submitLabel = isEditMode ? t("Update") : t("Create");
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
          preset: "primaryName",
          ...getColumnPresetSizing("primaryName"),
          sortable: false,
          renderCell: (params: any) => {
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
          preset: "longText",
          ...getColumnPresetSizing("longText"),
          sortable: false,
          renderCell: (params:any) => params.row?.email,
        },
        {
          field: "id",
          headerName: t("Status"),
          preset: "status",
          ...getColumnPresetSizing("status"),
          sortable: false,
          headerAlign: "right",
          renderCell: (params: any) => {
            const { label, className } = getStatusDisplay(params.row?.status);
            return <span className={className}>{t(label)}</span>;
          },
        },
      ];
      console.log('use',users)
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
              <div className="user-count">{usersCount || 0} users have this role</div>
              <ReusableTable
                columns={columns}
                rows={users || []}
                rowCount={users.length ? users.length : 0}
                loading={loading}
                getRowId={(row: any) => row.id}
                sortModel={DEFAULT_SORT_MODEL}
                paginationMode="client"
                sortingMode="client"
                disableColumnMenu
                disableRowSelectionOnClick
                emptyStateMessage={t("No users found")}
                paginationModel={{
                  page: usersActivePage - 1,
                  pageSize: usersSizePerPage,
                }}
                onPaginationModelChange={({ page, pageSize }) => {
                  if (pageSize !== usersSizePerPage) {
                    handleLimitChange("users", pageSize);
                  } else {
                    handlePageChange("users", page + 1);
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
              <div className="d-flex align-items-center">
              {modalTitle}
              {isViewOnlyRole && <span className="role-badge default-badge">Default</span>}
              </div>
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
            {isViewOnlyRole && (
              <span className="info-text">Built-in roles cannot be modified.</span>
            )}
            {!isViewOnlyRole && (
              <div className="buttons-row">
                  <V8CustomButton
                    label={submitLabel}
                    disabled={disabled}
                    onClick={submitAction}
                    dataTestId={submitTestId}
                    ariaLabel={ariaLabel}
                  />
              </div>
            )}
          </AppModal.Footer>
        </AppModal>
      </div>
    );
  };

  const handlePageChange = (table, page: number) => {
    table == 'roles'? setActivePage(page): setUsersActivePage(page);
  };

  const handleLimitChange = (table: string, newLimit: number) => {
    if (table == "roles") {
      setSizePerPage(newLimit);
      setActivePage(1);
    }
    if (table == "users") {
      setUsersSizePerPage(newLimit);
      setUsersActivePage(1);
    }
  };

  const openRoleModal = (roleForModal: any) => {
    setSelectedRoleIdentifier(roleForModal.id);
    getUsersbyRole(roleForModal);
    setEditCandidate(roleForModal);
    setOriginalEditCandidate(roleForModal);
    handleShowEditRoleModal();
    setDeleteCandidate(roleForModal);
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
              <div className="role-badge py-1">{params.row?.isDefault ? t("Default") : t("Custom")}</div>
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
      renderCell: (params: any) => {
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
      sortable: false,
      cellClassName: "last-column",
      renderCell: (params:any) => {
        const rowData = params.row;
        const { candidateGroupFull: _omitCg, ...roleForModal } = rowData;

        if (rowData?.isDefault) {
          return (
            <div className="ms-3">
              <V8CustomButton
                label={t("View")}
                onClick={() => openRoleModal(roleForModal)}
                aria-label={t("View role")}
                data-testid="admin-roles-view-icon"
              />
            </div>
          );
        }else {
          return (
            <div className="ms-3">
              <V8CustomDropdownButton
                label={t("Edit")}
                onLabelClick={() => openRoleModal(roleForModal)}
                dropdownItems={[
                  {
                    label: t("Delete"),
                    value: "delete",
                    onClick: () => {
                      setDeleteCandidate(roleForModal);
                      setHandleConfirmation(true);
                    },
                    dataTestId: "admin-roles-delete-option",
                    ariaLabel: t("Delete role"),
                    className: "delete-dropdown-item",
                  },
                ]}
                variant="secondary"
                menuPosition="right"
                dataTestId="admin-roles-edit-dropdown"
                ariaLabel={t("Edit role")}
              />
            </div>
          );
        }
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
                    handleLimitChange("roles", pageSize);
                  } else {
                    handlePageChange("roles", page + 1);
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
          title={t("Delete this role?")}
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
