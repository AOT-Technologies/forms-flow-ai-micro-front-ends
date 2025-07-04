import React from "react";
 import { render, screen, fireEvent } from "@testing-library/react";
import { CustomTabs } from "../components/CustomComponents/Tabs";

 
describe("CustomTabs component", () => {
  const mockTabs = [
    { eventKey: "tab1", title: "Tab 1", content: "Content 1" },
    { eventKey: "tab2", title: "Tab 2", content: <div>React Node Content</div> },
  ];

  it("renders all tabs with correct titles", () => {
    render(
      <CustomTabs defaultActiveKey="tab1" tabs={mockTabs} />
    );
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
  });

  it("shows correct content for default active tab", () => {
    render(
      <CustomTabs defaultActiveKey="tab1" tabs={mockTabs} />
    );
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("switches content when clicking different tab", () => {
    render(
      <CustomTabs defaultActiveKey="tab1" tabs={mockTabs} />
    );
    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("React Node Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <CustomTabs defaultActiveKey="tab1" tabs={mockTabs} className="test-class" />
    );
    expect(screen.getByRole("tablist")).toHaveClass("test-class");
  });

 
  it("renders with custom data-testid and aria-label", () => {
    render(
      <CustomTabs
        defaultActiveKey="tab1"
        tabs={mockTabs}
        dataTestId="custom-tabs"
        ariaLabel="Test Tabs"
      />
    );
    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveAttribute("data-testid", "custom-tabs");
    expect(tablist).toHaveAttribute("aria-label", "Test Tabs");
  });

  it("renders individual tabs with correct data-testid", () => {
    render(
      <CustomTabs
        defaultActiveKey="tab1"
        tabs={mockTabs}
        dataTestId="custom-tabs"
      />
    );
    expect(screen.getByTestId("custom-tabs-tab-tab1")).toBeInTheDocument();
    expect(screen.getByTestId("custom-tabs-tab-tab2")).toBeInTheDocument();
  });

 
});
