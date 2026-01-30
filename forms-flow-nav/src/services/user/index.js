import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";
import { WEB_BASE_CUSTOM_URL } from "../../constants/constants";

/**
 * Trigger a reset password email/link for the current user.
 */
const extractUserIdFromToken = (token) => {
  if (!token) return "";
  const raw = String(token).replace(/^Bearer\s+/i, "").trim();
  const parts = raw.split(".");
  if (parts.length < 2) return "";
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const atobFn = typeof atob === "function" ? atob : (typeof window !== "undefined" ? window.atob : null);
    if (!atobFn) return "";
    const json = JSON.parse(atobFn(padded));
    return json?.sub || "";
  } catch (e) {
    return "";
  }
};

export const requestResetPassword = () => {
  const token = StorageService.get(StorageService.User.AUTH_TOKEN);
  const userId = extractUserIdFromToken(token);
  if (!userId) {
    return Promise.reject(new Error("User id not found in token"));
  }
  const redirectUri =
    (WEB_BASE_CUSTOM_URL && String(WEB_BASE_CUSTOM_URL).trim()) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const urlWithRedirect = `${API.RESET_PASSWORD(userId)}?redirect_uri=${encodeURIComponent(
    redirectUri
  )}`;
  return RequestService.httpPUTRequest(
    urlWithRedirect,
    {},
    token
  );
};


