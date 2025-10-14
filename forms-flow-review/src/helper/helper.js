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

export const removeTenantKey = (value, tenantkey, multitenancyEnabled) => {
  // Match optional leading slash, then tenantkey (case-insensitive), then hyphen
  const regex = new RegExp(`^/?${tenantkey}-`, 'i');

  if (multitenancyEnabled && regex.test(value)) {
    return value.replace(regex, '');
  } 
  else{
    return value;
  }
};


export const addTenantPrefixIfNeeded = (value, tenantKey, multitenancyEnabled) => {
  if (!value) return value;

  const hasTenantPrefix = value.startsWith(`${tenantKey}-`);

  return multitenancyEnabled
    ? hasTenantPrefix
      ? value
      : `${tenantKey}-${value}`
    : value;
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

