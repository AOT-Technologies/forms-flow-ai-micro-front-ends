import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { CloseIcon, CustomButton, InputDropdown } from "@formsflow/components";
import { fetchSelectLanguages, updateUserlang } from '../services/language';
import { useTranslation } from "react-i18next";
import i18n from '../resourceBundles/i18n';
import { StorageService } from "@formsflow/service";
import { LANGUAGE, MULTITENANCY_ENABLED, USER_LANGUAGE_LIST } from '../constants/constants';

export const ProfileSettingsModal = ({ show, onClose, tenant, publish }) => {
  const [selectLanguages, setSelectLanguages] = useState([]);
  const [selectedLang, setSelectedLang] = useState(localStorage.getItem('lang') || 'en');
  const { t } = useTranslation();
  const [userDetail, setUserDetail] = useState({});


  useEffect(() => {
    setUserDetail(JSON.parse(StorageService.get(StorageService.User.USER_DETAILS)));
  }, []);

  useEffect(() => {
    if (show) {
      fetchSelectLanguages((languages) => {
        setSelectLanguages(languages);
      });
    }
  }, [show]);

  useEffect(() => {
    fetchSelectLanguages((data) => {
      const tenantdata = JSON.parse(StorageService.get("TENANT_DATA"));
      const userLanguageList = (MULTITENANCY_ENABLED && tenantdata?.details?.langList) || USER_LANGUAGE_LIST;
      let userLanguagesArray = [];
      if (typeof userLanguageList === 'object') {
        userLanguagesArray = Object.values(userLanguageList);
      } else if (typeof userLanguageList === 'string') {
        userLanguagesArray = userLanguageList.split(',');
      }
      const supportedLanguages = data.filter(item => userLanguagesArray.includes(item.name));
      setSelectLanguages(supportedLanguages.length > 0 ? supportedLanguages : data);
    });
  }, [MULTITENANCY_ENABLED, USER_LANGUAGE_LIST, tenant]);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang');
    if (savedLang) {
      setSelectedLang(savedLang);
      i18n.changeLanguage(savedLang);
    } else {
      setSelectedLang('en');
      i18n.changeLanguage('en');
    }
  }, []);

  React.useEffect(() => {
    if (userDetail) {
      const locale =
        userDetail?.locale ||
        tenant?.tenantData?.details?.locale ||
        LANGUAGE;
      setSelectedLang(locale);
    }
  }, [userDetail, tenant.tenantData]);

  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
  };

  const handleConfirmProfile = () => {
    setUserDetail((prev) => ({ ...prev, locale: selectedLang }));

    updateUserlang(selectedLang);

    i18n.changeLanguage(selectedLang);

    if (tenant && tenant.tenantData && tenant.tenantData.details) {
      tenant.tenantData.details.locale = selectedLang;

    }

    if (selectedLang) {
      publish("ES_CHANGE_LANGUAGE", selectedLang);
    }

    onClose();
  };

  const isSaveDisabled = selectedLang === localStorage.getItem('i18nextLng');

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
          <b>{t("Profile Settings")}</b>
        </Modal.Title>
        <div className="d-flex align-items-center">
          <CloseIcon onClick={onClose} />
        </div>
      </Modal.Header>

      <Modal.Body className='profile-settings p-0'>
        <div className='lang-settings'>
          <InputDropdown
            isAllowInput={false}
            Options={selectLanguages.map((lang) => ({
              label: lang.name,
              onClick: () => handleLanguageChange(lang.name),
            }))}
            dropdownLabel={t("System Language")}
            placeholder={selectedLang}
            selectedOption={selectedLang}
            isInvalid={false}
            ariaLabelforDropdown={t("Language Dropdown")}
            ariaLabelforInput={t("Language Input")}
            dataTestIdforDropdown="dropdown-language"
            dataTestIdforInput="input-language"
          />
        </div>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-start">
        <CustomButton
          variant="primary"
          size="md"
          label={t("Save Changes")}
          onClick={handleConfirmProfile}
          dataTestid="save-profile-settings"
          ariaLabel={t("Save Profile Settings")}
          disabled={isSaveDisabled}
        />
        <CustomButton
          variant="secondary"
          size="md"
          label={t("Cancel")}
          onClick={onClose}
          dataTestid="cancel-profile-settings"
          ariaLabel={t("Cancel profile settings")}
        />
      </Modal.Footer>
    </Modal>
  );
};
