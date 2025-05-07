import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; 
import Modal from 'react-bootstrap/Modal';
import { CloseIcon, CustomButton, InputDropdown, CustomInfo } from "@formsflow/components";
import { fetchSelectLanguages, updateUserlang } from '../services/language';
import { useTranslation } from "react-i18next";
import i18n from '../resourceBundles/i18n';
import { StorageService } from "@formsflow/service";
import { LANGUAGE, MULTITENANCY_ENABLED, USER_LANGUAGE_LIST } from '../constants/constants';
import version from "../../package.json";

export const ProfileSettingsModal = ({ show, onClose, tenant, publish }) => {
  const [selectLanguages, setSelectLanguages] = useState([]);
  const prevSelectedLang = localStorage.getItem('i18nextLng');
  const [selectedLang, setSelectedLang] = useState(prevSelectedLang || LANGUAGE );
  const { t } = useTranslation(); 
  useEffect(() => { 

    fetchSelectLanguages((languages) => {
      const tenantData = JSON.parse(StorageService.get("TENANT_DATA"));
      const userLanguageList = (MULTITENANCY_ENABLED && tenantData?.details?.langList) || USER_LANGUAGE_LIST;
      const userLanguagesArray = typeof userLanguageList === 'object' ? Object.values(userLanguageList) : userLanguageList.split(',');
      const supportedLanguages = languages.filter(item => userLanguagesArray.includes(item.name));
      setSelectLanguages(supportedLanguages.length > 0 ? supportedLanguages : languages);
    });

  }, [tenant]);
 

  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
  };

  const handleConfirmProfile = () => { 
    updateUserlang(selectedLang);
    i18n.changeLanguage(selectedLang);
    if (tenant?.tenantData?.details) {
      tenant.tenantData.details.locale = selectedLang;
    }
    if (selectedLang) {
      publish("ES_CHANGE_LANGUAGE", selectedLang);
    }

    onClose();  
  };

 
  const isSaveDisabled = selectedLang === prevSelectedLang;

  const selectedLangLabel = selectLanguages.find(lang => lang.name === selectedLang)?.value || selectedLang;

  return (
    <Modal
      show={show}
      onHide={onClose}
      size="sm"
      centered={true}
      data-testid="profile-settings-modal"
      aria-labelledby={t("profile settings modal title")}
      aria-describedby="profile-settings-modal"
      backdrop="static"
    >
      <Modal.Header>
        <Modal.Title id="profile-modal-title">
          <p>{t("Settings")}</p>
        </Modal.Title>
        <div className="icon-close" onClick={onClose}>
          <CloseIcon />
        </div>
      </Modal.Header>

      <Modal.Body className='profile-settings p-0'>
        <div className='lang-settings'>
          <InputDropdown
            isAllowInput={false}
            Options={selectLanguages.map((lang) => ({
              label: lang.value,
              onClick: () => handleLanguageChange(lang.name),
            }))}
            dropdownLabel={t("System Language")}
            selectedOption={selectedLangLabel}  
            isInvalid={false}
            ariaLabelforDropdown={t("Language Dropdown")}
            ariaLabelforInput={t("Language Input")}
            dataTestIdforDropdown="dropdown-language"
            dataTestIdforInput="input-language"
          />
          <CustomInfo className="note" heading="Note" 
            content={`You are running version ${version.version} of Formsflow`} />
        </div>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-start">
        <CustomButton
          variant="primary"
          size="md"
          label={t("Save Changes")}
          onClick={handleConfirmProfile}
         dataTestId="save-profile-settings"
          ariaLabel={t("Save Profile Settings")}
          disabled={isSaveDisabled}
        />
        <CustomButton
          variant="secondary"
          size="md"
          label={t("Cancel")}
          onClick={onClose}
         dataTestId="cancel-profile-settings"
          ariaLabel={t("Cancel profile settings")}
        />
      </Modal.Footer>
    </Modal>
  );
};

ProfileSettingsModal.propTypes = {
  show: PropTypes.bool.isRequired,  
  onClose: PropTypes.func.isRequired,  
  tenant: PropTypes.shape({  
    tenantData: PropTypes.shape({
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
