function getEnv(env_string) {
  let ENV_BOOLEAN =
      (window._env_ && window._env_["REACT_APP_ENABLE_APPLICATION_ACCESS_PERMISSION_CHECK"]) ||
      false;

      return ENV_BOOLEAN === "true" || ENV_BOOLEAN === true;
}

let userAccessGroupCheckforApplications =getEnv('REACT_APP_ENABLE_APPLICATION_ACCESS_PERMISSION_CHECK');

export const trimFirstSlash = (inputString) => {
  if (inputString?.startsWith('/')) {
    return inputString.substring(1);
  }
  return inputString;
};


export const removeTenantKey = (value, tenantkey) => {
  const tenantKeyCheck = value.match(`${tenantkey}-`);
  if (
    tenantKeyCheck &&
    tenantKeyCheck[0].toLowerCase() === `${tenantkey.toLowerCase()}-`
  ) {
    return value.replace(`${tenantkey.toLowerCase()}-`, "");
  } else {
    return false;
  }
};

export const replaceUrl = (URL, key, value) => {
  return URL.replace(key, value);
};

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

export const textTruncate = (wordLength, targetLength, text) => {
  return text?.length > wordLength
    ? text.substring(0, targetLength) + "..."
    : text;
};

