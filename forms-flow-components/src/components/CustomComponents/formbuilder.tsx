import React, { useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";

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
}

export const BuildFormModal: React.FC<BuildFormModalProps> = React.memo(
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
  }) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const handleInput = () => {
          textarea.style.height = "auto";
          textarea.style.height = `${textarea.scrollHeight}px`;
        };
        textarea.addEventListener("input", handleInput);
        return () => {
          textarea.removeEventListener("input", handleInput);
        };
      }
    }, [showBuildForm]);

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
              <button
                type="button"
                className="close-modal"
                onClick={onClose}
                aria-label="close New Form Modal"
                data-testid={closedataTestid}
              >
                X
              </button>
            </div>
          </Modal.Header>
          <Modal.Body className="p-5">
            <label className="form-label">{nameLabel}</label>
            <span className="valiation-astrisk">*</span>
            <input
              type="text"
              placeholder="Form 1"
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
            <textarea
              onChange={(e) => setFormDescription(e.target.value)}
              ref={textareaRef}
              placeholder="Short description of the form"
              className="form-input"
              aria-label="Description of the new form"
              data-testid={descriptionDataTestid}
              rows={1}
            />
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant={nameError ? "dark" : "primary"}
              disabled={!!nameError || formSubmitted}
              label={primaryBtnLabel}
              buttonLoading={!nameError && formSubmitted ? true : false}
              onClick={primaryBtnAction}
              className=""
              dataTestid={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
            />

            <CustomButton
              variant="secondary"
              label={secondaryBtnLabel}
              onClick={secondaryBtnAction}
              className=""
              dataTestid={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
            />
          </Modal.Footer>
        </Modal>
      </>
    );
  }
);
