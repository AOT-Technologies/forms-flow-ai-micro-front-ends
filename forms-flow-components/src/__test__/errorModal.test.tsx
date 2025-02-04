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
    primaryBtndataTestid:"dismiss-button"
  };

  const renderModalComponent = (props)=>  render(<ErrorModal {...props} />);

  test("renders ErrorModal with correct content", () => {
    renderModalComponent(modalProps);
    expect(screen.getByTestId("error-modal")).toBeInTheDocument(); 
    expect(screen.getByTestId("dismiss-button")).toBeInTheDocument();
  });

  test("calls primary button action on click", () => {
    renderModalComponent(modalProps);
    fireEvent.click(screen.getByTestId("dismiss-button"));
    expect(mockPrimaryAction).toHaveBeenCalledTimes(1);
  });
});
