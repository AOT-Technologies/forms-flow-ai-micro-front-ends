import React, { useState, useEffect } from "react";
import { Tabs, Tab, Collapse } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AdminDashboard from "../dashboard";
import RoleManagement from "../roles";
import UserManagement from "../users";
import Organization from "../organization";
import { StorageService } from "@formsflow/service";
import { BreadCrumbs, UpArrowIcon, DownArrowIcon } from "@formsflow/components";

interface ManageProps {
  props: any;
  setTab: (tab: string) => void;
  setDashboardCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setRoleCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
  setUserCount?: React.Dispatch<React.SetStateAction<number | undefined>>;
}

const Manage: React.FC<ManageProps> = ({ props, setTab, setDashboardCount, setRoleCount, setUserCount }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("organization");
  const [tabContentExpanded, setTabContentExpanded] = useState<boolean>(true);
  
  const userRoles = JSON.parse(
    StorageService.get(StorageService.User.USER_ROLE) || "[]"
  );
  
  const isDashboardManager = userRoles?.includes("manage_dashboard_authorizations");
  const isRoleManager = userRoles?.includes("manage_roles");
  const isUserManager = userRoles?.includes("manage_users");

  // Determine initial tab based on permissions - default to organization
  useEffect(() => {
    setActiveTab("organization");
  }, []);

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
      const tabNameMap: { [key: string]: string } = {
        "organization": "Organization",
        "dashboard": "Dashboard",
        "users": "Users",
        "roles": "Roles"
      };
      setTab(tabNameMap[key] || "Organization");
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
