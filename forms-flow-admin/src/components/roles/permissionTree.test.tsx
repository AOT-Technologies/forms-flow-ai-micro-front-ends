import React from "react";
import { render, screen } from "@testing-library/react";
import PermissionTree from "./permissionTree";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const PERMISSIONS = [
  {
    name: "manage_users",
    description: "Users",
    depends_on: [],
    category: "ADMIN",
    order: 10,
  },
  {
    name: "manage_organization",
    description: "Organization (Billing)",
    depends_on: [],
    category: "ADMIN",
    order: 40,
  },
];

describe("PermissionTree", () => {
  // Single-tenant used to hide it; the default single-tenant admin holds it.
  it("shows Organization (Billing), checked when granted", () => {
    render(
      <PermissionTree
        permissions={PERMISSIONS}
        payload={{ permissions: ["manage_organization"] }}
        handlePermissionCheck={jest.fn()}
        setPayload={jest.fn()}
      />
    );

    expect(
      screen.getByTestId("checkbox-child-manage_organization")
    ).toBeChecked();
    expect(screen.getByTestId("checkbox-child-manage_users")).not.toBeChecked();
  });
});
