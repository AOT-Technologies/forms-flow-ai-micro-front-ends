import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

// A stable `t`: without an i18n instance react-i18next returns a new one per
// render, which would re-run the tab's load effect forever.
jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});

const mockToast = { success: jest.fn() };
jest.mock("react-toastify", () => ({
  toast: { success: (...args: unknown[]) => mockToast.success(...args) },
}));

jest.mock("@formsflow/components", () => ({
  ApplicationLogoFull: () => <span data-testid="formsflow-logo" />,
  ConfirmModal: ({
    show,
    message,
    primaryBtnText,
    primaryBtnAction,
    primaryBtndataTestid,
    secondaryBtnText,
    secondaryBtnAction,
    secondoryBtndataTestid,
  }: any) =>
    show ? (
      <div role="dialog">
        <p>{message}</p>
        <button data-testid={primaryBtndataTestid} onClick={primaryBtnAction}>
          {primaryBtnText}
        </button>
        <button
          data-testid={secondoryBtndataTestid}
          onClick={secondaryBtnAction}
        >
          {secondaryBtnText}
        </button>
      </div>
    ) : null,
  V8CustomButton: ({ label, onClick, disabled, dataTestId }: any) => (
    <button data-testid={dataTestId} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  ),
}));

const mockService = {
  applyBranding: jest.fn(),
  cacheBranding: jest.fn(),
};
jest.mock("@formsflow/service", () => ({
  BRANDING_UPDATED_EVENT: "ES_BRANDING_UPDATED",
  applyBranding: (...args: unknown[]) => mockService.applyBranding(...args),
  cacheBranding: (...args: unknown[]) => mockService.cacheBranding(...args),
}));

const mockApi = {
  fetchBranding: jest.fn(),
  saveBranding: jest.fn(),
  resetBranding: jest.fn(),
};
jest.mock("../../../services/appearance", () => ({
  fetchBranding: () => mockApi.fetchBranding(),
  saveBranding: (...args: unknown[]) => mockApi.saveBranding(...args),
  resetBranding: () => mockApi.resetBranding(),
}));

// The live preview boots a whole app in an iframe; not under test here.
jest.mock("../LivePreview", () => () => <div data-testid="live-preview" />);

import AppearanceTab from "../AppearanceTab";

const DEFAULTS = {
  displayName: null,
  buttonShape: null,
  logoUrl: null,
  logoName: null,
  logoUploadEnabled: true,
};

const alert = () => screen.queryByTestId("appearance-logo-alert");

const renderTab = async (saved = DEFAULTS) => {
  mockApi.fetchBranding.mockResolvedValue(saved);
  const publish = jest.fn();
  render(<AppearanceTab tenantKey="acme" publish={publish} homeUrl="/home" />);
  // Let the load finish before interacting, or it would overwrite the edits.
  await act(async () => {
    await Promise.resolve();
  });
  return { publish, name: screen.getByTestId("appearance-display-name") };
};

