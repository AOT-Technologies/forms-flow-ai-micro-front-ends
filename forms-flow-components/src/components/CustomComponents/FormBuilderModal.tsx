import React, { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { FormTextArea } from "./FormTextArea";
import { CloseIcon } from "../SvgIcons/index";
import { FormInput } from "./FormInput";
import { useTranslation } from "react-i18next";
import { CustomInfo } from "./Info";
import { Form } from "react-bootstrap";

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
  buildForm?: boolean;
  checked?: boolean;
  setChecked?:()=>void;
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
    buildForm= false,
    checked= false,
    setChecked
  }) => {
    const { t } = useTranslation();
    const [name, setName] = useState<string>(""); // State for form name
    const [formDescription, setFormDescription] = useState<string>(description || ""); // State for form description

    const handlePrimaryAction = () => {
      // Pass name and description to primaryBtnAction
      if (primaryBtnAction) {
        primaryBtnAction(name, formDescription);
      }
    };

    return (
        <Modal
          show={showBuildForm}
          onHide={onClose}
          size="sm"
          centered={true}
        >
          <Modal.Header>
            <Modal.Title>
              <b>{modalHeader}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="form-builder-modal">
            <FormInput
              type="text"
              placeholder={placeholderForForm}
              label={nameLabel}
              aria-label={t("Name of the form")}
              data-testid={nameInputDataTestid}
              onBlur={nameValidationOnBlur}
              onChange={(event) => {
                setNameError("");
                setName(event.target.value); // Set the name state
                handleChange("title", event);
              }}
              required
              isInvalid={!!nameError}
              feedback={nameError}
            />
           <FormTextArea
              placeholder={placeholderForDescription}
              label={descriptionLabel}
              className="form-input"
              aria-label={t("Description of the new form")}
              data-testid={descriptionDataTestid}
              value={formDescription} // Bind description state
              onChange={(event) => {
                setFormDescription(event.target.value); // Set the description state
              }}
              minRows={1}
            />

           {buildForm && 
           <>
           <CustomInfo heading="Note" 
           content="Allowing the addition of multiple pages in a single form will prevent you from using this form in a bundle later" />
           <Form.Check
             type="checkbox"
             id="anonymouseCheckbox"
             label={t("Allow adding multiple pages form in this form")}
             checked={checked}
             onChange={setChecked}
             className="field-label"
             data-testid="wizard-checkbox"
           />   
          </>
          }
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant={nameError ? "dark" : "primary"}
              size="md"
              disabled={!!nameError || formSubmitted || !name } // Disable if errors or fields are empty
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
     );
  }
);
