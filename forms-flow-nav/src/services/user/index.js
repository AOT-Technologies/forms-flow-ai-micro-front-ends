import { RequestService, StorageService } from "@formsflow/service";
import API from "../../endpoints/index";

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
