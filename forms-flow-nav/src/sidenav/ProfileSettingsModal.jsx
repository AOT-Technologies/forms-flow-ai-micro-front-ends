import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; 
import Modal from 'react-bootstrap/Modal';
import { Tabs, Tab } from 'react-bootstrap';
import { CloseIcon, V8CustomButton, CustomInfo, SelectDropdown, CustomTextInput, ApplicationLogo, PromptModal } from "@formsflow/components";
import { fetchSelectLanguages } from '../services/language';
import { updateUserProfile, requestResetPassword } from '../services/user';
import { useTranslation } from "react-i18next";
import i18n from '../resourceBundles/i18n';
import { StorageService } from "@formsflow/service";
import { LANGUAGE, MULTITENANCY_ENABLED, USER_LANGUAGE_LIST } from '../constants/constants';
import { fetchPermissions } from '../services/permissions';
import { getUserPermissionsByCategory } from '../helper/helper';

export const ProfileSettingsModal = ({ show, onClose, tenant, publish }) => {
  const [selectLanguages, setSelectLanguages] = useState([]);
  const prevSelectedLang = localStorage.getItem('i18nextLng');
  const [selectedLang, setSelectedLang] = useState(prevSelectedLang || LANGUAGE );
  const [activeTab, setActiveTab] = useState("Profile");
  const [isSSO, setIsSSO] = useState(false);
  const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);
  const [profileFields, setProfileFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });
  const [initialProfileFields, setInitialProfileFields] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [initialSelectedLang, setInitialSelectedLang] = useState(prevSelectedLang || LANGUAGE);
  const [emailTouched, setEmailTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [resetPasswordState, setResetPasswordState] = useState("default"); // default | success | error
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [lastResetPasswordError, setLastResetPasswordError] = useState(null);
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation(); 
  
  useEffect(() => {
    if (!show) return;
    setError(null);
    try {
      // Reset language selection to current app language when modal opens
      const currentLang = localStorage.getItem("i18nextLng") || LANGUAGE;
      setSelectedLang(currentLang);
      setInitialSelectedLang(currentLang);

      const userDetail = JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};
      const fullName = userDetail?.name || "";
      const [firstFromName = "", ...rest] = String(fullName).trim().split(/\s+/);
      const lastFromName = rest.join(" ");

      // Check if user is logged in via federated identity provider from USER_LOGIN_DETAILS
      // loginType can be "internal" (Keycloak) or "external" (external IDP like Google/Microsoft)
      // If loginType is "external", disable profile editing fields
      let federatedLogin = false;
      try {
        const userLoginDetailsStr = localStorage.getItem("USER_LOGIN_DETAILS");
        if (userLoginDetailsStr) {
          const userLoginDetails = JSON.parse(userLoginDetailsStr);
          // Check loginType: "external" means SSO/external IDP, "internal" means Keycloak
          if (userLoginDetails?.loginType !== undefined) {
            const loginType = String(userLoginDetails.loginType).trim().toLowerCase();
            federatedLogin = loginType === "external";
          } 
        }
      } catch (e) {
        // Fallback to checking userDetail if USER_LOGIN_DETAILS is not available
        federatedLogin = !!(userDetail?.identityProvider || userDetail?.identity_provider);
      }
      setIsSSO(federatedLogin);

      const nextFields = {
        firstName: userDetail?.given_name || firstFromName || "",
        lastName: userDetail?.family_name || lastFromName || "",
        email: userDetail?.email || "",
        username: userDetail?.preferred_username || userDetail?.username || "",
      };
      setProfileFields(nextFields);
      setInitialProfileFields(nextFields);
      setEmailTouched(false);
      setUsernameTouched(false);
      setResetPasswordState("default");
      setResetPasswordLoading(false);
      setLastResetPasswordError(null);
      setUserId(userDetail?.sub || userDetail?.id || "");
    } catch (e) {
      setProfileFields({ firstName: "", lastName: "", email: "", username: "" });
      setInitialProfileFields({ firstName: "", lastName: "", email: "", username: "" });
      setSelectedLang(prevSelectedLang || LANGUAGE);
      setInitialSelectedLang(prevSelectedLang || LANGUAGE);
      setUserId("");
      setIsSSO(false);
    }
  }, [show]);

  useEffect(() => { 

    fetchSelectLanguages((languages) => {
      const tenantData = JSON.parse(StorageService.get("tenantData"));
      const userLanguageList = (MULTITENANCY_ENABLED && tenantData?.details?.langList) || USER_LANGUAGE_LIST;
      const userLanguagesArray = typeof userLanguageList === 'object' ? Object.values(userLanguageList) : userLanguageList.split(',');
      const supportedLanguages = languages.filter(item => userLanguagesArray.includes(item.name));
      setSelectLanguages(supportedLanguages.length > 0 ? supportedLanguages : languages);
    });
  }, []);

  // Fetch user permissions when modal opens
  useEffect(() => {
    if (show) {
      // Get user roles from storage
      const userRoles = JSON.parse(
        StorageService.get(StorageService.User.USER_ROLE) ?? "[]"
      );

      // Fetch all permissions from API
      fetchPermissions(
        (data) => {
          // Filter out manage_bundles, manage_integrations, and manage_templates permissions
          const filteredData = data.filter(
            (permission) =>
              permission.name !== "manage_bundles" &&
              permission.name !== "manage_integrations" &&
              permission.name !== "manage_templates"
          );
          
          // Use helper function to group user permissions by category
          const grouped = getUserPermissionsByCategory(userRoles, filteredData);
          setUserPermissions(grouped);
        },
        (err) => {
          console.error("Error fetching permissions:", err);
          setUserPermissions({});
        }
      );
    }
  }, [show]);

  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
  };

  const isValidEmail = (email) => {
    // Simple, practical email validation (good UX, not overly strict)
    const value = String(email || "").trim();
    if (!value) return true; // allow empty if your system permits it
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
  const emailIsInvalid = emailTouched && !isValidEmail(profileFields.email);

  const isValidUsername = (username) => {
    const value = String(username || "");
    if (!value) return true; // allow empty if your system permits it
    return /^\S+$/.test(value); // no whitespace
  };
  const usernameIsInvalid =
    usernameTouched && !isValidUsername(profileFields.username);

  useEffect(() => {
    setResetPasswordState("default");
  }, [profileFields.email]);

  const handleResetPassword = async () => {
    setEmailTouched(true);
    if (!profileFields.email || emailIsInvalid) return;

    setResetPasswordLoading(true);
    try {
      await requestResetPassword();
      setResetPasswordState("success");
      setLastResetPasswordError(null);
    } catch (e) {
      setResetPasswordState("error");
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message;
      const details = { status, message, data: e?.response?.data };
      setLastResetPasswordError(details);
      try {
        StorageService.save("PROFILE_RESET_PASSWORD_LAST_ERROR", JSON.stringify(details));
      } catch (_) {
      }

      console.error("Reset password failed:", details);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Helper: Build profile payload with only changed fields
  const buildProfilePayload = (currentFields, initialFields, currentLang, prevLang) => {
    const payload = {};
    const trimmedFields = {
      firstName: (currentFields.firstName || "").trim(),
      lastName: (currentFields.lastName || "").trim(),
      username: (currentFields.username || "").trim(),
      email: (currentFields.email || "").trim(),
    };

    if (initialFields) {
      const fieldKeys = ["firstName", "lastName", "username", "email"];
      fieldKeys.forEach((key) => {
        if (trimmedFields[key] !== initialFields[key]) {
          payload[key] = trimmedFields[key];
        }
      });
    }

    // If language changed, add locale and ensure username is included
    if (currentLang !== prevLang) {
      payload.attributes = { locale: [currentLang] };
      payload.username = payload.username || trimmedFields.username;
    }

    return payload;
  };

  // Helper: Build updated user detail object from API response
  const buildUpdatedUserDetail = (userDetail, responseData, profileData, newLang, hasLangChange) => {
    const updated = {
      ...userDetail,
      // Use response data if available
      ...(responseData.firstName && { given_name: responseData.firstName }),
      ...(responseData.lastName && { family_name: responseData.lastName }),
      ...(responseData.email && { email: responseData.email }),
      ...(responseData.username && { preferred_username: responseData.username }),
      // Fallback to profileData if response doesn't include the fields
      ...(!responseData.firstName && profileData.firstName && { given_name: profileData.firstName }),
      ...(!responseData.lastName && profileData.lastName && { family_name: profileData.lastName }),
      ...(!responseData.email && profileData.email && { email: profileData.email }),
      ...(!responseData.username && profileData.username && { preferred_username: profileData.username }),
    };

    // Update the name field if first or last name changed
    if (profileData.firstName || profileData.lastName) {
      const newFirst = responseData.firstName || profileData.firstName || userDetail.given_name || "";
      const newLast = responseData.lastName || profileData.lastName || userDetail.family_name || "";
      updated.name = `${newFirst} ${newLast}`.trim();
    }

    // Update locale if language changed
    if (hasLangChange) {
      updated.locale = newLang;
    }

    return updated;
  };

  // Helper: Apply language change to i18n and localStorage
  const applyLanguageChange = (newLang) => {
    i18n.changeLanguage(newLang);
    localStorage.setItem("i18nextLng", newLang);
  };

  const handleConfirmProfile = async () => { 
    // Prevent profile updates for SSO/federated users
    if (isSSO) {
      setError(t("Profile editing is disabled for federated login users."));
      return;
    }

    if (!userId) {
      setError(t("User ID not found. Please try again."));
      return;
    }

    const hasLanguageChange = selectedLang !== prevSelectedLang;
    const profileData = buildProfilePayload(profileFields, initialProfileFields, selectedLang, prevSelectedLang);

    if (Object.keys(profileData).length === 0) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await updateUserProfile(userId, profileData);
      const responseData = response?.data || {};
      const userDetail = JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};
      
      const updatedUserDetail = buildUpdatedUserDetail(
        userDetail, responseData, profileData, selectedLang, hasLanguageChange
      );
      
      StorageService.save(StorageService.User.USER_DETAILS, JSON.stringify(updatedUserDetail));

      if (hasLanguageChange) {
        applyLanguageChange(selectedLang);
      }

      if (publish) {
        publish("profileUpdated", { ...responseData, userId });
      }

      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err?.response?.data?.message || err?.message || t("Failed to update profile. Please try again.");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

 
  const isSaveDisabled = selectedLang === prevSelectedLang;
  const isProfileChanged =
    !!initialProfileFields &&
    (profileFields.firstName !== initialProfileFields.firstName ||
      profileFields.lastName !== initialProfileFields.lastName ||
      profileFields.email !== initialProfileFields.email ||
      profileFields.username !== initialProfileFields.username);
  const isLangChanged = selectedLang !== initialSelectedLang;
  const isAnythingChanged = isProfileChanged || isLangChanged;

  const handleRequestClose = () => {
    if (activeTab === "Profile" && isAnythingChanged) {
      setShowUnsavedChangesPrompt(true);
      return;
    }
    onClose();
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedChangesPrompt(false);
    if (initialProfileFields) setProfileFields(initialProfileFields);
    setSelectedLang(initialSelectedLang);
    setEmailTouched(false);
    setUsernameTouched(false);
    setResetPasswordState("default");
    setLastResetPasswordError(null);
    onClose();
  };

  const handleSaveAndClose = () => {
    setShowUnsavedChangesPrompt(false);
    handleConfirmProfile();
  };

  const selectedLangLabel = selectLanguages.find(lang => lang.name === selectedLang)?.value || selectedLang;

  const getCategoryLabel = (category) => {
    if (category === "Admin") {
      return t("Access to Manage");
    }
    if (category === "Billing") {
      return t("Access to billing");
    }
    if (category === "Users") {
      return t("Manage users");
    }
    return t(`Access to ${category.charAt(0).toUpperCase()}${category.slice(1).toLowerCase()}`);
  };

  const tabs = [
    { key: "Profile", label: t("Profile") },
    { key: "Permissions", label: t("Permissions") },
  ];

  // Get tenantId from tenant prop or StorageService
  const tenantId = tenant?.tenantId || StorageService.get("tenantKey");

  return (
    <>
    <Modal
      show={show}
      onHide={handleRequestClose}
      size="lg"
      dialogClassName="profile-settings-modal"
      data-testid="profile-settings-modal"
      aria-labelledby={t("profile settings modal title")}
      aria-describedby="profile-settings-modal"
      backdrop="static"
    >
      <Modal.Header>
        <div className="modal-header-content">
          <div className="modal-title pb-0">
            <p>{t("Personal Settings")}</p>        
          <CloseIcon color="var(--gray-darkest)" onClick={handleRequestClose}/>
          </div>
          <div className="modal-subtitle pb-0">
            <div className='secondary-controls'>
            <div className='pill-tabs-container'>
              <Tabs
              activeKey={activeTab}
              onSelect={(key) => key && setActiveTab(key)}
              id="profile-settings-tabs"
              data-testid="profile-settings-tabs"
              className="pill-tabs"
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.key}
                    eventKey={tab.key}
                    title={
                      <span data-testid={`profile-settings-${tab.key}-tab`}>
                        {tab.label}
                      </span>
                    }
                  >
                    {/* Empty content; this is navigation. Body renders based on activeTab. */}
                  </Tab>
                ))}
              </Tabs>
            </div>
            </div>
           
          </div>
        </div>
      
      </Modal.Header>

      <Modal.Body>
        {activeTab === "Profile" ? (
          <>
            {isSSO && (
              <CustomInfo
                className="mb-3"
                variant="secondary"
                icon={<ApplicationLogo width="1.1875rem" height="1.4993rem" />}
                content={t("Your profile is managed by your identity provider. Profile editing is disabled for federated login users.")}
              />
            )}
            <div className="profile-settings-details-box p-3 mb-3 border rounded">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="input-label-text">{t("First Name")}</div>
                  <CustomTextInput
                    value={profileFields.firstName}
                    setValue={(v) => setProfileFields((p) => ({ ...p, firstName: v }))}
                    placeholder="First Name"
                    dataTestId="profile-first-name"
                    ariaLabel={t("First Name")}
                    disabled={isSSO}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <div className="input-label-text">{t("Last Name")}</div>
                  <CustomTextInput
                    value={profileFields.lastName}
                    setValue={(v) => setProfileFields((p) => ({ ...p, lastName: v }))}
                    placeholder="Last Name"
                    dataTestId="profile-last-name"
                    ariaLabel={t("Last Name")}
                    disabled={isSSO}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <div className="input-label-text">{t("Email")}</div>
                  <CustomTextInput
                    value={profileFields.email}
                    setValue={(v) => setProfileFields((p) => ({ ...p, email: v }))}
                    placeholder="Email"
                    dataTestId="profile-email"
                    ariaLabel={t("Email")}
                    disabled={isSSO}
                    onBlur={() => setEmailTouched(true)}
                  />
                  <div
                    className="profile-settings-field-error text-danger mt-1"
                    data-testid="profile-email-error"
                  >
                    {emailIsInvalid ? t("Email address is invalid") : ""}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="input-label-text">{t("Username")}</div>
                  <CustomTextInput
                    value={profileFields.username}
                    setValue={(v) => setProfileFields((p) => ({ ...p, username: v }))}
                    placeholder="Username"
                    dataTestId="profile-username"
                    ariaLabel={t("Username")}
                    disabled={isSSO}
                    onBlur={() => setUsernameTouched(true)}
                  />
                  <div
                    className="profile-settings-field-error text-danger mt-1"
                    data-testid="profile-username-error"
                  >
                    {usernameIsInvalid ? t("Username is invalid") : ""}
                  </div>
                </div>
                <div className="col-12">
                  <V8CustomButton
                    label={resetPasswordLoading ? "Resetting password" : "Reset Password"}
                    variant="secondary"
                    dataTestId="profile-reset-password"
                    ariaLabel="Reset Password"
                    disabled={
                      isSSO ||
                      resetPasswordLoading ||
                      !profileFields.email ||
                      emailIsInvalid
                    }
                    loading={resetPasswordLoading}
                    onClick={handleResetPassword}
                  />
                </div>
                <div className="col-12">
                  <CustomInfo
                    className={[
                      "profile-settings-note-panel",
                      resetPasswordState === "error"
                        ? "profile-settings-note-panel--danger-text"
                        : "",
                    ].join(" ")}
                    variant="secondary"
                    icon={<ApplicationLogo width="1.1875rem" height="1.4993rem" />}
                    content={
                      resetPasswordState === "success"
                        ? t("Success! Check your email inbox for next steps.")
                        : resetPasswordState === "error"
                          ? t("Uh-oh! Something went wrong. Please try again.")
                          : t("Resetting your password sends a reset link to {{email}}.", {
                              email: profileFields.email || "",
                            })
                    }
                  />
                </div>
              </div>
            </div>

            <SelectDropdown
              options={selectLanguages.map((lang) => ({
                label: lang.value,
                value: lang.name,
              }))}
              width="22rem"
              defaultValue={selectedLangLabel}
              dataTestId="settings-language-dropdown"
              ariaLabel={t("Language Dropdown")}
              value={selectedLangLabel}
              variant="primary"
              className="mb-3"
              onChange={handleLanguageChange}
              disabled={isSSO}
            />
          </>
        ) : (
            <div className='permissions-container'>
              {Object.keys(userPermissions).length === 0 ? (
                <div className="text-center p-4 border rounded">
                  <p>{t("No permissions found")}</p>
                </div>
              ) : (
                <div className="permissions-list p-3 border rounded">
                  {Object.entries(userPermissions).map(([category, permissions]) => (
                    <div key={category} className="permission-category mb-4">
                      <div className="permission-category-title fw-bold mb-2">
                        {getCategoryLabel(category)}
                      </div>
                      <div className="permission-items ps-4">
                        {permissions.map((permission) => (
                          <div 
                            key={permission.name} 
                            className="permission-item mb-2"
                            data-testid={`permission-${permission.name}`}
                          >
                            {t(permission.description || permission.name)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className='info-section'>
                {t("Contact an administrator to request any changes to your permissions")}
              </div>
            </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        {error && (
          <div className="profile-error-message text-danger mb-2 w-100">
            {error}
          </div>
        )}
        <div className="buttons-row d-flex justify-content-end">
          <V8CustomButton
            label={isLoading ? t("Updating...") : t("Update")}
            onClick={handleConfirmProfile}
            dataTestId="save-profile-settings"
            ariaLabel={t("Save Profile Settings")}
            disabled={activeTab !== "Profile" || !isAnythingChanged || emailIsInvalid || usernameIsInvalid || isLoading || isSSO}
            variant="primary"
          />
        </div>
      </Modal.Footer>
    </Modal>

    <PromptModal
      show={showUnsavedChangesPrompt}
      size="sm"
      onClose={() => setShowUnsavedChangesPrompt(false)}
      type="warning"
      title={t("You have unsaved changes")}
      message={t("Leaving will discard any unsaved changes. Are you sure you want to continue?")}
      primaryBtnText={t("Save")}
      secondaryBtnText={t("Discard Changes")}
      primaryBtnAction={handleSaveAndClose}
      secondaryBtnAction={handleDiscardAndClose}
      primaryBtnDisable={emailIsInvalid || usernameIsInvalid}
      primaryBtndataTestid="profile-settings-save-before-close"
      secondoryBtndataTestid="profile-settings-discard-before-close"
    />
    </>
  );
};

ProfileSettingsModal.propTypes = {
  show: PropTypes.bool.isRequired,  
  onClose: PropTypes.func.isRequired,  
  tenant: PropTypes.shape({  
    tenantId: PropTypes.string,
    tenantData: PropTypes.shape({
      expiry_dt: PropTypes.string,
      details: PropTypes.shape({
        locale: PropTypes.string,
        langList: PropTypes.oneOfType([
          PropTypes.object,
          PropTypes.string
        ])
      })
    })
  }).isRequired,  
  publish: PropTypes.func.isRequired, 
};

export default ProfileSettingsModal;
