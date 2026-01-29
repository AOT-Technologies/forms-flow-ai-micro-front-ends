import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; 
import Modal from 'react-bootstrap/Modal';
import { Tabs, Tab } from 'react-bootstrap';
import { CloseIcon, V8CustomButton, CustomInfo, SelectDropdown, CustomTextInput, ApplicationLogo } from "@formsflow/components";
import { fetchSelectLanguages } from '../services/language';
import { updateUserProfile } from '../services/user';
import { useTranslation } from "react-i18next";
import i18n from '../resourceBundles/i18n';
import { StorageService } from "@formsflow/service";
import { KEYCLOAK_AUTH_URL, KEYCLOAK_REALM, LANGUAGE, MULTITENANCY_ENABLED, USER_LANGUAGE_LIST } from '../constants/constants';

export const ProfileSettingsModal = ({ show, onClose, tenant, publish }) => {
  const [selectLanguages, setSelectLanguages] = useState([]);
  const prevSelectedLang = localStorage.getItem('i18nextLng');
  const [selectedLang, setSelectedLang] = useState(prevSelectedLang || LANGUAGE );
  const [daysDifference, setDaysDifference] = useState(null);
  const [activeTab, setActiveTab] = useState("Profile");
  const isSSO = false;
  const [profileFields, setProfileFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
  });
  const [initialProfileFields, setInitialProfileFields] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation(); 
  
  useEffect(() => {
    if (!show) return;
    setError(null);
    try {
      const userDetail = JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};
      const fullName = userDetail?.name || "";
      const [firstFromName = "", ...rest] = String(fullName).trim().split(/\s+/);
      const lastFromName = rest.join(" ");

      const nextFields = {
        firstName: userDetail?.given_name || firstFromName || "",
        lastName: userDetail?.family_name || lastFromName || "",
        email: userDetail?.email || "",
        username: userDetail?.preferred_username || userDetail?.username || "",
      };
      setProfileFields(nextFields);
      setInitialProfileFields(nextFields);
      setUserId(userDetail?.sub || userDetail?.id || null);
    } catch (e) {
      setProfileFields({ firstName: "", lastName: "", email: "", username: "" });
      setInitialProfileFields({ firstName: "", lastName: "", email: "", username: "" });
      setUserId(null);
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

    // Calculate remaining days from expiry_dt 
    try {
      const tenantDataStr = StorageService.get("tenantData");
      const expiry_dt = tenantDataStr 
        ? JSON.parse(tenantDataStr)?.expiry_dt 
        : tenant?.tenantData?.expiry_dt;
      
      if (expiry_dt && !Number.isNaN(Date.parse(expiry_dt))) {
        const expiry = new Date(expiry_dt);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        const timeDifference = expiry.getTime() - currentDate.getTime();
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        setDaysDifference(days);
      } else {
        setDaysDifference(null);
      }
    } catch (error) {
      console.error("Error calculating days difference:", error);
      setDaysDifference(null);
    }

  }, [tenant]);


  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
  };

  const handleConfirmProfile = async () => { 
    if (!userId) {
      setError(t("User ID not found. Please try again."));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Build payload with only changed fields
    const profileData = {};
    const firstName = (profileFields.firstName || "").trim();
    const lastName = (profileFields.lastName || "").trim();
    const username = (profileFields.username || "").trim();
    const email = (profileFields.email || "").trim();

    if (initialProfileFields) {
      if (firstName !== initialProfileFields.firstName) {
        profileData.firstName = firstName;
      }
      if (lastName !== initialProfileFields.lastName) {
        profileData.lastName = lastName;
      }
      if (username !== initialProfileFields.username) {
        profileData.username = username;
      }
      if (email !== initialProfileFields.email) {
        profileData.email = email;
      }
    }

    const hasLanguageChange = selectedLang !== prevSelectedLang;

    // If language changed, add locale to attributes and always include username
    if (hasLanguageChange) {
      profileData.attributes = { locale: [selectedLang] };
      // Always include username when updating locale (required by backend)
      if (!profileData.username) {
        profileData.username = username;
      }
    }

    const hasChanges = Object.keys(profileData).length > 0;

    // If no changes at all, just close the modal
    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      const response = await updateUserProfile(userId, profileData);
      const responseData = response?.data || {};
      
      // Update the stored user details with the response data from API
      const userDetail = JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)) || {};
      const updatedUserDetail = {
        ...userDetail,
        // Use response data if available, otherwise fall back to sent data
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
      
      // Update the name field using response data
      const newFirstName = responseData.firstName || profileData.firstName || userDetail.given_name || "";
      const newLastName = responseData.lastName || profileData.lastName || userDetail.family_name || "";
      if (profileData.firstName || profileData.lastName) {
        updatedUserDetail.name = `${newFirstName} ${newLastName}`.trim();
      }

      // Update locale in stored user details if changed
      if (hasLanguageChange) {
        updatedUserDetail.locale = selectedLang;
      }
      
      StorageService.save(StorageService.User.USER_DETAILS, JSON.stringify(updatedUserDetail));

      // Update language in i18n and localStorage if changed
      if (hasLanguageChange) {
        i18n.changeLanguage(selectedLang);
        localStorage.setItem("i18nextLng", selectedLang);
      }

      // Publish event to notify other components (like Sidebar) of the profile update
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
  const isAnythingChanged = isProfileChanged || !isSaveDisabled;

  const selectedLangLabel = selectLanguages.find(lang => lang.name === selectedLang)?.value || selectedLang;

  const tabs = [
    { key: "Profile", label: t("Profile") },
    { key: "Permissions", label: t("Permissions") },
  ];

  const resetPasswordUrl =
    KEYCLOAK_AUTH_URL && KEYCLOAK_REALM
      ? `${KEYCLOAK_AUTH_URL}/realms/${KEYCLOAK_REALM}/account`
      : null;

  // Get tenantId from tenant prop or StorageService
  const tenantId = tenant?.tenantId || StorageService.get("tenantKey");

  return (
    <Modal
      show={show}
      onHide={onClose}
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
          <CloseIcon color="var(--gray-darkest)" onClick={onClose}/>
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
                  />
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
                  />
                </div>
                <div className="col-12">
                  <V8CustomButton
                    label={t("Reset Password")}
                    variant="secondary"
                    dataTestId="profile-reset-password"
                    ariaLabel={t("Reset Password")}
                    disabled={!resetPasswordUrl}
                    onClick={() => {
                      if (!resetPasswordUrl) return;
                      window.open(resetPasswordUrl, "_blank", "noopener,noreferrer");
                    }}
                  />
                </div>
                <div className="col-12">
                  <CustomInfo
                    className="profile-settings-note-panel"
                    variant="secondary"
                    icon={<ApplicationLogo width="1.1875rem" height="1.4993rem" />}
                    content={t("Success! Check your email inbox for next steps.")}
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
            />
          </>
        ) : (
          <div></div>
        )}
          {tenantId && daysDifference !== null ? (
            <CustomInfo
              className="note"
              heading="Note"
              content={
                `You are currently using a test instance. The trial period ends in ${daysDifference} days.`
              }
            />
          ) : null}
      </Modal.Body>

      <Modal.Footer>
        {error && (
          <div className="profile-error-message text-danger mb-2 w-100">
            {error}
          </div>
        )}
        <div className="buttons-row">
          <V8CustomButton
            label={isLoading ? t("Updating...") : t("Update")}
            onClick={handleConfirmProfile}
            dataTestId="save-profile-settings"
            ariaLabel={t("Save Profile Settings")}
            disabled={activeTab !== "Profile" || !isAnythingChanged || isLoading}
            variant="primary"
          />
         
        </div>
      </Modal.Footer>
    </Modal>
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
