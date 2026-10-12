import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Form } from "react-bootstrap";
import { Switch } from "@formsflow/components";

export const PRIVACY_NOTICE_MAX_LENGTH = 300;

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

interface AiPermissionsSectionProps {
  value: AiPermissions;
  onChange: (value: AiPermissions) => void;
}

/**
 * AI permission controls for the organization page. Submitter chat depends on AI
 * assistance being on, and the privacy notice depends on submitter chat, so each
 * control is disabled until the one above it is enabled.
 */
export const AiPermissionsSection: React.FC<AiPermissionsSectionProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const { aiAssistanceEnabled, submitterChatEnabled, privacyNotice } = value;
  const privacyNoticeDisabled = !aiAssistanceEnabled || !submitterChatEnabled;
  const remainingCharacters = PRIVACY_NOTICE_MAX_LENGTH - privacyNotice.length;

  const handleAssistanceChange = useCallback(
    (checked: boolean) => onChange({ ...value, aiAssistanceEnabled: checked }),
    [onChange, value]
  );

  const handleSubmitterChatChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, submitterChatEnabled: e.target.checked }),
    [onChange, value]
  );

  const handlePrivacyNoticeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onChange({ ...value, privacyNotice: e.target.value }),
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
        <Form.Check
          type="checkbox"
          id="organization-ai-submitter-chat"
          label={t("Allow Submitter AI chat in your organization")}
          checked={submitterChatEnabled}
          disabled={!aiAssistanceEnabled}
          onChange={handleSubmitterChatChange}
          aria-describedby="organization-ai-submitter-chat-description"
          data-testid="organization-ai-submitter-chat-checkbox"
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
            htmlFor="organization-ai-privacy-notice"
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
        <Form.Control
          as="textarea"
          id="organization-ai-privacy-notice"
          rows={4}
          maxLength={PRIVACY_NOTICE_MAX_LENGTH}
          value={privacyNotice}
          disabled={privacyNoticeDisabled}
          onChange={handlePrivacyNoticeChange}
          aria-describedby="organization-ai-privacy-notice-help organization-ai-privacy-notice-count"
          data-testid="organization-ai-privacy-notice-input"
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
    </div>
  );
};

export default AiPermissionsSection;
