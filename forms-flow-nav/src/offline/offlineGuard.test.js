import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";

// "Not available offline" (FFF-3): the rules and the page.
let mockOnline = true;
let mockAllowed = true;
const mockConnectionListeners = new Set();
jest.mock("@formsflow/service", () => ({
  ConnectivityService: {
    isOnline: () => mockOnline,
    subscribe: (listener) => {
      mockConnectionListeners.add(listener);
      return () => mockConnectionListeners.delete(listener);
    },
  },
  OfflineSettingsService: {
    isOfflineAllowed: () => mockAllowed,
    subscribe: () => () => {},
  },
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (text) => text }),
}));

window._env_ = { REACT_APP_OFFLINE_ENABLED: "true" };
const {
  OFFLINE_MODE_EVENT,
  baseOf,
  isAllowedOffline,
  shouldBlockPage,
} = require("./offlineGuard");
const NotAvailableOffline = require("./NotAvailableOffline").default;

const goOffline = (offline) =>
  act(() => {
    mockOnline = !offline;
    mockConnectionListeners.forEach((listener) => listener());
  });

describe("offline guard rules", () => {
  beforeEach(() => {
    mockOnline = true;
    mockAllowed = true;
    localStorage.clear();
  });

  it("Submit pages work offline; every other page does not", () => {
    [
      "/",
      "/form",
      "/form/6ac633d2",
      "/form/6ac633d2/entries",
      "/form/6ac633d2/offline/9d2fc927",
      "/bundle/42",
      "/bundle/42/entries",
      "/tenant/acme/form",
      "/tenant/acme/form/6ac633d2/entries",
    ].forEach((path) => expect(isAllowedOffline(path)).toBe(true));
    [
      "/task",
      "/admin/organization",
      "/submissions",
      "/application/38",
      "/form/6ac633d2/submissions/1/resubmit",
      "/bundle/42/submission/7",
      "/formflow/create",
      "/draft",
      "/tenant/acme/task",
    ].forEach((path) => expect(isAllowedOffline(path)).toBe(false));
  });

  it("knows the tenant's base path", () => {
    expect(baseOf("/tenant/acme/task")).toBe("/tenant/acme/");
    expect(baseOf("/task")).toBe("/");
  });

  it("blocks only when offline (connection or Offline mode) and offline forms are on", () => {
    expect(shouldBlockPage("/task")).toBe(false); // online
    mockOnline = false;
    expect(shouldBlockPage("/task")).toBe(true);
    expect(shouldBlockPage("/form")).toBe(false);
    mockAllowed = false; // the organization turned offline forms off
    expect(shouldBlockPage("/task")).toBe(false);

    mockAllowed = true;
    mockOnline = true;
    localStorage.setItem("ff_offline_mode", "on"); // Offline mode switch
    expect(shouldBlockPage("/task")).toBe(true);
  });
});

describe("Not available offline page", () => {
  const ShowPath = () => (
    <span data-testid="path">{useLocation().pathname}</span>
  );
  const renderAt = (path) => {
    window.history.pushState({}, "", path);
    return render(
      <MemoryRouter initialEntries={[path]}>
        <NotAvailableOffline />
        <ShowPath />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    mockOnline = true;
    mockAllowed = true;
    localStorage.clear();
  });

  it("shows on Tasks when the connection goes, and goes away when it is back", () => {
    renderAt("/tenant/acme/task");
    expect(screen.queryByTestId("offline-guard")).not.toBeInTheDocument();

    goOffline(true);
    expect(
      screen.getByRole("heading", { name: "Not available offline" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page needs a connection. Your saved forms still work."
      )
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("offline-guard-go-to-submit"));
    expect(screen.getByTestId("path")).toHaveTextContent("/tenant/acme/form");

    goOffline(false);
    expect(screen.queryByTestId("offline-guard")).not.toBeInTheDocument();
  });

  it("follows the Offline mode switch in the same tab", () => {
    renderAt("/admin/organization");
    act(() => {
      localStorage.setItem("ff_offline_mode", "on");
      window.dispatchEvent(new Event(OFFLINE_MODE_EVENT));
    });
    expect(screen.getByTestId("offline-guard")).toBeInTheDocument();
  });

  it("never covers a Submit page", () => {
    renderAt("/form/6ac633d2");
    goOffline(true);
    expect(screen.queryByTestId("offline-guard")).not.toBeInTheDocument();
  });
});
