import {
  STAFF_REVIEWER,
  STAFF_DESIGNER,
  ADMIN_ROLE,
} from "../constants/constants";

/****
 * Default value of REACT_APP_USER_ACCESS_PERMISSIONS is
 *  {accessAllowApplications:false, accessAllowSubmissions:false}
 * This is to check if the view Submissions/view Application is to be shown with respect to group info or not
 *
 * Currently added groups for the purpose are applicationsAccess:
 * ["/formsflow/formsflow-reviewer/access-allow-applications",
 * "/formsflow/formsflow-client/access-allow-applications"],
 viewSubmissionsAccess:["/formsflow/formsflow-reviewer/access-allow-submissions"]
 *  ****/
export const defaultUserAccessGroupCheck = {
  accessAllowApplications: false,
  accessAllowSubmissions: false,
};
let userAccessGroupCheck =
  (window._env_ && window._env_.REACT_APP_USER_ACCESS_PERMISSIONS) ||
  defaultUserAccessGroupCheck;

if (typeof userAccessGroupCheck === "string") {
  userAccessGroupCheck = JSON.parse(userAccessGroupCheck);
}

const getUserRoleName = (userRoles) => {
  let role = "";
  if (userRoles.includes(ADMIN_ROLE)) {
    role = "ADMIN";
  } else if (userRoles.includes(STAFF_REVIEWER)) {
    role = "REVIEWER";
  } else if (userRoles.includes(STAFF_DESIGNER)) {
    role = "DESIGNER";
  } else {
    role = "CLIENT";
  }
  return role;
};

const getUserRolePermission = (userRoles, role) => {
  return userRoles && userRoles.includes(role);
};

export { getUserRoleName, getUserRolePermission };
