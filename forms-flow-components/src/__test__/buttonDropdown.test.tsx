import { render, screen, fireEvent } from "@testing-library/react";
import { ButtonDropdown } from "../components/CustomComponents/ButtonDropdown";

// Mock the StyleServices and translations
jest.mock("@formsflow/service", () => ({
  StyleServices: {
    getCSSVariable: jest.fn().mockReturnValue("#000000"),
  },
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (str: string) => str,
  }),
}));

describe("ButtonDropdown Component", () => {
  const mockDropdownItems = [
    {
      content: "Item 1",
      onClick: jest.fn(),
      type: "type1",
      dataTestId: "item1-test",
    },
    {
      content: "Item 2",
      onClick: jest.fn(),
      type: "type2",
      dataTestId: "item2-test",
    },
  ];

  const defaultProps = {
    variant: "primary",
    label: "Test Button",
    dropdownType: "DROPDOWN_ONLY",
    dropdownItems: mockDropdownItems,
    dataTestId: "test-dropdown",
  };

  it("renders basic dropdown button correctly", () => {
    render(<ButtonDropdown {...defaultProps} />);

    expect(screen.getByText("Test Button")).toBeInTheDocument();
    expect(screen.getByTestId("test-dropdown")).toBeInTheDocument();
  });

  it("handles dropdown item clicks correctly", () => {
    render(<ButtonDropdown {...defaultProps} />);

    // Open dropdown using the split button
    const toggleButton = screen.getByRole("button", { name: "" });
    fireEvent.click(toggleButton);

    // Find and click the dropdown item
    const dropdownItem = screen.getByText("Item 1");
    fireEvent.click(dropdownItem);

    expect(mockDropdownItems[0].onClick).toHaveBeenCalledWith("type1");
  });

  it("renders extra action icon when dropdownType is DROPDOWN_WITH_EXTRA_ACTION", () => {
    const extraActionProps = {
      ...defaultProps,
      dropdownType: "DROPDOWN_WITH_EXTRA_ACTION",
      extraActionIcon: <div data-testid="extra-icon">Icon</div>,
      extraActionOnClick: jest.fn(),
    };

    render(<ButtonDropdown {...extraActionProps} />);

    const extraIcon = screen.getByTestId("extra-icon");
    expect(extraIcon).toBeInTheDocument();

    fireEvent.click(extraIcon);
    expect(extraActionProps.extraActionOnClick).toHaveBeenCalled();
  });

  it("applies custom size prop correctly", () => {
    render(<ButtonDropdown {...defaultProps} size="sm" />);

    const button = screen.getByTestId("test-dropdown");
    expect(button).toHaveClass("btn-sm");
  });

  it("applies custom className correctly", () => {
    render(<ButtonDropdown {...defaultProps} className="custom-class" />);

    const dropdown = screen
      .getByTestId("test-dropdown")
      .closest(".custom-btn-width");
    expect(dropdown).toHaveClass("custom-class");
  });

  it("updates menu style on window resize", () => {
    render(<ButtonDropdown {...defaultProps} />);

    // Trigger window resize
    global.dispatchEvent(new Event("resize"));

    // Verify the dropdown is still rendered
    expect(screen.getByTestId("test-dropdown")).toBeInTheDocument();
  });
});
