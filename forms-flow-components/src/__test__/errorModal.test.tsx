import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
 
import { ErrorModal } from "../components/CustomComponents/ErrorModal";
 
describe("ErrorModal Component", () => {
  const mockOnClose = jest.fn();
  const mockPrimaryAction = jest.fn();
  const modalProps = {
    show: true,
    onClose: mockOnClose,
    title: "Error Title",
    message: "Error Message",
    primaryBtnAction: mockPrimaryAction,
    primaryBtnText: "Dismiss",
  };

  test("renders ErrorModal with correct content", () => {
    render(<ErrorModal {...modalProps} />);
    
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    expect(screen.getByText("Error Title")).toBeInTheDocument();
    expect(screen.getByText("Error Message")).toBeInTheDocument();
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });

  test("calls primary button action on click", () => {
    render(<ErrorModal {...modalProps} />);
    fireEvent.click(screen.getByTestId("Dismiss-button"));
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
