import { MULTITENANCY_ENABLED } from "../constants";

export const removingTenantId = (roles=[], tenantId, tenantIdInPath = false) => {
  if (MULTITENANCY_ENABLED && tenantId) {
    const updatedRoles = roles.map((role) => {
      if (role[tenantIdInPath ? "path" : "name"].startsWith(`/${tenantId}-`)) {
        if (tenantIdInPath) {
          return {
            ...role,
            name: role.name.replace(`${tenantId}-`, ""),
            path: role.path.replace(`/${tenantId}-`, "/"),
          };
        }
        return {
          ...role,
          name: role.name.replace(`/${tenantId}-`, "/"),
        };
      }
      return role;
    });
    return updatedRoles;
  }
  return roles;
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