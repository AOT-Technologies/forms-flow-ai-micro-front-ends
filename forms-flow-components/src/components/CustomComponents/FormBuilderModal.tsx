import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { FormTextArea } from "./FormTextArea";
import { CloseIcon } from "../SvgIcons/index";
import { FormInput } from "./FormInput";

interface BuildFormModalProps {
  showBuildForm: boolean;
  onClose?: () => void;
  handleChange?: (
    field: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  primaryBtnAction?: (name: string, description: string) => void; // Now expects name and description
  secondaryBtnAction?: () => void;
  setNameError?: (value: string) => void;
  nameError?: string;
  description?: string;
  formSubmitted?: boolean;
  modalHeader?: string;
  nameLabel?: string;
  descriptionLabel?: string;
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  nameValidationOnBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  primaryBtndataTestid?: string;
  secondoryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  secondoryBtnariaLabel?: string;
  closedataTestid?: string;
  nameInputDataTestid?: string;
  descriptionDataTestid?: string;
  placeholderForForm?: string;
  placeholderForDescription?: string;
}

export const FormBuilderModal: React.FC<BuildFormModalProps> = React.memo(
  ({
    showBuildForm,
    onClose,
    handleChange,
    primaryBtnAction,
    secondaryBtnAction = onClose, // Default to onClose if not provided
    setNameError,
    description,
    nameError,
    formSubmitted,
    modalHeader,
    nameLabel = "Name",
    descriptionLabel = "Form Description",
    primaryBtnLabel = "Save and Edit form",
    secondaryBtnLabel = "Cancel",
    nameValidationOnBlur,
    primaryBtndataTestid = "confirm-button",
    secondoryBtndataTestid = "cancel-button",
    primaryBtnariaLabel = "Create and Edit form",
    secondoryBtnariaLabel = "Cancel",
    closedataTestid = "close",
    nameInputDataTestid = "form-name",
    descriptionDataTestid = "form-description",
    placeholderForForm,
    placeholderForDescription,
  }) => {
    const [name, setName] = useState<string>(""); // State for form name
    const [formDescription, setFormDescription] = useState<string>(description || ""); // State for form description

    const handlePrimaryAction = () => {
      // Pass name and description to primaryBtnAction
      if (primaryBtnAction) {
        primaryBtnAction(name, formDescription);
      }
    };

    return (
      <>
        <Modal
          show={showBuildForm}
          onHide={onClose}
          dialogClassName="modal-50w"
        >
          <Modal.Header>
            <Modal.Title>
              <b>{modalHeader}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="p-5">
            <label className="form-label">{nameLabel}</label>
            <span className="validation-astrisk">*</span>
            <FormInput
              type="text"
              placeholder={placeholderForForm}
              className={`form-input ${nameError ? "input-error" : ""}`}
              aria-label="Name of the form"
              data-testid={nameInputDataTestid}
              onBlur={nameValidationOnBlur}
              onChange={(event) => {
                setNameError("");
                setName(event.target.value); // Set the name state
                handleChange("title", event);
              }}
              required
            />
            {nameError && (
              <div className="validation-text mb-4">{nameError}</div>
            )}

            <label className="form-label">{descriptionLabel}</label>
            <FormTextArea
              placeholder={placeholderForDescription}
              className="form-input"
              aria-label="Description of the new form"
              data-testid={descriptionDataTestid}
              value={formDescription} // Bind description state
              onChange={(event) => {
                setFormDescription(event.target.value); // Set the description state
              }}
              maxRows={3}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant={nameError ? "dark" : "primary"}
              size="md"
              disabled={!!nameError || formSubmitted || !name || !formDescription} // Disable if errors or fields are empty
              label={primaryBtnLabel}
              buttonLoading={!nameError && formSubmitted ? true : false}
              onClick={handlePrimaryAction} // Use the new handler
              dataTestid={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
            />

            <CustomButton
              variant="secondary"
              size="md"
              label={secondaryBtnLabel}
              onClick={secondaryBtnAction}
              dataTestid={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
            />
          </Modal.Footer>
        </Modal>
      </>
    );
  }
);
