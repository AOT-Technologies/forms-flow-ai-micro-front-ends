const replaceUrl = (URL, key, value) => {
  return URL.replace(key, value);
};

const addTenankey = (value, tenankey) => {
  let newValue = value.split("-");
  let tenantId = newValue.shift();
  if (tenankey.toLowerCase() === tenantId.toLowerCase()) {
    return value.toLowerCase();
  } else {
    return `${tenankey.toLowerCase()}-${value.toLowerCase()}`;
  }
};

const removeTenantKey = (value, tenankey) => {
  let newValue = value.split("-");
  let tenantId = newValue.shift();
  if (tenankey.toLowerCase() === tenantId.toLowerCase()) {
    return newValue.join("-");
  } else {
    return false;
  }
};

const checkAndAddTenantKey = (value, tenankey) => {
  let newValue = value.split("-");
  let tenantId = newValue.shift();
  if (tenankey.toLowerCase() === tenantId.toLowerCase()) {
    return value;
  } else {
    return `${tenankey.toLowerCase()}-${value.toLowerCase()}`;
  }
};

const getUserPermissionsByCategory = (userRoles, allPermissions) => {
  if (!Array.isArray(userRoles) || !Array.isArray(allPermissions)) {
    return {};
  }

  const seenPermissions = new Set();
  const grouped = {};
  const userRolesSet = new Set(userRoles);

  for (const permission of allPermissions) {
    const permissionName = permission?.name;
    
    if (!permissionName || !userRolesSet.has(permissionName)) {
      continue;
    }

    if (seenPermissions.has(permissionName)) {
      continue;
    }

    seenPermissions.add(permissionName);
    const category = permission?.category || "Other";

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(permission);
  }

  // Sort permissions within each category by order
  for (const category in grouped) {
    grouped[category].sort((a, b) => {
      const orderA = a?.order ?? 0;
      const orderB = b?.order ?? 0;
      return orderA - orderB;
    });
  }

  return grouped;
};

export { replaceUrl, addTenankey, removeTenantKey, checkAndAddTenantKey, getUserPermissionsByCategory };
