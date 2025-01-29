import React from "react";
import { render, screen, fireEvent} from "@testing-library/react";
import { BuildModal } from "../components/CustomComponents/BuildModal"; // Adjust the import path as needed
 

// Mock the CloseIcon component
jest.mock( "../components/SvgIcons/index", () => ({
  CloseIcon: ({ onClick }) => <div onClick={onClick}>CloseIcon</div>,
}));

describe("BuildModal", () => {
  const mockOnClose = jest.fn();
  const mockOnClick = jest.fn();

  const mockContents = [
    {
      id: 1,
      heading: "heading1",
      body: "body1",
      onClick: mockOnClick,
    },
    {
      id: 2,
      heading: "heading2",
      body: "body2",
    },
  ];

  const props = {
    show: true,
    onClose: mockOnClose,
    title: "Test Title",
    contents: mockContents,
  };

  it("renders the modal when show is true", () => {
    render(<BuildModal {...props} />);
    expect(screen.getByTestId("build-modal")).toBeInTheDocument();
  });

  it("does not render the modal when show is false", () => {
    render(<BuildModal {...props} show={false} />);
    expect(screen.queryByTestId("build-modal")).not.toBeInTheDocument();
  });

  it("renders the correct title", () => {
    render(<BuildModal {...props} />);
    expect(screen.getByText(props.title)).toBeInTheDocument();
  });

  it("renders the correct content buttons", () => {
    render(<BuildModal {...props} />);
    mockContents.forEach((content) => {
      expect(screen.getByText(content.heading)).toBeInTheDocument();
      expect(screen.getByText(content.body)).toBeInTheDocument();
    });
  });

  it("calls onClose when the close icon is clicked", () => {
    render(<BuildModal {...props} />);
    fireEvent.click(screen.getByText("CloseIcon"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClick when a content button is clicked", () => {
    render(<BuildModal {...props} />);
    fireEvent.click(screen.getByTestId("button-1")); // Click the first button
    expect(mockOnClick).toHaveBeenCalled();
  });

  
});