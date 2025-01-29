import React from "react";
import { CustomButton } from "../components/CustomComponents/Button";
import { render, fireEvent } from "@testing-library/react";


describe("CustomButton component", () => {
  it("renders basic button with label", () => {
    const { getByText } = render(
      <CustomButton variant="primary" label="Test Button" />
    );
    expect(getByText("Test Button")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <CustomButton variant="primary" label="Click Me" onClick={handleClick} />
    );
    fireEvent.click(getByText("Click Me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders disabled button", () => {
    const { getByRole } = render(
      <CustomButton variant="primary" label="Disabled" disabled={true} />
    );
    expect(getByRole("button")).toBeDisabled();
  });

  it("renders button with icon", () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    const { getByTestId } = render(
      <CustomButton variant="primary" label="Icon Button" icon={<TestIcon />} />
    );
    expect(getByTestId("test-icon")).toBeInTheDocument();
  });

  it("renders dropdown button with items", () => {
    const dropdownItems = [
      { label: "Item 1", onClick: jest.fn() },
      { label: "Item 2", onClick: jest.fn() }
    ];
    const { getByText, getAllByRole } = render(
      <CustomButton
        variant="primary"
        label="Dropdown"
        isDropdown={true}
        dropdownItems={dropdownItems}
      />
    );
    
    fireEvent.click(getByText("Dropdown"));
    const menuItems = getAllByRole("button");
    expect(menuItems).toHaveLength(2);
  });

  it("shows loading state", () => {
    const { container } = render(
      <CustomButton variant="primary" label="Loading" buttonLoading={true} />
    );
    expect(container.querySelector(".dotted-spinner")).toBeInTheDocument();
  });

  it("applies custom size class", () => {
    const { getByRole } = render(
      <CustomButton variant="primary" label="Size Test" size="sm" />
    );
    expect(getByRole("button")).toHaveClass("btn-sm");
  });

  it("handles custom className", () => {
    const { getByRole } = render(
      <CustomButton variant="primary" label="Custom Class" className="test-class" />
    );
    expect(getByRole("button")).toHaveClass("test-class");
  });

  it("renders with custom data-testid and aria-label", () => {
    const { getByTestId } = render(
      <CustomButton
        variant="primary"
        label="Accessible"
        dataTestid="test-button"
        ariaLabel="Test Button"
      />
    );
    const button = getByTestId("test-button");
    expect(button).toHaveAttribute("aria-label", "Test Button");
  });
});
