import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortModal } from "../components/CustomComponents/SortModal";

const renderSortModal = (props) => render(<SortModal {...props} />);
 
describe("SortModal Component", () => {
  const mockOnClose = jest.fn();
  const mockPrimaryAction = jest.fn();
  
  const defaultProps = {
    showSortModal: true,
    onClose: mockOnClose,
    primaryBtnAction: mockPrimaryAction,
    optionSortBy: [
      { value: "name", label: "Name" },
      { value: "date", label: "Date" },
    ],
    optionSortOrder: [
      { value: "asc", label: "Ascending" },
      { value: "desc", label: "Descending" },
    ],
    defaultSortOption: "",
    defaultSortOrder: "",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the modal with default props", () => {
    renderSortModal(defaultProps);
    
    expect(screen.getByText("Sort")).toBeInTheDocument();
    expect(screen.getByText("Sort By")).toBeInTheDocument();
    expect(screen.getByText("In a")).toBeInTheDocument();
    expect(screen.getByText("Sort Results")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    renderSortModal(defaultProps);
    
    const closeButton = screen.getByTestId("close-sort-modal");
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", () => {
    renderSortModal(defaultProps);
    
    const cancelButton = screen.getByTestId("cancel-sort-button");
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("disables Sort Results button when no options are selected", () => {
    renderSortModal(defaultProps);
    
    const sortButton = screen.getByTestId("apply-sort-button");
    expect(sortButton).toBeDisabled();
  });

  it("enables Sort Results button when both options are selected", () => {
    renderSortModal(defaultProps);
    
    // Select sort by option
    const sortByDropdown = screen.getByTestId("dropdown-sort-by");
    fireEvent.click(sortByDropdown);
    fireEvent.click(screen.getByText("Name"));

    // Select sort order
    const sortOrderDropdown = screen.getByTestId("dropdown-sort-order");
    fireEvent.click(sortOrderDropdown);
    fireEvent.click(screen.getByText("Ascending"));

    const sortButton = screen.getByTestId("apply-sort-button");
    expect(sortButton).not.toBeDisabled();
  });

  it("calls primaryBtnAction with selected options when Sort Results is clicked", () => {
    renderSortModal(defaultProps);
    
    // Select sort by option
    const sortByDropdown = screen.getByTestId("dropdown-sort-by");
    fireEvent.click(sortByDropdown);
    fireEvent.click(screen.getByText("Name"));

    // Select sort order
    const sortOrderDropdown = screen.getByTestId("dropdown-sort-order");
    fireEvent.click(sortOrderDropdown);
    fireEvent.click(screen.getByText("Ascending"));

    // Click sort button
    const sortButton = screen.getByTestId("apply-sort-button");
    fireEvent.click(sortButton);

    expect(mockPrimaryAction).toHaveBeenCalledWith("name", "asc");
  });

  it("resets selected options when modal is closed and reopened", () => {
    const { rerender } =  renderSortModal(defaultProps);
    
    // Select options
    const sortByDropdown = screen.getByTestId("dropdown-sort-by");
    fireEvent.click(sortByDropdown);
    fireEvent.click(screen.getByText("Name"));

    const sortOrderDropdown = screen.getByTestId("dropdown-sort-order");
    fireEvent.click(sortOrderDropdown);
    fireEvent.click(screen.getByText("Ascending"));

    // Close modal
    rerender(<SortModal {...defaultProps} showSortModal={false} />);    
    // Reopen modal
    rerender(<SortModal {...defaultProps} showSortModal={true} />);

    // Check if options are reset
    const sortButton = screen.getByTestId("apply-sort-button");
    expect(sortButton).toBeDisabled();
  });

  it("renders with custom labels", () => {
    const customProps = {
      ...defaultProps,
      modalHeader: "Custom Sort",
      primaryBtnLabel: "Apply Sort",
      secondaryBtnLabel: "Close",
      firstItemLabel: "Sort Field",
      secondItemLabel: "Direction",
    };

   renderSortModal(customProps);
    
    expect(screen.getByText("Custom Sort")).toBeInTheDocument();
    expect(screen.getByText("Apply Sort")).toBeInTheDocument();
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByText("Sort Field")).toBeInTheDocument();
    expect(screen.getByText("Direction")).toBeInTheDocument();
  });
}); 