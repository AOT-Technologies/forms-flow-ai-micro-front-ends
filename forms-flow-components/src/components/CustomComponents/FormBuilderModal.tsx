import React, { useRef, useEffect } from "react";
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
  primaryBtnAction?: () => void;
  secondaryBtnAction?: () => void;
  setFormDescription?: (value: string) => void;
  setNameError?: (value: string) => void;
  nameError?: string;
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
    setFormDescription,
    setNameError,
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
            <span className="valiation-astrisk">*</span>
            <FormInput
              type="text"
              placeholder={placeholderForForm}
              className={`form-input ${nameError ? "input-error" : ""}`}
              aria-label="Name of the form"
              data-testid={nameInputDataTestid}
              onBlur={nameValidationOnBlur}
              onChange={(event) => {
                setNameError("");
                handleChange("title", event);
              }}
              required
            />
            {nameError && (
              <div className="validation-text mb-4">{nameError}</div>
            )}

            <label className="form-label">{descriptionLabel}</label>

            <FormTextArea
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder={placeholderForDescription}
              className="form-input"
              aria-label="Description of the new form"
              data-testid={descriptionDataTestid}
              maxRows={1}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant={nameError ? "dark" : "primary"}
              size="md"
              disabled={!!nameError || formSubmitted}
              label={primaryBtnLabel}
              buttonLoading={!nameError && formSubmitted ? true : false}
              onClick={primaryBtnAction}
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
