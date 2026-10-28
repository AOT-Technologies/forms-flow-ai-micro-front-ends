import React from "react";
import { TextEncoder, TextDecoder } from "util";
import { render, screen } from "@testing-library/react";

// react-router needs these and jsdom lacks them; set before it loads.
Object.assign(global, { TextEncoder, TextDecoder });
/* eslint-disable @typescript-eslint/no-var-requires */
const { MemoryRouter, Route, Routes } = require("react-router-dom");

jest.mock("react-i18next", () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});

let mockRoles: string[] = [];
jest.mock("@formsflow/service", () => ({
  StorageService: {
    User: { USER_ROLE: "USER_ROLE" },
    get: (key: string) =>
      key === "USER_ROLE" ? JSON.stringify(mockRoles) : null,
  },
}));

jest.mock("@formsflow/components", () => ({
  BreadCrumbs: () => null,
  V8CustomButton: () => null,
}));

jest.mock("../../../constants", () => ({ MULTITENANCY_ENABLED: false }));

// The tab bodies have their own tests; here only which one renders matters.
jest.mock("../../dashboard", () => () => <div data-testid="dashboard-body" />);
jest.mock("../../roles", () => () => <div data-testid="roles-body" />);
jest.mock("../../users", () => () => <div data-testid="users-body" />);
jest.mock("../../organization", () => () => (
  <div data-testid="organization-body" />
));
jest.mock("../../style/StyleTab", () => () => <div data-testid="style-body" />);
jest.mock("../../appearance/AppearanceTab", () => () => (
  <div data-testid="appearance-body" />
));

const Manage = require("..").default;

const renderAt = (path: string, roles: string[]) => {
  mockRoles = roles;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin/:tab?"
          element={<Manage props={{}} setTab={jest.fn()} />}
        />
      </Routes>
    </MemoryRouter>
  );
};

const appearanceTab = () => screen.queryByRole("tab", { name: "Appearance" });

describe("Manage → Appearance permission", () => {
  it("shows the Appearance tab to manage_app_styling holders", () => {
    renderAt("/admin/appearance", ["manage_roles", "manage_app_styling"]);
    expect(appearanceTab()).toBeInTheDocument();
    expect(screen.getByTestId("appearance-body")).toBeInTheDocument();
  });

  it("hides it from other admins, even when opened by URL", () => {
    renderAt("/admin/appearance", ["manage_roles", "manage_organization"]);
    expect(appearanceTab()).not.toBeInTheDocument();
    expect(screen.queryByTestId("appearance-body")).not.toBeInTheDocument();
    expect(screen.getByTestId("roles-body")).toBeInTheDocument();
  });

  it("leaves the Style tab on its existing rule", () => {
    renderAt("/admin/style", ["manage_roles"]);
    expect(screen.getByRole("tab", { name: "Style" })).toBeInTheDocument();
    expect(appearanceTab()).not.toBeInTheDocument();
  });

  it("opens Appearance for a user whose only admin permission is app styling", () => {
    renderAt("/admin/roles", ["manage_app_styling"]);
    expect(screen.getByTestId("appearance-body")).toBeInTheDocument();
  });
});
