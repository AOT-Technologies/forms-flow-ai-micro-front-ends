import {
  ConnectivityService,
  OfflineSettingsService,
} from "@formsflow/service";

// "Not available offline" (FFF-3 offline forms). Offline, only the Submit
// pages work; every other page needs the server. The nav is on every page, so
// it covers the rest with one plain page instead of each app failing in its
// own way (a blank page, an endless loader, a crash).
//
// Offline means EITHER the connection is gone, OR the user turned "Offline
// mode" on (formsflow-web keeps it in localStorage). Only while offline
// support is on: the env key and the organization's "Offline forms" switch.

const MANUAL_KEY = "ff_offline_mode";
// formsflow-web sends this when the Offline mode switch changes in this tab
// (a storage event only reaches other tabs).
export const OFFLINE_MODE_EVENT = "ff-offline-mode-change";

// Same env key as formsflow-web (REACT_APP_OFFLINE_ENABLED).
const offlineEnabled = () => {
  const value = window._env_ && window._env_.REACT_APP_OFFLINE_ENABLED;
  return value === "true" || value === true;
};

// The pages that work offline, after the tenant prefix: the Submit forms
// list (Forms and Offline tabs), a form, its entries, a refused submission
// (Figma DEV 6.3), a bundle and its entries. "/" only redirects.
const ALLOWED = [
  /^\/?$/,
  /^\/form\/?$/,
  /^\/form\/[^/]+\/?$/,
  /^\/form\/[^/]+\/entries\/?$/,
  /^\/form\/[^/]+\/offline\/[^/]+\/?$/,
  /^\/bundle\/[^/]+\/?$/,
  /^\/bundle\/[^/]+\/entries\/?$/,
];

const TENANT_PREFIX = /^\/tenant\/[^/]+/;

/** "/tenant/acme/" or "/": where the app's pages start. */
export const baseOf = (pathname = "") => {
  const match = pathname.match(TENANT_PREFIX);
  return match ? `${match[0]}/` : "/";
};

/** Does this page work offline? */
export const isAllowedOffline = (pathname = "") => {
  const path = pathname.replace(TENANT_PREFIX, "") || "/";
  return ALLOWED.some((rule) => rule.test(path));
};

const isOfflineAllowed = () =>
  offlineEnabled() && OfflineSettingsService?.isOfflineAllowed?.() === true;

const isManualOffline = () => {
  try {
    return localStorage.getItem(MANUAL_KEY) === "on";
  } catch (error) {
    return false;
  }
};

const isConnectionOffline = () =>
  typeof ConnectivityService?.isOnline === "function" &&
  !ConnectivityService.isOnline();

/** Show "Not available offline" on this page now? */
export const shouldBlockPage = (pathname = window.location.pathname) =>
  isOfflineAllowed() &&
  (isConnectionOffline() || isManualOffline()) &&
  !isAllowedOffline(pathname);

/** Calls `onChange` when anything above may have changed. Returns unsubscribe. */
export const subscribeOfflineGuard = (onChange) => {
  const unsubscribeConnection =
    typeof ConnectivityService?.subscribe === "function"
      ? ConnectivityService.subscribe(onChange)
      : () => {};
  const unsubscribeSettings =
    typeof OfflineSettingsService?.subscribe === "function"
      ? OfflineSettingsService.subscribe(onChange)
      : () => {};
  const onStorage = (event) => {
    if (event.key === MANUAL_KEY || event.key === null) onChange();
  };
  // single-spa sends this on every page change, in every app.
  const events = ["single-spa:routing-event", "popstate", OFFLINE_MODE_EVENT];
  events.forEach((name) => window.addEventListener(name, onChange));
  window.addEventListener("storage", onStorage);
  return () => {
    unsubscribeConnection();
    unsubscribeSettings();
    events.forEach((name) => window.removeEventListener(name, onChange));
    window.removeEventListener("storage", onStorage);
  };
};
