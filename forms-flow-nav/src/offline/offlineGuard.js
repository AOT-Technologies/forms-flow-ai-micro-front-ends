import {
  ConnectivityService,
  OfflineSettingsService,
} from "@formsflow/service";

// "Not available offline" (FFF-3 offline forms). Offline, only the Submit
// pages work; every other page needs the server. The nav is on every page, so
// it covers the rest with one plain page instead of each app failing in its
// own way (a blank page, an endless loader, a crash).
//
// Only when the connection is really gone: the "Offline mode" switch alone
// does not cover other pages (decided 15 Oct). Only while offline support is
// on: the env key and the organization's "Offline forms" switch.

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

const isConnectionOffline = () =>
  typeof ConnectivityService?.isOnline === "function" &&
  !ConnectivityService.isOnline();

/** Show "Not available offline" on this page now? */
export const shouldBlockPage = (pathname = window.location.pathname) =>
  isOfflineAllowed() && isConnectionOffline() && !isAllowedOffline(pathname);

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
  // single-spa sends this on every page change, in every app.
  const events = ["single-spa:routing-event", "popstate"];
  events.forEach((name) => window.addEventListener(name, onChange));
  return () => {
    unsubscribeConnection();
    unsubscribeSettings();
    events.forEach((name) => window.removeEventListener(name, onChange));
  };
};
