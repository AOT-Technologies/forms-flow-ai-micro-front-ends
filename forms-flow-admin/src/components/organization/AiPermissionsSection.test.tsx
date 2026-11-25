import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AiPermissionsSection,
  AiPermissions,
  DEFAULT_AI_PERMISSIONS,
  PRIVACY_NOTICE_MAX_LENGTH,
  fromTenantData,
} from "./AiPermissionsSection";

// No i18n instance is initialised in tests, so supply a t() that interpolates.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/{{(\w+)}}/g, (_, name) => String(options?.[name] ?? "")),
  }),
}));

// Functional stand-in for the shared stub so the Save button can be clicked.
jest.mock("@formsflow/components", () => {
  const React = jest.requireActual("react");
  return {
    ...jest.requireActual("../../__mocks__/formsflowComponents.js"),
    V8CustomButton: ({ label, onClick, disabled, dataTestId }: any) =>
      React.createElement(
        "button",
        { type: "button", onClick, disabled, "data-testid": dataTestId },
        label
      ),
  };
});

// Mirrors the organization page: Save commits the current value as the saved one.
const Harness = ({ initial = DEFAULT_AI_PERMISSIONS, onSave = jest.fn() }) => {
  const [value, setValue] = useState<AiPermissions>(initial);
  const [savedValue, setSavedValue] = useState<AiPermissions>(initial);
  return (
    <AiPermissionsSection
      value={value}
      savedValue={savedValue}
      onChange={setValue}
      onSave={(payload) => {
        onSave(payload);
        setSavedValue(value);
      }}
    />
  );
};

const getSave = () =>
  screen.getByTestId("organization-ai-permissions-save-btn");

const getSwitch = () => screen.getByTestId("organization-ai-assistance-switch");
const getCheckbox = () =>
  screen.getByTestId("organization-ai-submitter-chat-inline-checkbox-1");
const getPrivacyNotice = () =>
  screen.getByTestId("organization-ai-privacy-notice-input");

describe("AiPermissionsSection", () => {
  it("starts with AI assistance off and the dependent controls disabled", () => {
    render(<Harness />);
    expect(getSwitch()).toHaveAttribute("aria-checked", "false");
    expect(getSwitch()).toHaveTextContent(
      "AI Form submissions assistance is OFF for your organization"
    );
    expect(getCheckbox()).toBeDisabled();
    expect(getPrivacyNotice()).toBeDisabled();
  });

  it("enables submitter chat once AI assistance is turned on", () => {
    render(<Harness />);
    fireEvent.click(getSwitch());
    expect(getSwitch()).toHaveTextContent(
      "AI Form submissions assistance is ON for your organization"
    );
    expect(getCheckbox()).toBeEnabled();
    expect(getPrivacyNotice()).toBeDisabled();
  });

  it("shows the feature description only while AI assistance is off", () => {
    render(<Harness />);
    expect(
      screen.getByTestId("organization-ai-assistance-description")
    ).toBeInTheDocument();
    fireEvent.click(getSwitch());
    expect(
      screen.queryByTestId("organization-ai-assistance-description")
    ).not.toBeInTheDocument();
  });

  it("enables the privacy notice only when submitter chat is allowed", () => {
    render(<Harness />);
    fireEvent.click(getSwitch());
    fireEvent.click(getCheckbox());
    expect(getCheckbox()).toBeChecked();
    expect(getPrivacyNotice()).toBeEnabled();

    fireEvent.click(getSwitch());
    expect(getCheckbox()).toBeDisabled();
    expect(getPrivacyNotice()).toBeDisabled();
  });

  it("caps the privacy notice and shows the remaining characters", () => {
    render(
      <Harness
        initial={{
          aiAssistanceEnabled: true,
          submitterChatEnabled: true,
          privacyNotice: "",
        }}
      />
    );
    expect(getPrivacyNotice()).toHaveAttribute(
      "maxLength",
      String(PRIVACY_NOTICE_MAX_LENGTH)
    );
    fireEvent.change(getPrivacyNotice(), { target: { value: "Hello" } });
    expect(
      screen.getByTestId("organization-ai-privacy-notice-count")
    ).toHaveTextContent(`${PRIVACY_NOTICE_MAX_LENGTH - 5} characters`);
  });

  it("keeps Save disabled until an AI setting changes", () => {
    render(<Harness />);
    expect(getSave()).toHaveTextContent("Save");
    expect(getSave()).toBeDisabled();
  });

  it("enables Save when the switch is toggled and disables it when toggled back", () => {
    render(<Harness />);
    fireEvent.click(getSwitch());
    expect(getSave()).toBeEnabled();
    fireEvent.click(getSwitch());
    expect(getSave()).toBeDisabled();
  });

  it("enables Save for checkbox and privacy notice changes", () => {
    render(
      <Harness
        initial={{
          aiAssistanceEnabled: true,
          submitterChatEnabled: true,
          privacyNotice: "",
        }}
      />
    );
    fireEvent.change(getPrivacyNotice(), { target: { value: "Notice" } });
    expect(getSave()).toBeEnabled();
    fireEvent.change(getPrivacyNotice(), { target: { value: "" } });
    expect(getSave()).toBeDisabled();
    fireEvent.click(getCheckbox());
    expect(getSave()).toBeEnabled();
  });

  it("saves the change and disables Save again", () => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(getSwitch());
    fireEvent.click(getSave());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(getSave()).toBeDisabled();
  });

  it("passes the settings to onSave as a snake_case object", () => {
    const onSave = jest.fn();
    render(<Harness onSave={onSave} />);
    fireEvent.click(getSwitch());
    fireEvent.click(getCheckbox());
    fireEvent.change(getPrivacyNotice(), { target: { value: "Notice" } });
    fireEvent.click(getSave());
    expect(onSave).toHaveBeenCalledWith({
      submission_assistant: true,
      submitter_chat: true,
      privacy_notice: "Notice",
    });
  });
});

describe("fromTenantData", () => {
  it("reads the AI settings from the tenant details", () => {
    expect(
      fromTenantData({
        key: "acme",
        details: {
          submission_assistant: true,
          submitter_chat: true,
          privacy_notice: "Notice",
        },
      })
    ).toEqual({
      aiAssistanceEnabled: true,
      submitterChatEnabled: true,
      privacyNotice: "Notice",
    });
  });

  it("falls back to top-level fields", () => {
    expect(
      fromTenantData({ submission_assistant: true, submitter_chat: false })
    ).toEqual({
      aiAssistanceEnabled: true,
      submitterChatEnabled: false,
      privacyNotice: "",
    });
  });

  it('parses string-valued flags, treating "false" as disabled', () => {
    expect(
      fromTenantData({
        details: { submission_assistant: "true", submitter_chat: "false" },
      })
    ).toEqual({
      aiAssistanceEnabled: true,
      submitterChatEnabled: false,
      privacyNotice: "",
    });
  });

  it("returns the defaults when the record has no AI settings", () => {
    expect(fromTenantData(null)).toEqual(DEFAULT_AI_PERMISSIONS);
    expect(fromTenantData({ details: { locale: "en" } })).toEqual(
      DEFAULT_AI_PERMISSIONS
    );
  });
});
