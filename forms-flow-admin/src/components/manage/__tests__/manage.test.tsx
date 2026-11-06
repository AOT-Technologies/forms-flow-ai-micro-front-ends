import React from "react";
import { TextEncoder, TextDecoder } from "util";
import { fireEvent, render, screen } from "@testing-library/react";

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
  V8CustomButton: ({ dataTestId, label, onClick }: any) => (
    <button data-testid={dataTestId} onClick={onClick}>
      {label}
    </button>
  ),
}));

jest.mock("../../../constants", () => ({
  MULTITENANCY_ENABLED: false,
  MANAGE_GOVERNED_CONTENT: "manage_governed_content",
}));

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
jest.mock("../../governedContent", () => ({
  __esModule: true,
  NEW_BLOCK_ID: "new",
  default: ({ basePath, blockId }: any) => (
    <div data-testid="content-body">{`${basePath}|${blockId ?? ""}`}</div>
  ),
}));

const Manage = require("..").default;

const LocationProbe = () => {
  const { useLocation } = require("react-router-dom");
  return <div data-testid="location">{useLocation().pathname}</div>;
};

const renderAt = (path: string, roles: string[]) => {
  mockRoles = roles;
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin/:tab?"
          element={<Manage props={{}} setTab={jest.fn()} />}
        />
        <Route
          path="/admin/content/:blockId"
          element={<Manage props={{}} setTab={jest.fn()} />}
        />
      </Routes>
      <LocationProbe />
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

const contentTab = () => screen.queryByRole("tab", { name: "Content" });

describe("Manage → Content (governed content) permission", () => {
  it("shows the Content tab and library to manage_governed_content holders", () => {
    renderAt("/admin/content", ["manage_roles", "manage_governed_content"]);
    expect(contentTab()).toBeInTheDocument();
    expect(screen.getByTestId("content-body")).toHaveTextContent(
      "/admin/content|"
    );
  });

  it("hides it from other admins, even when opened by URL", () => {
    renderAt("/admin/content", ["manage_roles", "manage_organization"]);
    expect(contentTab()).not.toBeInTheDocument();
    expect(screen.queryByTestId("content-body")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("governed-content-create-button")
    ).not.toBeInTheDocument();
  });

  it("does not open a block by URL without the permission", () => {
    renderAt("/admin/content/new", ["manage_roles"]);
    expect(screen.queryByTestId("content-body")).not.toBeInTheDocument();
    expect(screen.getByTestId("roles-body")).toBeInTheDocument();
  });

  it("opens Content for a user whose only admin permission is governed content", () => {
    renderAt("/admin/roles", ["manage_governed_content"]);
    expect(screen.getByTestId("content-body")).toBeInTheDocument();
  });

  it("goes to the new block screen from Create new block", () => {
    renderAt("/admin/content", ["manage_governed_content"]);
    fireEvent.click(screen.getByTestId("governed-content-create-button"));
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/admin/content/new"
    );
    expect(screen.getByTestId("content-body")).toHaveTextContent(
      "/admin/content|new"
    );
  });

  it("keeps the Content tab selected on a block screen, without Create new block", () => {
    renderAt("/admin/content/12", ["manage_governed_content"]);
    expect(contentTab()).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("content-body")).toHaveTextContent(
      "/admin/content|12"
    );
    expect(
      screen.queryByTestId("governed-content-create-button")
    ).not.toBeInTheDocument();
  });
});
