import React from "react";
import { render, screen } from "@testing-library/react";
import { CustomInfo } from "../components/CustomComponents/CustomInfo";
 

describe("CustomInfo component", () => {
  it("renders with basic props", () => {
    const { container } = render(
      <CustomInfo heading="Test Heading" content="Test Content" />
    );
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(container.querySelector(".info-panel")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <CustomInfo
        heading="Test Heading"
        content="Test Content"
        className="custom-class"
      />
    );
    expect(container.querySelector(".info-panel")).toHaveClass("custom-class");
  });

 
  it("renders InfoIcon", () => {
    const { container } = render(
      <CustomInfo heading="Test Heading" content="Test Content" />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("handles empty content", () => {
    render(<CustomInfo heading="Test Heading" content="" />);
    expect(screen.getByText("Test Heading")).toBeInTheDocument();
    expect(screen.queryByText("Test Content")).not.toBeInTheDocument();
  });

 
});
