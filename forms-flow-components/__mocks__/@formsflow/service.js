// Real i18next instance: src/resourceBundles/i18n.js calls
// i18nService.use(...).use(initReactI18next).init(...) at import time, so the
// mock must be a genuine chainable instance for any suite importing Button.tsx
// (16 suites crashed on i18nService being undefined before this).
import i18n from "i18next";

export const i18nService = i18n;

export const HelperServices = {
  getLocalDateAndTime: () => {},
};

export const StyleServices = {
  getCSSVariable: (variableName) => {
    // Get CSS variable from document root
    if (
      typeof globalThis.window !== "undefined" &&
      typeof document !== "undefined"
    ) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
    }
    return "";
  },
};

export const StorageService = {
  get: (key) => null,
  save: (key, value) => {},
  User: {
    USER_ROLE: "UserRoles",
    USER_DETAILS: "UserDetails",
  },
};
