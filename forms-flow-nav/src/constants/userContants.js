//TODO make it dynamic from env
/* istanbul ignore file */
import { GROUPS } from "./groupConstants";
export const REVIEWER_GROUP = "formsflow/formsflow-reviewer";

export const defaultUserAccessGroupCheck = {
  accessAllowApplications: false,
  accessAllowSubmissions: false,
};
let userAccessGroupCheck =
  (window._env_ && window._env_.REACT_APP_USER_ACCESS_PERMISSIONS) ||
  defaultUserAccessGroupCheck;

export const setShowApplications = (userGroups) => {
  if (!userAccessGroupCheck.accessAllowApplications) {
    return true;
  } else if (userGroups?.length) {
    const applicationAccess = GROUPS.applicationsAccess.some((group) =>
      userGroups.includes(group)
    );
    return applicationAccess;
  } else {
    return false;
  }
};
