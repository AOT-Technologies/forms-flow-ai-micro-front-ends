import React from "react";
import { useTranslation } from "react-i18next";
import { StyleConfig, FONT_MAP, BUTTON_RADIUS_MAP } from "@formsflow/components";

interface StylePreviewProps {
  styleConfig: StyleConfig;
}

const StylePreview: React.FC<StylePreviewProps> = ({ styleConfig }) => {
  const { t } = useTranslation();

  const inlineVars = {
    "--preview-bg": styleConfig.background,
    "--preview-accent": styleConfig.accent,
    "--preview-btn": styleConfig.buttons,
    "--preview-btn-radius": BUTTON_RADIUS_MAP[styleConfig.buttonShape] || "4px",
    "--preview-header-font": FONT_MAP[styleConfig.headerFont] || FONT_MAP.sans,
    "--preview-body-font": FONT_MAP[styleConfig.bodyFont] || FONT_MAP.sans,
  } as React.CSSProperties;

  return (
    <div className="ff-admin-style-preview" style={inlineVars}>
      <h2 className="ff-admin-style-preview__title">{t("Patient Intake Form")}</h2>
      <p className="ff-admin-style-preview__subtitle">{t("Healthcare Form")}</p>
      <hr className="ff-admin-style-preview__divider" />

      {/* Section 1 */}
      <div className="ff-admin-style-preview__section-header">
        {t("Section 1: Applicant Information")}
      </div>

      <div className="ff-admin-style-preview__row ff-admin-style-preview__row--3col">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("First Name")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">{t("Middle Name")}</span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Last Name")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
      </div>

      <div className="ff-admin-style-preview__row ff-admin-style-preview__row--2col">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Social Insurance Number (SIN)")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Date of Birth")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
      </div>

      <div className="ff-admin-style-preview__row">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Mailing Address (Street, Apt)")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
      </div>

      <div className="ff-admin-style-preview__row ff-admin-style-preview__row--3col">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("City")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Province")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Postal Code")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
      </div>

      <div className="ff-admin-style-preview__row ff-admin-style-preview__row--2col">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Primary Phone Number")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("Marital Status")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input">
            <span style={{ color: "#9CA3AF", fontSize: 13 }}></span>
            <span style={{ color: "#9CA3AF" }}>&#8964;</span>
          </div>
        </div>
      </div>

      <hr className="ff-admin-style-preview__divider" />

      {/* Section 2 */}
      <div className="ff-admin-style-preview__section-header">
        {t("Section 2: Spouse or Common-law Partner's Information")}
      </div>

      <div className="ff-admin-style-preview__row">
        <div>
          <span className="ff-admin-style-preview__field-label">
            {t("First Name")}<span className="ff-admin-style-preview__required">*</span>
          </span>
          <div className="ff-admin-style-preview__input" />
        </div>
      </div>

      <div className="ff-admin-style-preview__actions">
        <button
          className="ff-admin-style-preview__submit-btn"
          disabled
          style={{ pointerEvents: "none" }}
          type="button"
        >
          {t("Submit")}
        </button>
      </div>
    </div>
  );
};

export default StylePreview;
