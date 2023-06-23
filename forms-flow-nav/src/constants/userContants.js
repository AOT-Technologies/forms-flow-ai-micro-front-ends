//TODO make it dynamic from env
/* istanbul ignore file */
import { GROUPS } from "./groupConstants";
export const REVIEWER_GROUP = "formsflow/formsflow-reviewer";

/****
 * Default value of REACT_APP_ENABLE_APPLICATION_ACCESS_PERMISSION_CHECK is false
 * This is to check if the Application tab is to be shown with respect to group info or not
 *
 * Currently added groups for the purpose are applicationsAccess:
 * ["/formsflow/formsflow-reviewer/access-allow-applications",
 * "/formsflow/formsflow-client/access-allow-applications"]
 *  ****/
//TODO Make this function Common
function getEnv(env_string) {
  let ENV_BOOLEAN =
      (window._env_ && window._env_["REACT_APP_ENABLE_APPLICATION_ACCESS_PERMISSION_CHECK"]) ||
      process.env[env_string] ||
      false;

  return ENV_BOOLEAN === "true" || ENV_BOOLEAN === true
      ? true
      : false;
}

let userAccessGroupCheckforApplications =getEnv('REACT_APP_ENABLE_APPLICATION_ACCESS_PERMISSION_CHECK');

export const setShowApplications = (userGroups) => {
  if (!userAccessGroupCheckforApplications) {
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
