import { MULTITENANCY_ENABLED } from "../constants";

/** Strip only /<tenant_key>- from start of value (case-insensitive). */
function stripTenantPrefix(value, tenantId) {
  if (!value || !tenantId) return value;
  const escaped = String(tenantId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^/${escaped}-`, "i");
  return String(value).replace(re, "");
}

export const removingTenantId = (roles=[], tenantId, tenantIdInPath = false) => {
  if (MULTITENANCY_ENABLED && tenantId) {
    const escaped = String(tenantId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reWithSlash = new RegExp(`^/${escaped}-`, "i");
    const updatedRoles = roles.map((role) => {
      const nameOrPath = role[tenantIdInPath ? "path" : "name"];
      const str = String(nameOrPath ?? "");
      if (reWithSlash.test(str)) {
        if (tenantIdInPath) {
          return {
            ...role,
            name: stripTenantPrefix(role.name, tenantId),
            path: role.path.replace(reWithSlash, "/"),
          };
        }
        return {
          ...role,
          name: stripTenantPrefix(role.name, tenantId),
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

/**
 * Role label for UI: last `/` segment, then strip leading `{tenantKey}-` when multitenant
 * (e.g. `lukvv-client` → `client`).
 */
export const formatRoleDisplayName = (name, tenantKey) => {
  if (name == null || name === "") return "";
  let s = String(name).trim();
  const slash = s.lastIndexOf("/");
  if (slash >= 0) {
    s = s.slice(slash + 1).trim();
  }
  if (MULTITENANCY_ENABLED && tenantKey) {
    const prefix = `${String(tenantKey)}-`;
    if (
      s.length >= prefix.length &&
      s.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase()
    ) {
      s = s.slice(prefix.length);
    }
  }
  return s;
};