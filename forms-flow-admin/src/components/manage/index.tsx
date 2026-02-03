import React, { useState, useEffect, useMemo } from "react";
import { Tabs, Tab, Collapse } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useHistory, useParams, useLocation } from "react-router-dom";
import AdminDashboard from "../dashboard";
import RoleManagement from "../roles";
import UserManagement from "../users";
import Organization from "../organization";
import { StorageService } from "@formsflow/service";
import { BreadCrumbs, UpArrowIcon, DownArrowIcon } from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../../constants";

interface ManageProps {
  props: any;
  setTab: (tab: string) => void;
  setDashboardCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setRoleCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setUserCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const Manage: React.FC<ManageProps> = ({ props, setTab, setDashboardCount, setRoleCount, setUserCount }) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { tenantId, tab: urlTab } = useParams<{ tenantId?: string; tab?: string }>();
  const location = useLocation();
  const [tabContentExpanded, setTabContentExpanded] = useState<boolean>(true);
  
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) || "[]"
  );
  
  const isDashboardManager = userRoles?.includes("manage_dashboard_authorizations");
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");

  const baseUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantId}/` : "/";
  
  // Get active tab from URL or default to organization
  const activeTab = useMemo((): string => {
    if (urlTab) {
      // Validate that the tab from URL is valid
      const validTabs = ["organization", "dashboard", "users", "roles"];
      if (validTabs.includes(urlTab)) {
        // Check permissions for restricted tabs
        if (urlTab === "dashboard" && !isDashboardManager) return "organization";
        if (urlTab === "users" && !isUserManager) return "organization";
        if (urlTab === "roles" && !isRoleManager) return "organization";
        return urlTab;
      }
    }
    // If no tab in URL or invalid tab, check if we're at /admin (without tab)
    if (location.pathname === `${baseUrl}admin` || location.pathname === `${baseUrl}admin/`) {
      return "organization";
    }
    return "organization";
  }, [urlTab, location.pathname, baseUrl, isDashboardManager, isUserManager, isRoleManager]);

  // Redirect to default tab if on /admin without a tab
  useEffect(() => {
    if (location.pathname === `${baseUrl}admin` || location.pathname === `${baseUrl}admin/`) {
      history.replace(`${baseUrl}admin/organization`);
    }
  }, [location.pathname, baseUrl, history]);

  const handleTabChange = (key: string | null) => {
    if (key) {
      const tabNameMap: { [key: string]: string } = {
        "organization": "Organization",
        "dashboard": "Dashboard",
        "users": "Users",
        "roles": "Roles"
      };
      setTab(tabNameMap[key] || "Organization");
      // Navigate to the tab route - this will update the URL and activeTab will update via useMemo
      history.push(`${baseUrl}admin/${key}`);
    }
  };

  const handleTabContentToggle = () => {
    setTabContentExpanded(!tabContentExpanded);
  };
    
  const breadcrumbItems = [
    { label: t("Manage"), id: "manage" }
  ];

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
            <Tab eventKey="organization" title={t("Organization")} />
            {isDashboardManager && (
              <Tab eventKey="dashboard" title={t("Dashboards")} />
            )}
            {isUserManager && (
              <Tab eventKey="users" title={t("Users")} />
            )}
            {isRoleManager && (
              <Tab eventKey="roles" title={t("Roles")} />
            )}
          </Tabs>
          <div 
            className="manage-tabs-chevron"
            onClick={handleTabContentToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTabContentToggle();
              }
            }}
          >
            {tabContentExpanded ? (
              <UpArrowIcon className="svgIcon-medium-dark" />
            ) : (
              <DownArrowIcon className="svgIcon-medium-dark" />
            )}
          </div>
        </div>
        <Collapse in={tabContentExpanded}>
          <div>
            <div className="tab-content">
              {activeTab === "organization" && (
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
                  />
                </div>
              )}
              {activeTab === "roles" && isRoleManager && (
                <div className="manage-content">
                  <RoleManagement
                    {...props}
                    setTab={setTab}
                    setCount={setRoleCount}
                  />
                </div>
              )}
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

export default Manage;
