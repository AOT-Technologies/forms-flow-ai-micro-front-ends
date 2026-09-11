import React, { useState, useEffect, useMemo } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminDashboard from "../dashboard";
import RoleManagement from "../roles";
import UserManagement from "../users";
import Organization from "../organization";
import StyleTab from "../style/StyleTab";
import "../style/style.scss";
import { StorageService } from "@formsflow/service";
import { BreadCrumbs, V8CustomButton } from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../../constants";

interface ManageProps {
  props: any;
  setTab: (tab: string) => void;
  setDashboardCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setRoleCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setUserCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const Manage: React.FC<ManageProps> = ({
  props,
  setTab,
  setDashboardCount,
  setRoleCount,
  setUserCount,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId: urlTenantId, tab: urlTab } = useParams<{
    tenantId?: string;
    tab?: string;
  }>();
  // Fallback to storage if tenantId is not in URL params
  const tenantId = urlTenantId || StorageService.get("tenantKey") || "";
  const location = useLocation();
  const [roleCreateTrigger, setRoleCreateTrigger] = useState(0);
  const [userCreateTrigger, setUserCreateTrigger] = useState(0);

  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) || "[]"
  );

  const isDashboardManager = userRoles?.includes(
    "manage_dashboard_authorizations"
  );
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");
  const isOrganizationManager = userRoles?.includes("manage_organization");
  // Style is a tenant-wide admin feature, not an Organization-only one --
  // any manage-capable admin can open it (the owner-only branding-logo
  // control inside it is gated separately, see StyleTab's isOwner prop).
  const canAccessStyle =
    isOrganizationManager || isDashboardManager || isUserManager || isRoleManager;
  // Mirrors the backend's is_current_user_primary_owner: "owner" (via
  // manage_organization, granted only to the {tenant}-owner group) is a
  // multi-tenant SaaS concept with no equivalent in single-tenant -- there,
  // any admin who can reach this screen is treated as the owner.
  const isOwner = !MULTITENANCY_ENABLED || isOrganizationManager;

  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";

  const defaultTab = (): string => {
    if (isRoleManager) return "roles";
    if (isUserManager) return "users";
    if (isDashboardManager) return "dashboard";
    if (isOrganizationManager) return "organization";
    return "roles";
  };

  // Get active tab from URL or default to first accessible tab
  const activeTab = useMemo((): string => {
    if (urlTab) {
      const validTabs = ["organization", "dashboard", "users", "roles", "style"];
      if (validTabs.includes(urlTab)) {
        if (urlTab === "organization" && !isOrganizationManager)
          return defaultTab();
        if (urlTab === "dashboard" && !isDashboardManager) return defaultTab();
        if (urlTab === "users" && !isUserManager) return defaultTab();
        if (urlTab === "roles" && !isRoleManager) return defaultTab();
        if (urlTab === "style" && !canAccessStyle) return defaultTab();
        return urlTab;
      }
    }
    if (
      location.pathname === `${baseUrl}admin` ||
      location.pathname === `${baseUrl}admin/`
    ) {
      return defaultTab();
    }
    return defaultTab();
  }, [
    urlTab,
    location.pathname,
    baseUrl,
    isOrganizationManager,
    isDashboardManager,
    isUserManager,
    isRoleManager,
    canAccessStyle,
  ]);

  // Redirect to default tab if on /admin without a tab
  useEffect(() => {
    if (
      location.pathname === `${baseUrl}admin` ||
      location.pathname === `${baseUrl}admin/`
    ) {
      navigate(`${baseUrl}admin/${defaultTab()}`, { replace: true });
    }
  }, [location.pathname, baseUrl, navigate]);

  const handleTabChange = (key: string | null) => {
    if (key) {
      const tabNameMap: { [key: string]: string } = {
        organization: "Organization",
        dashboard: "Dashboard",
        users: "Users",
        roles: "Roles",
        style: "Style",
      };
      setTab(tabNameMap[key] || "Organization");
      // Navigate to the tab route - this will update the URL and activeTab will update via useMemo
      navigate(`${baseUrl}admin/${key}`);
    }
  };

  const breadcrumbItems = [{ label: t("Manage"), id: "manage" }];

  return (
    <div className="manage-container">
      <div className="header-section-1">
        <div className="section-seperation-left">
          <BreadCrumbs
            items={breadcrumbItems}
            variant="default"
            dataTestId="manage-breadcrumbs"
          />
        </div>
      </div>

      <div className="manage-tabs-wrapper">
        <div className="manage-tabs-header">
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            id="manage-tabs"
            className="pill-tabs"
          >
            {isOrganizationManager && (
              <Tab eventKey="organization" title={t("Organization")} />
            )}
            {isDashboardManager && (
              <Tab eventKey="dashboard" title={t("Dashboards")} />
            )}
            {isUserManager && <Tab eventKey="users" title={t("Users")} />}
            {isRoleManager && <Tab eventKey="roles" title={t("Roles")} />}
            {canAccessStyle && (
              <Tab eventKey="style" title={t("Style")} />
            )}
          </Tabs>

          {activeTab === "roles" && isRoleManager && (
            <div className="manage-tabs-action">
              <V8CustomButton
                onClick={() => setRoleCreateTrigger((prev) => prev + 1)}
                data-testid="roles-create-new-role-button"
                label={t("Add New Role")}
                ariaLabel={t("Add New Role")}
                action
              />
            </div>
          )}

          {activeTab === "users" && isUserManager && MULTITENANCY_ENABLED && (
            <div className="manage-tabs-action">
              <V8CustomButton
                onClick={() => setUserCreateTrigger((prev) => prev + 1)}
                data-testid="add-registered-users-button"
                label={t("Add New Users")}
                ariaLabel={t("Add New Users")}
                // The invite modal it opens only renders in multitenant mode.
                disabled={!MULTITENANCY_ENABLED}
                action
                variant="primary"
                action
              />
            </div>
          )}
        </div>

        <div>
          <div className="tab-content">
            {activeTab === "organization" && isOrganizationManager && (
              <div className="manage-content">
                <Organization {...props} />
              </div>
            )}
            {activeTab === "dashboard" && isDashboardManager && (
              <div className="manage-content">
                <AdminDashboard
                  {...props}
                  setTab={setTab}
                  setCount={setDashboardCount}
                />
              </div>
            )}
            {activeTab === "users" && isUserManager && (
              <div className="manage-content">
                <UserManagement
                  {...props}
                  setTab={setTab}
                  setCount={setUserCount}
                  openInviteTrigger={userCreateTrigger}
                />
              </div>
            )}
            {activeTab === "roles" && isRoleManager && (
              <div className="manage-content">
                <RoleManagement
                  {...props}
                  setTab={setTab}
                  setCount={setRoleCount}
                  tenantId={tenantId}
                  openCreateRoleTrigger={roleCreateTrigger}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Manage;