describe("AppearanceTab", () => {
  beforeEach(() => jest.clearAllMocks());

  it("loads the saved branding into the editor", async () => {
    const { name } = await renderTab({ ...DEFAULTS, displayName: "Acme" });
    await waitFor(() => expect(name).toHaveValue("Acme"));
  });

  it("enables Update only after a change", async () => {
    const { name } = await renderTab();
    expect(screen.getByTestId("appearance-update")).toBeDisabled();
    fireEvent.change(name, { target: { value: "Acme" } });
    expect(screen.getByTestId("appearance-update")).toBeEnabled();
  });

  it("saves, applies the branding in place and confirms with a toast", async () => {
    const saved = { ...DEFAULTS, displayName: "Acme", buttonShape: "square" };
    mockApi.saveBranding.mockResolvedValue(saved);
    const { name, publish } = await renderTab();

    fireEvent.change(name, { target: { value: "Acme" } });
    fireEvent.click(screen.getByRole("radio", { name: "Square" }));
    fireEvent.click(screen.getByTestId("appearance-update"));

    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith("ES_BRANDING_UPDATED", saved)
    );
    expect(mockApi.saveBranding).toHaveBeenCalledWith(
      { displayName: "Acme", buttonShape: "square" },
      null,
      false
    );
    expect(mockService.cacheBranding).toHaveBeenCalledWith(saved, "acme");
    expect(mockService.applyBranding).toHaveBeenCalledWith(saved);
    expect(mockToast.success).toHaveBeenCalledWith(
      "Appearance updated successfully"
    );
    expect(alert()).not.toBeInTheDocument();
  });

  it("keeps the draft and shows the server's message in the error alert", async () => {
    mockApi.saveBranding.mockRejectedValue({
      response: { data: { details: [{ message: "Display name too long" }] } },
    });
    const { name, publish } = await renderTab();

    fireEvent.change(name, { target: { value: "Acme" } });
    fireEvent.click(screen.getByTestId("appearance-update"));

    expect(
      await screen.findByTestId("appearance-logo-alert")
    ).toHaveTextContent("Display name too long");
    expect(name).toHaveValue("Acme");
    expect(publish).not.toHaveBeenCalled();
    expect(mockService.applyBranding).not.toHaveBeenCalled();
  });

  it("shows the error alert when the settings can't be loaded", async () => {
    mockApi.fetchBranding.mockRejectedValue(new Error("network"));
    render(<AppearanceTab tenantKey="acme" homeUrl="/home" />);
    expect(
      await screen.findByTestId("appearance-logo-alert")
    ).toHaveTextContent("Appearance settings could not be loaded");
  });

  it("disables Restore when nothing is customised", async () => {
    await renderTab();
    expect(screen.getByTestId("appearance-restore")).toBeDisabled();
  });

  it("asks for confirmation, then restores the default appearance", async () => {
    mockApi.resetBranding.mockResolvedValue(DEFAULTS);
    const { publish } = await renderTab({ ...DEFAULTS, buttonShape: "square" });

    fireEvent.click(screen.getByTestId("appearance-restore"));
    expect(
      screen.getByText("Are you sure you want to restore to default state?")
    ).toBeInTheDocument();
    expect(mockApi.resetBranding).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("appearance-restore-confirm"));
    await waitFor(() =>
      expect(publish).toHaveBeenCalledWith("ES_BRANDING_UPDATED", DEFAULTS)
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockToast.success).toHaveBeenCalledWith(
      "Appearance updated successfully"
    );
  });

  it("cancelling the confirmation keeps the current appearance", async () => {
    await renderTab({ ...DEFAULTS, buttonShape: "square" });
    fireEvent.click(screen.getByTestId("appearance-restore"));
    fireEvent.click(screen.getByTestId("appearance-restore-cancel"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockApi.resetBranding).not.toHaveBeenCalled();
  });

  it("shows the error alert when restoring fails", async () => {
    mockApi.resetBranding.mockRejectedValue(new Error("boom"));
    await renderTab({ ...DEFAULTS, buttonShape: "square" });
    fireEvent.click(screen.getByTestId("appearance-restore"));
    fireEvent.click(screen.getByTestId("appearance-restore-confirm"));
    expect(
      await screen.findByTestId("appearance-logo-alert")
    ).toHaveTextContent("Appearance could not be restored. Please try again.");
  });

  it("shows the saved logo with its file name, and the formsflow logo above", async () => {
    await renderTab({
      ...DEFAULTS,
      logoUrl: "https://cdn.example.com/branding/acme/logo-1.png",
      logoName: "acme.png",
    });
    expect(await screen.findByText("acme.png")).toBeInTheDocument();
    expect(screen.getByTestId("formsflow-logo")).toBeInTheDocument();
  });

  it("deleting the saved logo is applied on Update", async () => {
    mockApi.saveBranding.mockResolvedValue(DEFAULTS);
    await renderTab({
      ...DEFAULTS,
      logoUrl: "https://cdn.example.com/branding/acme/logo-1.png",
      logoName: "acme.png",
    });
    fireEvent.click(await screen.findByTestId("appearance-logo-discard"));
    fireEvent.click(screen.getByTestId("appearance-update"));

    await waitFor(() =>
      expect(mockApi.saveBranding).toHaveBeenCalledWith(
        expect.anything(),
        null,
        true
      )
    );
  });

  it("explains when logo upload is not configured", async () => {
    await renderTab({ ...DEFAULTS, logoUploadEnabled: false });
    expect(
      await screen.findByText(
        "Logo upload is not configured for this installation."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("appearance-logo-dropzone")).toBeDisabled();
  });
});
