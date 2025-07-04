import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormBuilderModal } from "../components/CustomComponents/FormBuilderModal";


const renderFormBuilderModal = (props) => render(<FormBuilderModal {...props} />);
describe("FormBuilderModal Component", () => {
  const mockOnClose = jest.fn();
  const mockPrimaryAction = jest.fn();
  const mockSecondaryAction = jest.fn();
  const mockHandleChange = jest.fn();
  const mockSetNameError = jest.fn();
  const mockNameValidationOnBlur = jest.fn();

  const defaultProps = {
    showBuildForm: true,
    onClose: mockOnClose,
    primaryBtnAction: mockPrimaryAction,
    secondaryBtnAction: mockSecondaryAction,
    handleChange: mockHandleChange,
    setNameError: mockSetNameError,
    nameValidationOnBlur: mockNameValidationOnBlur,
    nameError: "",
    description: "",
    modalHeader: "Create Form",
    primaryBtnLabel: "Save",
    secondaryBtnLabel: "Cancel",
    primaryBtndataTestid: "confirm-button",
    secondoryBtndataTestid: "cancel-button",
    nameInputDataTestid: "form-name",
    descriptionDataTestid: "form-description",
  };

  it("renders the modal with required fields", () => {
    renderFormBuilderModal(defaultProps);
    expect(screen.getByTestId("form-name")).toBeInTheDocument();
    expect(screen.getByTestId("form-description")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    renderFormBuilderModal(defaultProps);
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockSecondaryAction).toHaveBeenCalled();
  });

  it("click primary button without value", () => {
    renderFormBuilderModal(defaultProps);
    fireEvent.click(screen.getByTestId("confirm-button"));
    expect(mockPrimaryAction).not.toHaveBeenCalled();
  });

  it("calls primary action when the save button is clicked", () => {
    renderFormBuilderModal(defaultProps);
    const nameInput = screen.getByTestId("form-name");
    fireEvent.change(nameInput, { target: { value: "New Form" } });
    fireEvent.click(screen.getByTestId("confirm-button"));
    expect(mockPrimaryAction).toHaveBeenCalled();
  });

  it("updates name field on change", () => {
    renderFormBuilderModal(defaultProps);
    const nameInput = screen.getByTestId("form-name");
    fireEvent.change(nameInput, { target: { value: "New Form" } });
    expect(mockHandleChange).toHaveBeenCalledWith("title", expect.any(Object));
  });

  it("calls nameValidationOnBlur when name field loses focus", () => {
    renderFormBuilderModal(defaultProps);
    const nameInput = screen.getByTestId("form-name");
    fireEvent.blur(nameInput);
    expect(mockNameValidationOnBlur).toHaveBeenCalled();
  });
});
