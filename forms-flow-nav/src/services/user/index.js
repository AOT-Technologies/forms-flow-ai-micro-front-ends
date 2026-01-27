import { RequestService,StorageService } from "@formsflow/service";
import API from "../../endpoints/index";


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
 export const fetchUserLoginDetails = () => {
    const userId = extractUserIdFromToken(StorageService.get(StorageService.User.AUTH_TOKEN));
    console.log("userId", userId);
    if (!userId) return;
    const apiUserLoginDetails = API.USER_LOGIN_DETAILS(userId);
    RequestService.httpGETRequest(apiUserLoginDetails, null, StorageService.get(StorageService.User.AUTH_TOKEN))
    .then((res) => {
        localStorage.setItem("USER_LOGIN_DETAILS", JSON.stringify(res.data));
    })
    .catch((error) => {
      console.error(error);
    });
};
