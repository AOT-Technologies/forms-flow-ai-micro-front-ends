import React from "react";
import { useTranslation } from "react-i18next";
import { StyleConfig, FONT_MAP, BUTTON_RADIUS_MAP, FORMSFLOW_LOGO_ICON_SVG } from "@formsflow/components";

interface StylePreviewProps {
  styleConfig: StyleConfig;
}

// A single "label + input box" pair in the mock form below -- factored out
// since the panels otherwise repeat this same label/required-asterisk/input
// markup for every field, which read as duplicated blocks.
interface PreviewFieldProps {
  label: string;
  required?: boolean;
  children?: React.ReactNode;
}

const PreviewField: React.FC<PreviewFieldProps> = ({
  label,
  required,
  children,
}) => (
  <div>
    <span className="ff-admin-style-preview__field-label">
      {label}
      {required && (
        <span className="ff-admin-style-preview__required">*</span>
      )}
    </span>
    <div className="ff-admin-style-preview__input">{children}</div>
  </div>
);

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

      {/* Section 1 — wrapped in &__panel so the border encloses the header
          and every field belonging to it, matching a real Formio Panel. */}
      <div className="ff-admin-style-preview__panel">
        <div className="ff-admin-style-preview__section-header">
          {t("Section 1: Applicant Information")}
        </div>

        <div className="ff-admin-style-preview__row ff-admin-style-preview__row--3col">
          <PreviewField label={t("First Name")} required />
          <PreviewField label={t("Middle Name")} />
          <PreviewField label={t("Last Name")} required />
        </div>

        <div className="ff-admin-style-preview__row ff-admin-style-preview__row--2col">
          <PreviewField label={t("Social Insurance Number (SIN)")} required />
          <PreviewField label={t("Date of Birth")} required />
        </div>

        <div className="ff-admin-style-preview__row">
          <PreviewField label={t("Mailing Address (Street, Apt)")} required />
        </div>

        <div className="ff-admin-style-preview__row ff-admin-style-preview__row--3col">
          <PreviewField label={t("City")} required />
          <PreviewField label={t("Province")} required />
          <PreviewField label={t("Postal Code")} required />
        </div>

        <div className="ff-admin-style-preview__row ff-admin-style-preview__row--2col">
          <PreviewField label={t("Primary Phone Number")} required />
          <PreviewField label={t("Marital Status")} required>
            <span style={{ color: "#9CA3AF", fontSize: 13 }}></span>
            <span style={{ color: "#9CA3AF" }}>&#8964;</span>
          </PreviewField>
        </div>
      </div>

      <hr className="ff-admin-style-preview__divider" />

      {/* Section 2 */}
      <div className="ff-admin-style-preview__panel">
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

      {styleConfig.brandingLogo === "formsflow" && (
        <div className="ff-admin-style-preview__branding">
          <span
            className="ff-admin-style-preview__branding-icon"
            dangerouslySetInnerHTML={{ __html: FORMSFLOW_LOGO_ICON_SVG }}
          />
          <span className="ff-admin-style-preview__branding-label">Created by</span>
          <span className="ff-admin-style-preview__branding-brand">formsflow.ai</span>
        </div>
      )}
    </div>
  );
};

export default StylePreview;
