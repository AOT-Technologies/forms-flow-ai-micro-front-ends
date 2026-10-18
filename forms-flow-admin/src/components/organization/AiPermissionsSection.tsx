import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "react-bootstrap";
import {
  Switch,
  V8CustomButton,
  CustomCheckbox,
  CustomTextArea,
} from "@formsflow/components";
import { AI_ASSISTANT_PRIVACY_NOTICE_LENGTH } from "../../constants";


/** Env-configured limit; falls back to the default when unset or not a positive number. */
export const PRIVACY_NOTICE_MAX_LENGTH = AI_ASSISTANT_PRIVACY_NOTICE_LENGTH;

export interface AiPermissions {
  /** Organization-wide AI form submissions assistance */
  aiAssistanceEnabled: boolean;
  /** Lets form submitters chat with the AI assistant */
  submitterChatEnabled: boolean;
  /** Shown to submitters every time the AI submitter chat is opened */
  privacyNotice: string;
}

export const DEFAULT_AI_PERMISSIONS: AiPermissions = {
  aiAssistanceEnabled: false,
  submitterChatEnabled: false,
  privacyNotice: "",
};

/** True when any AI setting - the switch, the checkbox or the notice - differs. */
export const hasAiPermissionsChanged = (
  current: AiPermissions,
  saved: AiPermissions
): boolean =>
  current.aiAssistanceEnabled !== saved.aiAssistanceEnabled ||
  current.submitterChatEnabled !== saved.submitterChatEnabled ||
  current.privacyNotice !== saved.privacyNotice;

const SUBMITTER_CHAT_VALUE = "allowSubmitterChat";
// Module scope keeps the reference stable for the memoized CustomCheckbox, which
// translates the label itself.
const SUBMITTER_CHAT_ITEMS = [
  {
    label: "Allow Submitter AI chat in your organization",
    value: SUBMITTER_CHAT_VALUE,
  },
];

interface AiPermissionsSectionProps {
  value: AiPermissions;
  /** Last saved settings; Save stays disabled while `value` matches them */
  savedValue: AiPermissions;
  onChange: (value: AiPermissions) => void;
  onSave: () => void;
  saving?: boolean;
}

/**
 * AI permission controls for the organization page. Submitter chat depends on AI
 * assistance being on, and the privacy notice depends on submitter chat, so each
 * control is disabled until the one above it is enabled.
 */
export const AiPermissionsSection: React.FC<AiPermissionsSectionProps> = ({
  value,
  savedValue,
  onChange,
  onSave,
  saving = false,
}) => {
  const { t } = useTranslation();
  const { aiAssistanceEnabled, submitterChatEnabled, privacyNotice } = value;
  const privacyNoticeDisabled = !aiAssistanceEnabled || !submitterChatEnabled;
  const remainingCharacters = PRIVACY_NOTICE_MAX_LENGTH - privacyNotice.length;
  const saveDisabled = !hasAiPermissionsChanged(value, savedValue);

  const handleAssistanceChange = useCallback(
    (checked: boolean) => onChange({ ...value, aiAssistanceEnabled: checked }),
    [onChange, value]
  );

  const submitterChatSelected = useMemo(
    () => (submitterChatEnabled ? [SUBMITTER_CHAT_VALUE] : []),
    [submitterChatEnabled]
  );

  const handleSubmitterChatChange = useCallback(
    (selected: string[]) =>
      onChange({
        ...value,
        submitterChatEnabled: selected.includes(SUBMITTER_CHAT_VALUE),
      }),
    [onChange, value]
  );

  const handlePrivacyNoticeChange = useCallback(
    (privacyNoticeText: string) =>
      onChange({ ...value, privacyNotice: privacyNoticeText }),
    [onChange, value]
  );

  return (
    <div className="ai-permissions" data-testid="organization-ai-permissions">
      <div
        className={`ai-permissions-card${
          aiAssistanceEnabled ? " ai-permissions-card--on" : ""
        }`}
      >
        <Switch
          id="organization-ai-assistance-switch"
          className="ai-permissions-switch"
          checked={aiAssistanceEnabled}
          onChange={handleAssistanceChange}
          label={
            aiAssistanceEnabled
              ? t("AI Form submissions assistance is ON for your organization")
              : t("AI Form submissions assistance is OFF for your organization")
          }
          dataTestId="organization-ai-assistance-switch"
        />
        {!aiAssistanceEnabled && (
          <p
            className="ai-permissions-description"
            data-testid="organization-ai-assistance-description"
          >
            {t(
              "This feature allows form creators to add context to their forms. This context allows an AI assistant to help those submitting the form."
            )}
          </p>
        )}
      </div>

      <div className="ai-permissions-option">
        <CustomCheckbox
          id="organization-ai-submitter-chat"
          name="organization-ai-submitter-chat"
          items={SUBMITTER_CHAT_ITEMS}
          selectedValues={submitterChatSelected}
          onChange={handleSubmitterChatChange}
          disabled={!aiAssistanceEnabled}
          size="small"
          variant="secondary"
          ariaLabel={t("Allow Submitter AI chat in your organization")}
          aria-describedby="organization-ai-submitter-chat-description"
          dataTestId="organization-ai-submitter-chat"
        />
        <p
          id="organization-ai-submitter-chat-description"
          className={`ai-permissions-hint${
            aiAssistanceEnabled ? "" : " is-disabled"
          }`}
        >
          {t(
            "This allows form submitters to chat with the AI assistant to get help when submitting a form."
          )}
        </p>
      </div>

      <div className="ai-permissions-privacy">
        <div className="ai-permissions-privacy-header">
          <Form.Label
            htmlFor="organization-ai-privacy-notice-input-textarea"
            className={privacyNoticeDisabled ? "is-disabled" : undefined}
          >
            {t("Privacy Notice")}
          </Form.Label>
          <span
            id="organization-ai-privacy-notice-count"
            className={`textarea-count${
              privacyNoticeDisabled ? " is-disabled" : ""
            }`}
            aria-live="polite"
            data-testid="organization-ai-privacy-notice-count"
          >
            {t("{{count}} characters", { count: remainingCharacters })}
          </span>
        </div>
        {/* CustomTextArea derives the textarea id from dataTestId
            ("<dataTestId>-textarea"), which the label above targets. */}
        <CustomTextArea
          value={privacyNotice}
          setValue={handlePrivacyNoticeChange}
          rows={4}
          maxLength={PRIVACY_NOTICE_MAX_LENGTH}
          disabled={privacyNoticeDisabled}
          ariaLabel={t("Privacy Notice")}
          className="ai-permissions-privacy-input"
          dataTestId="organization-ai-privacy-notice-input"
        />
        <p
          id="organization-ai-privacy-notice-help"
          className={`ai-permissions-hint${
            privacyNoticeDisabled ? " is-disabled" : ""
          }`}
        >
          {t(
            "Explain to the submitter how the information they provide to the AI is used and stored in your organization. This Privacy Notice appears every time AI Submitter Chat is accessed."
          )}
        </p>
      </div>

      <div className="ai-permissions-actions">
        <V8CustomButton
          label={t("Save")}
          variant="primary"
          onClick={onSave}
          disabled={saveDisabled}
          loading={saving}
          dataTestId="organization-ai-permissions-save-btn"
        />
      </div>
    </div>
  );
};

export default AiPermissionsSection;
