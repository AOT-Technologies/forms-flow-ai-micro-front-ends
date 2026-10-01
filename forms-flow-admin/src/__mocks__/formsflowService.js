// Test-only manual mock for the "@formsflow/service" webpack external.
// The real module is provided at runtime by the root-config import map and is
// not installed in node_modules, so jest resolves it here (see
// jest.config.js moduleNameMapper). Only the members consumed inside
// forms-flow-admin are stubbed.
const noop = () => {};

export const StorageService = {
  get: () => null,
  save: noop,
  delete: noop,
  clear: noop,
  User: {
    USER_ROLE: "USER_ROLE",
    USER_DETAILS: "USER_DETAILS",
    AUTH_TOKEN: "AUTH_TOKEN",
  },
};

export const KeycloakService = {
  getInstance: () => ({
    initKeycloak: noop,
    isAuthenticated: () => false,
    userLogout: noop,
  }),
};

export const RequestService = {
  httpGETRequest: () => Promise.resolve({ data: {} }),
  httpPOSTRequest: () => Promise.resolve({ data: {} }),
  httpPUTRequest: () => Promise.resolve({ data: {} }),
  httpDELETERequest: () => Promise.resolve({ data: {} }),
};

// Chainable shim matching the i18next plugin API used by
// src/resourceBundles/i18n.js (use(...).use(...).init(...)).
export const i18nService = {
  use() {
    return this;
  },
  init: noop,
  changeLanguage: noop,
  t: (key) => key,
  language: "en",
};

export const navigateToBaseUrl = noop;

export const getRedirectUrl = () => "/";

// users.tsx calls completeChecklistByRouteKey("invite_user")(), so the
// wrapper in src/services/checklist expects this to return a function.
export const completeChecklistByRouteKey = () => () => {};
