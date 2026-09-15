import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuComponent from "./MenuComponent";

// The Phase 3 design replaced the Build/Analyze accordions with flat sections:
// the section name is a plain label and its children are always visible rows.
// These tests pin that structure so it cannot silently regress to an accordion.

const renderMenu = (props, route = "/") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <ul>
        <MenuComponent baseUrl="/" collapsed={false} {...props} />
      </ul>
    </MemoryRouter>
  );

const BUILD_SUBMENU = [
  { name: "Forms", path: "formflow" },
  { name: "Bundles", path: "bundleflow", isPremium: true },
  { name: "Subflows", path: "subflow" },
  { name: "Decision Tables", path: "decision-table" },
];

describe("MenuComponent - plain row", () => {
  const props = {
    eventKey: "home",
    mainMenu: "Home",
    optionsCount: "0",
    subMenu: [{ name: "Home", path: "home" }],
  };

  it("renders a single link to its only target", () => {
    renderMenu(props);
    const link = screen.getByTestId("accordion-header-home");
    expect(link).toHaveAttribute("href", "/home");
  });

  it("marks itself current when the route matches", () => {
    renderMenu(props, "/home");
    expect(screen.getByTestId("accordion-header-home")).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders no badge when badgeCount is omitted", () => {
    renderMenu(props);
    expect(
      screen.queryByTestId("menu-badge-accordion-header-home")
    ).not.toBeInTheDocument();
  });

  it("renders the badge when a count is supplied", () => {
    renderMenu({ ...props, badgeCount: 12 });
    expect(
      screen.getByTestId("menu-badge-accordion-header-home")
    ).toHaveTextContent("12");
    expect(document.querySelectorAll(".menu-badge-dot")).toHaveLength(0);
  });

  it("swaps the count pill for a dot when collapsed", () => {
    renderMenu({ ...props, collapsed: true, badgeCount: 12 });
    expect(
      screen.queryByTestId("menu-badge-accordion-header-home")
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll(".menu-badge-dot")).toHaveLength(1);
  });

  it("renders no dot when collapsed without a count", () => {
    renderMenu({ ...props, collapsed: true });
    expect(document.querySelectorAll(".menu-badge-dot")).toHaveLength(0);
  });
});

describe("MenuComponent - collapsed tooltip", () => {
  // The nav no longer widens on hover, so the collapsed rail must carry the
  // label itself; the reveal is CSS, but the element has to be in the DOM.
  it("renders a flyout carrying the label for a plain row", () => {
    renderMenu({
      eventKey: "home",
      mainMenu: "Home",
      optionsCount: "0",
      subMenu: [{ name: "Home", path: "home" }],
      collapsed: true,
    });
    const flyouts = document.querySelectorAll(".menu-flyout");
    expect(flyouts).toHaveLength(1);
    expect(flyouts[0]).toHaveTextContent("Home");
  });

  it("renders no flyout when expanded", () => {
    renderMenu({
      eventKey: "home",
      mainMenu: "Home",
      optionsCount: "0",
      subMenu: [{ name: "Home", path: "home" }],
    });
    expect(document.querySelectorAll(".menu-flyout")).toHaveLength(0);
  });
});

describe("MenuComponent - section", () => {
  const props = {
    eventKey: "build",
    mainMenu: "Build",
    optionsCount: "5",
    subMenu: BUILD_SUBMENU,
  };

  it("renders the section name as a label, not a button", () => {
    renderMenu(props);
    const title = screen.getByTestId("menu-section-build");
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe("P");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows every child row without needing to expand", () => {
    renderMenu(props);
    const group = screen.getByRole("list", { name: "Build" });
    const links = within(group).getAllByRole("link");
    expect(links).toHaveLength(4);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "/formflow",
      "/bundleflow",
      "/subflow",
      "/decision-table",
    ]);
  });

  it("keeps the sidenav-<name> test ids used by existing tests", () => {
    renderMenu(props);
    expect(screen.getByTestId("sidenav-forms")).toBeInTheDocument();
    expect(screen.getByTestId("sidenav-decision-tables")).toBeInTheDocument();
  });

  it("marks only the matching child as current", () => {
    renderMenu(props, "/subflow");
    expect(screen.getByTestId("sidenav-subflows")).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByTestId("sidenav-forms")).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("never renders a badge on a section, collapsed or not", () => {
    renderMenu({ ...props, collapsed: true, badgeCount: 12 }, "/");
    expect(
      screen.queryByTestId("menu-badge-accordion-header-build")
    ).not.toBeInTheDocument();
    expect(document.querySelectorAll(".menu-badge-dot")).toHaveLength(0);
  });

  it("hides the section label and shows flyouts when collapsed", () => {
    renderMenu({ ...props, collapsed: true });
    expect(screen.getByTestId("menu-section-build")).toBeInTheDocument();
    expect(screen.getByTestId("menu-section-build")).not.toBeVisible();
    // one flyout per child row
    expect(document.querySelectorAll(".menu-flyout")).toHaveLength(4);
  });
});
