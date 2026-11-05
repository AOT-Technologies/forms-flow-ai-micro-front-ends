import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { renderRichText } from "./richText";

// Figma REV 1.3 (empty), REV 1.4 / 1.5 (filled), REV 1.6 (hint).
// The block between two sample fields, as submitters see it on a form.

interface GovernedContentPreviewProps {
  heading: string;
  body: string;
}

const SampleField: React.FC<{ label: string }> = ({ label }) => (
  <div className="ff-governed-preview__sample" aria-hidden="true">
    <span className="ff-governed-preview__sample-label">{label}</span>
    <span className="ff-governed-preview__sample-input" />
  </div>
);

const GovernedContentPreview: React.FC<GovernedContentPreviewProps> = ({
  heading,
  body,
}) => {
  const { t } = useTranslation();
  const bodyContent = useMemo(() => renderRichText(body), [body]);
  const isEmpty = !heading.trim() && !body;

  return (
    <section
      className="ff-governed-preview"
      aria-labelledby="governed-preview-label"
    >
      <h2 id="governed-preview-label" className="ff-governed-form__label">
        {t("Preview")}
      </h2>
      <div className="ff-governed-preview__box" data-testid="governed-preview">
        {isEmpty ? (
          <p className="ff-governed-preview__placeholder">
            {t("The heading and body appear here as submitters will see them.")}
          </p>
        ) : (
          <>
            <SampleField label={t("Sample field")} />
            <div className="ff-governed-preview__block">
              {heading.trim() && (
                <h4
                  className="ff-governed-preview__heading"
                  data-testid="governed-preview-heading"
                >
                  {heading.trim()}
                </h4>
              )}
              <div
                className="ff-governed-preview__body"
                data-testid="governed-preview-body"
              >
                {bodyContent}
              </div>
            </div>
            <SampleField label={t("Sample field")} />
          </>
        )}
      </div>
      {!isEmpty && (
        <p className="ff-governed-form__hint">
          {t(
            "Submitters see a heading and paragraph like any other on the form. Nothing marks it as governed."
          )}
        </p>
      )}
    </section>
  );
};

export default GovernedContentPreview;
