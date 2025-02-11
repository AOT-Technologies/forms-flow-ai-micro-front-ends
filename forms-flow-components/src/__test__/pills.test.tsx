import React from "react";
 
import { render, fireEvent } from "@testing-library/react";
import { CustomPill } from "../components/CustomComponents/Pills";

 
describe("CustomPill component", () => {
  it("renders basic pill with primary label", () => {
    const { getByText } = render(
      <CustomPill label="Test Label" bg="primary" secondaryLabel="" />
    );
    expect(getByText("Test Label")).toBeInTheDocument();
  });

  it("renders pill with both primary and secondary labels", () => {
    const { getByText } = render(
      <CustomPill label="Primary" secondaryLabel="Secondary" bg="info" />
    );
    expect(getByText("Primary")).toBeInTheDocument();
    expect(getByText("Secondary")).toBeInTheDocument();
  });

  it("renders pill with icon and handles click", () => {
    const handleClick = jest.fn();
    const TestIcon = () => <span>×</span>;
    const { getByTestId } = render(
      <CustomPill
        label="Test"
        secondaryLabel=""
        bg="warning"
        icon={<TestIcon />}
        onClick={handleClick}
      />
    );
    
    fireEvent.click(getByTestId("click-icon"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom data-testid and aria-label", () => {
    const { getByTestId } = render(
      <CustomPill
        label="Test"
        secondaryLabel=""
        bg="success"
        dataTestId="custom-pill"
        ariaLabel="Custom Pill"
      />
    );
    const pill = getByTestId("custom-pill");
    expect(pill).toHaveAttribute("aria-label", "Custom Pill");
  });

  it("renders without secondary label when not provided", () => {
    const { container } = render(
      <CustomPill label="Test" secondaryLabel="" bg="primary" />
    );
    expect(container.querySelector(".secondary-label")).not.toBeInTheDocument();
  });

  it("renders icon button with correct accessibility attributes", () => {
    const TestIcon = () => <span>×</span>;
    const { getByTestId } = render(
      <CustomPill
        label="Test"
        secondaryLabel=""
        bg="primary"
        icon={<TestIcon />}
      />
    );
    const iconButton = getByTestId("click-icon");
    expect(iconButton).toHaveAttribute("aria-label", "click icon");
  });
});
