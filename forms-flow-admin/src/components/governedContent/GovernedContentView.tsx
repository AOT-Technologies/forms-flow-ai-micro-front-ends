import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HelperServices } from "@formsflow/service";
import GovernedContentPreview from "./GovernedContentPreview";
import RetiredChip from "./RetiredChip";
import {
  GovernedBlockDraft,
  REQUIREMENT_LABELS,
  isRetired,
} from "./governedBlock";
import { renderRichText } from "./richText";
import { GovernedContentRecord } from "../../services/governedContent";

// Figma REV 3.5: a retired block, read-only, with no actions. Active blocks
// open the same way while governed content is off (REV 4).

interface GovernedContentViewProps {
  record: GovernedContentRecord;
  draft: GovernedBlockDraft;
}

const GovernedContentView: React.FC<GovernedContentViewProps> = ({
  record,
  draft,
}) => {
  const { t } = useTranslation();
  const bodyContent = useMemo(() => renderRichText(draft.body), [draft.body]);
  const retired = isRetired(record);
  const retiredOn = record.retired
    ? HelperServices.getLocaldate(record.retired)
    : null;

  let notice = t(
    "Governed content is off. Blocks can’t be created, changed or retired."
  );
  if (retired) {
    notice = retiredOn
      ? t(
          "Retired on {{date}}. It comes off each form the next time the form is opened and saved.",
          { date: retiredOn }
        )
      : t(
          "Retired. It comes off each form the next time the form is opened and saved."
        );
  }

  const details = [
    { label: t("Name"), value: draft.name },
    { label: t("Heading"), value: draft.heading },
    { label: t("Body"), value: bodyContent },
    { label: t("Owner"), value: draft.owner },
    { label: t("Policy reference"), value: draft.policyReference },
    { label: t("Type"), value: t(REQUIREMENT_LABELS[record.requirement]) },
  ];

  return (
    <div className="ff-governed-form" data-testid="governed-content-view">
      <div className="ff-governed-form__heading">
        <h2 className="ff-governed-form__title">{t("View block")}</h2>
        {retired && <RetiredChip dataTestId="governed-view-retired" />}
      </div>

      <div
        className="ff-governed-alert ff-governed-form__notice"
        role="status"
        data-testid="governed-view-notice"
      >
        <p className="ff-governed-alert__text">{notice}</p>
      </div>

      <div className="ff-governed-form__layout">
        <dl className="ff-governed-view">
          {details.map(({ label, value }) => (
            <div className="ff-governed-view__field" key={label}>
              <dt>{label}</dt>
              <dd>{value || "—"}</dd>
            </div>
          ))}
        </dl>

        <GovernedContentPreview heading={draft.heading} body={draft.body} />
      </div>
    </div>
  );
};

export default GovernedContentView;
