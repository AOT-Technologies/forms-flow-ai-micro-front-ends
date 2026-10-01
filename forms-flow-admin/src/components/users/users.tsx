import React from "react";
import { useTranslation } from "react-i18next";
import Loading from "../loading";
import { AddUserRole, RemoveUserRole, InviteUser, UpdateUserStatus } from "../../services/users";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import { toast } from "react-toastify";
import { Tooltip } from "react-bootstrap";
import "./users.scss";
import {
  KEYCLOAK_ENABLE_CLIENT_AUTH,
  MULTITENANCY_ENABLED,
} from "../../constants";
import {
  formatRoleDisplayName,
  getStatusDisplay,
  isInternalAdminRole,
} from "../../utils/utils.js";
import { completeChecklistByRouteKey } from "../../services/checklist";
import {
  AppModal,
  ConfirmModal,
  CustomSearch,
  CloseIcon,
  V8CustomButton,
  CustomTextInput,
  ReusableTable,
  AddWithDropdown,
  SelectDropdown,
} from "@formsflow/components";
import { useParams } from "react-router-dom";
import { getColumnPresetSizing, getRedirectUrl, StorageService } from "@formsflow/service";

const DEFAULT_SORT_MODEL: any[] = [];

// Fixed pill order: built-in tiers first (Owner ahead of the assignable tiers
// for the rare static Owner pill), then custom roles, alphabetically.
const ROLE_TIER_ORDER = ["Owner", "Admin", "Manager", "Creator", "Viewer"];

const roleTierRank = (name: string) => {
  const rank = ROLE_TIER_ORDER.indexOf(name);
  return rank === -1 ? ROLE_TIER_ORDER.length : rank;
};

const isOwnerRoleName = (name: string) =>
  String(name ?? "").toLowerCase() === "owner";

type AddRoleDropdownOption = {
  id: string;
  name: string;
  description?: string;
  badge?: string;
  isDefault?: boolean;
  disabled?: boolean;
};

