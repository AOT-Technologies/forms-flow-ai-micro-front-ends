import { RequestService,StorageService } from "@formsflow/service";
import API from "../../endpoints/index";
import { WEB_BASE_CUSTOM_URL } from "../../constants/constants";

const userDetail = JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};

const userId = userDetail.sub || "";
 export const fetchUserLoginDetails = () => {
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

/**
 * Trigger a reset password email/link for the current user.
 */

export const requestResetPassword = () => {
  const token = StorageService.get(StorageService.User.AUTH_TOKEN);
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

/**
 * @param {string} userId 
 * @param {Object} profileData
 * @param {string} [profileData.firstName] 
 * @param {string} [profileData.lastName]
 * @param {string} [profileData.username]
 * @param {string} [profileData.email] 
 * @param {Object} [profileData.attributes] 
 * @returns {Promise} 
 */
export const updateUserProfile = (userId, profileData) => {
  const url = API.USER_PROFILE_UPDATE.replace("<user_id>", userId);
  return RequestService.httpPUTRequest(
    url,
    profileData,
    StorageService.get(StorageService.User.AUTH_TOKEN)
  );
};
