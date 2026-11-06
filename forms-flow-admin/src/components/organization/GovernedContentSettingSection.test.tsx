import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "react-toastify";
import { GovernedContentSettingSection } from "./GovernedContentSettingSection";
import { updateGovernedContentSetting } from "../../services/organization";
import { fetchGovernedContentList } from "../../services/governedContent";

jest.mock("react-i18next", () => {
  const t = (key: string, options?: Record<string, string>) =>
    options ? key.replace(/{{(\w+)}}/g, (_match, name) => options[name]) : key;
  return { useTranslation: () => ({ t }) };
});

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("../../services/organization", () => ({
  updateGovernedContentSetting: jest.fn(),
}));

jest.mock("../../services/governedContent", () => ({
  ...jest.requireActual("../../services/governedContent"),
  fetchGovernedContentList: jest.fn(),
}));

// The shared stub's PromptModal renders nothing; this one exposes the dialog.
jest.mock("@formsflow/components", () => {
  const React = jest.requireActual("react");
  return {
    ...jest.requireActual("../../__mocks__/formsflowComponents.js"),
    PromptModal: ({
      show,
      title,
      message,
      dataTestId,
      primaryBtnText,
      primaryBtnAction,
      primaryBtndataTestid,
      secondaryBtnAction,
      secondoryBtndataTestid,
    }: any) =>
      show
        ? React.createElement(
            "div",
            { "data-testid": dataTestId },
            React.createElement("h2", null, title),
            React.createElement("div", null, message),
            React.createElement(
              "button",
              {
                "data-testid": secondoryBtndataTestid,
                onClick: secondaryBtnAction,
              },
              "Cancel"
            ),
            React.createElement(
              "button",
              {
                "data-testid": primaryBtndataTestid,
                onClick: primaryBtnAction,
              },
              primaryBtnText
            )
          )
        : null,
  };
});

const mockUpdate = updateGovernedContentSetting as jest.Mock;
const mockFetchList = fetchGovernedContentList as jest.Mock;

const block = (id: number, requirement: string, status = "active") => ({
  id,
  name: `Block ${id}`,
  requirement,
  status,
  version: 1,
  component: { type: "content", key: `k${id}` },
});

const getSwitch = () =>
  screen.getByTestId("organization-governed-content-switch");

describe("GovernedContentSettingSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("describes the current state", () => {
    const { rerender } = render(
      <GovernedContentSettingSection
        tenantKey="t1"
        enabled={false}
        onSaved={jest.fn()}
      />
    );
    expect(getSwitch()).toHaveTextContent("Governed content is off");
    expect(
      screen.getByTestId("organization-governed-content-description")
    ).toHaveTextContent("Turn on to create approved wording");

    rerender(
      <GovernedContentSettingSection
        tenantKey="t1"
        enabled
        onSaved={jest.fn()}
      />
    );
    expect(getSwitch()).toHaveTextContent("Governed content is on");
  });

  it("confirms turning on with the active required block count", async () => {
    const onSaved = jest.fn();
    mockFetchList.mockResolvedValue([
      block(1, "required"),
      block(2, "required"),
      block(3, "optional"),
      block(4, "required", "retired"),
    ]);
    mockUpdate.mockResolvedValue({});
    render(
      <GovernedContentSettingSection
        tenantKey="t1"
        enabled={false}
        onSaved={onSaved}
      />
    );

    fireEvent.click(getSwitch());
    expect(
      await screen.findByText(
        "Your library has 2 required blocks. They’ll be required on every form, and each form picks them up the next time someone opens and saves it."
      )
    ).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("governed-setting-turn-on"));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(mockUpdate).toHaveBeenCalledWith("t1", true);
    expect(toast.success).toHaveBeenCalledWith("Governed content turned on");
    expect(
      screen.queryByTestId("governed-setting-turn-on-modal")
    ).not.toBeInTheDocument();
  });

  it("still asks to turn on when the library can't be counted", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFetchList.mockRejectedValue(new Error("offline"));
    render(
      <GovernedContentSettingSection
        tenantKey="t1"
        enabled={false}
        onSaved={jest.fn()}
      />
    );

    fireEvent.click(getSwitch());
    expect(
      await screen.findByText(
        "Required blocks you create are added to every form the next time someone opens and saves it."
      )
    ).toBeInTheDocument();
  });

  it("confirms turning off, and Cancel keeps it on", async () => {
    render(
      <GovernedContentSettingSection
        tenantKey="t1"
        enabled
        onSaved={jest.fn()}
      />
    );

    fireEvent.click(getSwitch());
    expect(screen.getByText("Turn off governed content?")).toBeInTheDocument();
    expect(mockFetchList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("governed-setting-turn-off-cancel"));
    expect(
      screen.queryByTestId("governed-setting-turn-off-modal")
    ).not.toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("reports a failed save and keeps the dialog open", async () => {
    const onSaved = jest.fn();
    mockUpdate.mockRejectedValue({
      response: { data: { message: "Tenant not found" } },
    });
    render(
      <GovernedContentSettingSection tenantKey="t1" enabled onSaved={onSaved} />
    );

    fireEvent.click(getSwitch());
    fireEvent.click(screen.getByTestId("governed-setting-turn-off"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Tenant not found")
    );
    expect(mockUpdate).toHaveBeenCalledWith("t1", false);
    expect(onSaved).not.toHaveBeenCalled();
    expect(
      screen.getByTestId("governed-setting-turn-off-modal")
    ).toBeInTheDocument();
  });
});