const Users = React.memo((props: any) => {
  const [selectedRow, setSelectedRow] = React.useState(null);
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [roleNameMapper, setRoleNameMapper] = React.useState<
    Record<string, string>
  >({});
  const [roles, setRoles] = React.useState([]);
  const [error, setError] = React.useState(null); // Initialize error state with null instead of undefined
  const [loading, setLoading] = React.useState(false);
  const [activePage, setActivePage] = React.useState(1);
  const [selectedFilter, setSelectedFilter] = React.useState(undefined); // Initialize selectedFilter with null
  const [searchKey, setSearchKey] = React.useState(undefined);
  const [showInviteModal, setShowInviteModal] = React.useState(false); // Add state for managing invite modal
  const { t } = useTranslation();
  const { tenantId } = useParams();
  const baseUrl = getRedirectUrl(tenantId);
  const tenantKeyForRoleDisplay =
    MULTITENANCY_ENABLED && (tenantId || StorageService.get("tenantKey"))
      ? String(tenantId || StorageService.get("tenantKey"))
      : "";
  const [formData, setFormData] = React.useState({ user: "" });
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [validationError, setValidationError] = React.useState("");
  const [inviteSuccessEmail, setInviteSuccessEmail] = React.useState<
  string | null
  >(null);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [roleRemoveCandidate, setRoleRemoveCandidate] = React.useState<{
    rowData: any;
    item: any;
  } | null>(null);
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const lastInviteTriggerRef = React.useRef<number | null>(null);
  const [statusUpdateConfirmation, setStatusUpdateConfirmation] = React.useState(false);
  const [updateRow, setUpdateRow] = React.useState({
    "firstName": "",
    "lastName": "",
    "email": "",
    "id": "",
    "username": "",
    "role": [],
    "status": "",
    "isPrimaryOwner": false
  });

  // Id of the currently logged-in user, used to hide self-suspend controls.
  const currentUserId = React.useMemo(() => {
    try {
      const details = JSON.parse(
        StorageService.get(StorageService.User.USER_DETAILS) || "{}"
      );
      return details?.sub || details?.id || "";
    } catch {
      return "";
    }
  }, []);

  React.useEffect(() => {
    const trigger = props.openInviteTrigger ?? 0;
    if (
      lastInviteTriggerRef.current !== null &&
      trigger !== lastInviteTriggerRef.current
    ) {
      openInviteModal();
    }
    lastInviteTriggerRef.current = trigger;
  }, [props.openInviteTrigger]);

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
    setRoles((props.roles ?? []).filter((role: any) => !isInternalAdminRole(role.name)));
  }, [props.roles]);

  React.useEffect(() => {
    let mapper = {};
    for (let role of roles) {
      mapper[role.id] = role.name.split("/").at(-1);
    }
    setRoleNameMapper(mapper); // Corrected the function name from setROleNameMapper to setRoleNameMapper
  }, [roles]);

  // const addRole = (row) => {
  //   setSelectedRow(row);
  //   setSelectedRoles([]);
  // };

  const openStatusUpdateModal = (rowData: any) => {
    setStatusUpdateConfirmation(true);
    setUpdateRow(rowData);
  }

  const userStatusUpdate = (enabled: boolean) => {
    const user_id = updateRow.id;
    const payload = { enabled };

    UpdateUserStatus(user_id, payload)
      .then(() => {
        props.setInvalidated(true);
        toast.success(
          enabled
            ? t("User reactivated successfully!")
            : t("User suspended successfully!")
        );
      })
      .catch((err: any) => {
        toast.error(
          enabled
            ? t("Failed to reactivate user!")
            : t("Failed to suspend user!")
        );
        console.error(err);
      });
  };

  const handleSearch = (e) => {
    if (e && e.key === "Enter") {
      setSearchKey(e.target.value);
    }
  };
  const handleClearSearch = () => {
    setSearchKey("");
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

  const closeRoleRemoveConfirmation = () => setRoleRemoveCandidate(null);

  const confirmRoleRemove = () => {
    if (!roleRemoveCandidate) return;
    removePermission(roleRemoveCandidate.rowData, roleRemoveCandidate.item);
    closeRoleRemoveConfirmation();
  };

  const isProtectedOwnerRole = (rowData, item) =>
    rowData?.isPrimaryOwner &&
    formatRoleDisplayName(item?.name, tenantKeyForRoleDisplay).toLowerCase() ===
      "owner";

  const canRemoveRole = (rowData, item) => {
    // Minimum role enforcement: the last remaining role can't be removed.
    // Counts only the roles actually shown as chips - the internal
    // camunda-admin role is never rendered, so it must not pad the count.
    const visibleRoleCount = (rowData?.role ?? []).filter(
      (role: any) => !isInternalAdminRole(role?.name)
    ).length;
    if (visibleRoleCount <= 1) return false;
    // The admin role is protected
    if (!MULTITENANCY_ENABLED && item?.path === "/admin") return false;
    // The tenant creator's OWNER role is protected
    return !isProtectedOwnerRole(rowData, item);
  };

  const handleLimitChange = (newLimit: number) => {
    props.limit?.setSizePerPage(newLimit);
    props.page.setPageNo(1);
    setActivePage(1);
  };

  const handlePageChange = (page: number) => {
    setActivePage(page);
    props.page.setPageNo(page);
    props.setInvalidated(true);
  };

  const handleSelectFilter = (value: string | number) => {
    if (value === "ALL") {
      return setSelectedFilter(null);
    }
    setSelectedFilter(value);
  };

  const columns = [
    {
      field: "username",
      headerName: t("Users"),
      preset: "primaryName",
      ...getColumnPresetSizing("primaryName"),
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
      preset: "longText",
      ...getColumnPresetSizing("longText"),
      sortable: false,
      renderCell: (params) => params.row?.email,
    },
    {
      field: "role",
      headerName: t("Role"),
      preset: "chipSet",
      ...getColumnPresetSizing("chipSet"),
      sortable: false,
      renderCell: (params) => {
        const rowData = params.row;
        const isOwnerRow = rowData?.isPrimaryOwner || rowData?.isOwner;
        const cell: any[] = [...(rowData?.role ?? [])]
          .filter((item: any) => !isInternalAdminRole(item?.name))
          .sort((a, b) => {
            const nameA = formatRoleDisplayName(a?.name, tenantKeyForRoleDisplay);
            const nameB = formatRoleDisplayName(b?.name, tenantKeyForRoleDisplay);
            return (
              roleTierRank(nameA) - roleTierRank(nameB) ||
              nameA.localeCompare(nameB)
            );
          });
        
        const assignedRoleIds = new Set(cell.map((item: any) => item.id));
                  
        const addSingleUserRole = (option: AddRoleDropdownOption) => {
          if (option.disabled) return;
          const user_id = rowData.id;
          const payload = {
            userId: user_id,
            groupId: option.id,
            name: roleNameMapper[option.id],
          };
          AddUserRole(user_id, option.id, payload)
            .then(() => {
              props.setInvalidated(true);
              toast.success(t("Permission updated successfully!"));
            })
            .catch((err: any) => {
              toast.error(t("Failed to update permission!"));
              console.error(err);
            });
        };

        const availableRoleDropdownOptions: AddRoleDropdownOption[] =
          roles
            .map((role: any) => {
              const fullRole = roles.find((r: any) => r.id === role.id) as any;
              return {
                id: role.id,
                name: formatRoleDisplayName(role.name, tenantKeyForRoleDisplay),
                description: fullRole?.description || "",
                badge: fullRole?.isDefault ? undefined : t("Custom"),
                isDefault: !!fullRole?.isDefault,
                // Already assigned to this user: shown down-scaled and
                // non-clickable rather than removed from the list.
                disabled: assignedRoleIds.has(role.id),
              };
            })
            // Built-in roles (isDefault: true) sort to the bottom; custom roles first.
            .sort((a, b) => Number(a.isDefault) - Number(b.isDefault));

        return (
          <div className="d-flex flex-wrap align-items-center col-12">
            {cell.map((item: any, i: number) => (
              <div
                key={i}
                className="role-badge user-roles"
              >
                <OverlayTrigger
                  placement="bottom"
                  container={document.body}
                  overlay={
                    !KEYCLOAK_ENABLE_CLIENT_AUTH ? (
                      <Tooltip id="tooltip">{item?.path}</Tooltip>
                    ) : (
                      <></>
                    )
                  }
                >
                  <span className="d-flex align-items-center">
                    <span className="role-name-text">
                      {formatRoleDisplayName(item?.name, tenantKeyForRoleDisplay)}
                    </span>
                    {canRemoveRole(rowData, item) && (
                      <i
                        className="fa-solid fa-xmark chip-close ms-2"
                        aria-label={t("Remove role")}
                        data-testid="user-role-remove-icon"
                        onClick={() =>
                          setRoleRemoveCandidate({ rowData, item })
                        }
                      ></i>
                    )}
                  </span>
                </OverlayTrigger>
              </div>
            ))}
              <AddWithDropdown
                options={availableRoleDropdownOptions}
                onSelect={addSingleUserRole}
                ariaLabel={t("Add role")}
                emptyMessage={t("No roles found")}
                dataTestId={`user-role-add-${rowData.id}`}
              />
          </div>
        );
      },
    },

    {
      field: "status",
      headerName: t("Status"),
      preset: "status",
      ...getColumnPresetSizing("status"),
      sortable: false,
      renderCell: (params: any) => {
        const rowData = params.row;
        const { label, className } = getStatusDisplay(rowData?.status);
        return (
          <div>
            <span className={className}>{t(label)}</span>
          </div>
        );
      },
    },

    {
      field: "id",
      headerName: t(""),
      preset: "actions",
      ...getColumnPresetSizing("actions"),
      sortable: false,
      headerAlign: "right",
      align: "right",
      renderCell: (params) => {
        const rowData = params.row;
        const isUserSuspended =
          getStatusDisplay(rowData?.status).label === "Suspended";
        const isLoggedInUserRow =
          !!currentUserId && rowData?.id === currentUserId;
        const isOwnerUser = rowData?.isPrimaryOwner || rowData?.isOwner;

        // const addUserPermission = () => {
        //   const promises = [];
        //   for (let role of selectedRoles) {
        //     let user_id = selectedRow.id;
        //     let payload = {
        //       userId: user_id,
        //       groupId: role,
        //       name: roleNameMapper[role],
        //     };
        //     const promise = AddUserRole(user_id, role, payload);
        //     promises.push(promise);
        //   }
        //   Promise.all(promises)
        //     .then((res) => {
        //       props.setInvalidated(true);
        //       toast.success(t("Permission updated successfully!"));
        //     })
        //     .catch((err) => {
        //       toast.error(t("Failed to update permission!"));
        //       // The toast is generic; keep the raw error visible for support.
        //       console.error(err);
        //     });
        // };

        if (isLoggedInUserRow || isOwnerUser) {
          return null;
        }

        return (
          isUserSuspended ? (
            <V8CustomButton
              className="custom-button-table"
              label={t("Reactivate")}
              onClick={() => openStatusUpdateModal(rowData)}
              data-testid="reactivate-user-button"
              variant="secondary"
              size="small"
            />
          ) : (
            <V8CustomButton
              className="custom-button-table"
              label={t("Suspend")}
              onClick={() => openStatusUpdateModal(rowData)}
              data-testid="suspend-user-button"
              variant="secondary"
              size="small"
            />
          )
        );
      },
    },
  ];

  const clearForm = () => {
    setFormData({ user: "" });
  };

  const openInviteModal = () => {
    setValidationError("");
    setInviteSuccessEmail(null);
    setShowInviteModal(true);
  };
  const closeInviteModal = () => {
    setInviteLoading(false);
    clearForm();
    setInviteSuccessEmail(null);
    setShowInviteModal(false);
  };
  const isValidEmail = (value: string): boolean => {
    const trimmed = value?.trim() || "";
    // RFC 5321 max length - prevents ReDoS from long input
    if (trimmed.length === 0 || trimmed.length > 254) return false;
    // Use safe regex without backtracking-vulnerable patterns
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  };

  const sendInvites = () => {
    setValidationError("");
    const emailFromInput =
      emailInputRef.current?.value?.trim() ?? formData.user?.trim() ?? "";
    if (!isValidEmail(emailFromInput)) {
      setValidationError(t("Invalid email"));
      return;
    }
    setInviteLoading(true);
    const tenantKey = tenantId || StorageService.get("tenantKey") || "default";
    InviteUser(
      tenantKey,
      emailFromInput,
      (data) => {
        setInviteLoading(false);
        setValidationError("");
        setInviteSuccessEmail(emailFromInput);
        setFormData({ user: "" });
        props.setInvalidated(true);
        completeChecklistByRouteKey("invite_user")();
      },
      (err) => {
        setInviteLoading(false);
        setValidationError(err || t("Failed to send invitation!"));
      }
    );
  };

  // Custom roles (isDefault: false) listed first with a "Custom" badge,
  // built-in roles at the bottom - same tiering already used for
  // availableRoleDropdownOptions above. The first/last badged row's border
  // (bracketing the custom-role group) is applied purely via CSS in
  // users.scss, keyed off the presence of the badge - no index bookkeeping
  // needed here.
  const roleFilterOptions = [
    { value: "ALL", label: t("All Roles") },
    ...[...(roles ?? [])]
      .sort((a: any, b: any) => Number(!!a?.isDefault) - Number(!!b?.isDefault))
      .map((role: any) => ({
        value: role.name,
        label: formatRoleDisplayName(role.name, tenantKeyForRoleDisplay),
        listIcon: !role.isDefault ? (
          <span className="users-role-filter-badge">{t("Custom")}</span>
        ) : undefined,
      })),
  ];

  return (
    <>
      <AppModal
        show={showSuccessModal}
        onHide={closeSuccessModal}
        className="overflow-hidden"
      >
        <AppModal.Header>
          <AppModal.Title></AppModal.Title>
          <div
            className="icon-close"
            onClick={closeSuccessModal}
            data-testid="user-add-success-close"
            aria-label={t("Close")}
          >
            <CloseIcon dataTestId="action-success-modal-close" />
          </div>
        </AppModal.Header>
        <AppModal.Body className="modal-md d-flex align-items-center justify-content-center">
          <div className="p-3 text-center">
            <div className="d-flex flex-column align-items-center">
              <div className="mb-2">
                <i className="fa fa-check-circle fa-3x success"></i>
              </div>
              <div className="mb-2 fw-bold">{t("Success")}</div>
              <p>{t("User added")}</p>
            </div>
          </div>
        </AppModal.Body>
      </AppModal>

      <div className="container-admin">
        <div className="col-lg-4 col-xl-4 col-md-4 col-sm-6 col-12 px-0 mb-3">
            <CustomSearch
              search={searchKey}
              setSearch={setSearchKey}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
              searchLoading={loading}
              placeholder={t("Search by name, username, or email")}
              title={t("Search...")}
              dataTestId="search-users-input"
            />
        </div>
        <hr/>

          {MULTITENANCY_ENABLED && (
            <>
              {showInviteModal && (
                <AppModal
                  show={showInviteModal}
                  onHide={closeInviteModal}
                  dialogClassName="add-user-modal"
                  centered
                >
                  <AppModal.Header className="add-user-modal__header">
                    <AppModal.Title className="add-user-modal__title">
                      {t("Add New Users")}
                    </AppModal.Title>
                    <button
                      type="button"
                      className="add-user-modal__close"
                      onClick={closeInviteModal}
                      data-testid="role-modal-close"
                      aria-label={t("Close")}
                    >
                      <CloseIcon
                        color="var(--gray-darkest)"
                        dataTestId="action-modal-close"
                      />
                    </button>
                  </AppModal.Header>

                  <AppModal.Body className="add-user-modal__body">
                    <div className="add-user-modal__field">
                      <label
                        htmlFor="add-user-username-input"
                        className="add-user-modal__label"
                      >
                        {t("Email")}
                      </label>
                      <div className="add-user-modal__input-wrapper">
                        <CustomTextInput
                          ref={emailInputRef}
                          value={formData.user}
                          setValue={(value) => {
                            setFormData({ ...formData, user: value });
                            if (validationError) setValidationError("");
                          }}
                          dataTestId="add-user-username"
                          ariaLabel={t("Username or Email")}
                        />
                      </div>
                      <div className="add-user-modal__error-slot">
                        {validationError && (
                          <p
                            className="add-user-modal__email-error"
                            role="alert"
                          >
                            {validationError}
                          </p>
                        )}
                      </div>
                      <p className="add-user-modal__hint">
                        {t(
                          "Added users will receive an email invite to join your organization."
                        )}
                      </p>
                      {inviteSuccessEmail && (
                        <div className="add-user-modal__success-note">
                          {t("Invitation sent to {{email}}", {
                            email:
                              inviteSuccessEmail.length > 30
                                ? `${inviteSuccessEmail.substring(0, 30)}...`
                                : inviteSuccessEmail,
                          })}
                        </div>
                      )}
                    </div>
                  </AppModal.Body>

                  <AppModal.Footer className="add-user-modal__footer">
                    <V8CustomButton
                      label={t("Invite")}
                      onClick={sendInvites}
                      data-testid="add-user-button"
                      variant="secondary"
                      size="small"
                      loading={inviteLoading}
                      loadingText={t("Inviting")}
                    disabled={!formData.user?.trim()}
                    
                    />
                  </AppModal.Footer>
                </AppModal>
              )}
            </>
          )}
        <div className="user-filter-container col-lg-3 col-xl-3 col-md-3 col-sm-6 col-12">
          <SelectDropdown
            options={roleFilterOptions}
            value={props.filter || "ALL"}
            onChange={handleSelectFilter}
            variant="secondary"
            width="15.375rem"
            ariaLabel={t("Filter here")}
            id="users-roles-filter-select"
            dataTestId="users-roles-filter-select"
            dropdownMaxHeight="16.125rem"
            dropdownItemClassName="users-role-filter-items"
          />
        </div>
        <hr/>
        {!loading ? (
          <div>
            <div
              className="user-table-container"
              data-testid="admin-users-table"
            >
              <ReusableTable
                columns={columns}
                rows={props?.users || []}
                rowCount={props.total}
                loading={loading}
                getRowId={(row) => row.id}
                sortModel={DEFAULT_SORT_MODEL}
                paginationMode="server"
                sortingMode="client"
                disableColumnMenu
                disableRowSelectionOnClick
                emptyStateMessage={props.error || t("No data Found")}
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
          </div>
        ) : (
          <Loading />
        )}
      </div>
      {roleRemoveCandidate && (
        <ConfirmModal
          show={!!roleRemoveCandidate}
          title={t("Remove Role?")}
          message={t(
            "Are you sure you want to remove this role from the user? This action will revoke the permissions associated with this role."
          )}
          primaryBtnAction={closeRoleRemoveConfirmation}
          onClose={closeRoleRemoveConfirmation}
          primaryBtnText={t("No, Keep This Role")}
          secondaryBtnText={t("Yes, Delete This Role")}
          secondaryBtnAction={confirmRoleRemove}
          primaryBtndataTestid="keep-user-role-button"
          secondoryBtndataTestid="confirm-remove-user-role-button"
        />
      )}

      {statusUpdateConfirmation && (
        <ConfirmModal
          show={statusUpdateConfirmation}
          title={
            getStatusDisplay(updateRow?.status).label === "Suspended"
              ? t("Activate this user?")
              : t("Suspend this user?")
          }
          message={
            getStatusDisplay(updateRow?.status).label === "Suspended"
              ? t("Are you sure you want to activate this user?")
              : t("Are you sure you want to suspend this user?")
          }
          onClose={() => setStatusUpdateConfirmation(false)}
          primaryBtnText={
            getStatusDisplay(updateRow?.status).label === "Suspended"
              ? t("Activate User")
              : t("Suspend User")
          }
          primaryBtnAction={() => {
            userStatusUpdate(
              getStatusDisplay(updateRow?.status).label === "Suspended"
            );
            setStatusUpdateConfirmation(false);
          }}
          primaryBtndataTestid="confirm-status-update-button"
          secondaryBtnText={t("Cancel")}
          secondaryBtnAction={() => setStatusUpdateConfirmation(false)}
          secondoryBtndataTestid="cancel-status-update-button"
        />
      )}
    </>
  );
});

export default Users;
