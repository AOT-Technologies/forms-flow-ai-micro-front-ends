import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  AiPermissionsSection,
  AiPermissions,
  DEFAULT_AI_PERMISSIONS,
  PRIVACY_NOTICE_MAX_LENGTH,
} from "./AiPermissionsSection";

// No i18n instance is initialised in tests, so supply a t() that interpolates.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      key.replace(/{{(\w+)}}/g, (_, name) => String(options?.[name] ?? "")),
  }),
}));

const Harness = ({ initial = DEFAULT_AI_PERMISSIONS }) => {
  const [value, setValue] = useState<AiPermissions>(initial);
  return <AiPermissionsSection value={value} onChange={setValue} />;
};

const getSwitch = () => screen.getByTestId("organization-ai-assistance-switch");
const getCheckbox = () =>
  screen.getByTestId("organization-ai-submitter-chat-checkbox");
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
});
