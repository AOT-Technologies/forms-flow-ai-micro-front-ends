import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { CustomButton } from "./Button";
import { FormTextArea } from "./FormTextArea";
import { CloseIcon } from "../SvgIcons/index";
import { FormInput } from "./FormInput";
import { useTranslation } from "react-i18next";
import { CustomInfo } from "./CustomInfo";
import { Form } from "react-bootstrap";

interface BuildFormModalProps {
  showBuildForm: boolean;
  onClose?: () => void;
  handleChange?: (
    field: string,
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  primaryBtnAction?: (values:any) => void; // Now expects name and description
  secondaryBtnAction?: () => void;
  setNameError?: (value: string) => void;
  nameError?: string;
  description?: string;
  isSaveBtnLoading?: boolean;
  isFormNameValidating?: boolean;
  modalHeader?: string;
  nameLabel?: string;
  descriptionLabel?: string;
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  nameValidationOnBlur?: (values:any) => void;
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
  showSuccess?: boolean;
  successCountdown?: number;
}

export const FormBuilderModal: React.FC<BuildFormModalProps> = React.memo(
  ({
    showBuildForm,
    onClose,
    handleChange = ()=>{},
    primaryBtnAction,
    secondaryBtnAction = onClose, // Default to onClose if not provided
    setNameError,
    description,
    nameError,
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
    isSaveBtnLoading= false,
    isFormNameValidating=false,
    showSuccess = false, // New prop
    successCountdown = 0, // New prop

  }) => {
    const { t } = useTranslation();
    const [values, setValues] = useState({
      title:"",
      description: description || "",
      display: checked ? "wizard" : "form"
    })
    const [cachedTitle, setCachedTitle] = useState("");
    const handlePrimaryAction = () => {
      // Pass name and description to primaryBtnAction
      if (primaryBtnAction) {
        primaryBtnAction(values);
      }
    };

    const handleInputValueChange = (e:any)=>{
      let {name, value} = e.target;
      if(e.target.type == "checkbox"){
        value = e.target.checked ? "wizard" : "form";
      }
      if(name === "title") {
        value = value.replace(/[#+]/g, '');
      }
      setValues(prev => ({...prev,[name]:value}))
      setCachedTitle(""); //reseting caching on type
    }
    
    const handleOnBlur = (e)=>{ 
      //TBD: need to prevent this function on modal close
      const relatedTargetName = e.relatedTarget?.name;
      const createButtonClicked =  relatedTargetName == "createButton";
      const isCancelButton = relatedTargetName == "cancelButton"; 
      if((!values.title || values.title !== cachedTitle) && !isCancelButton){
        nameValidationOnBlur({ ...values, createButtonClicked });
        setCachedTitle(values.title); 
            }
    }
    let buttonVariant = "primary"; // Default value
    if (showSuccess) {
      buttonVariant = "success";
    } else if (nameError) {
      buttonVariant = "dark";
    }

    useEffect(()=>{
      if(!showBuildForm){
        setValues({title:"",description:"", display: checked ? "wizard" : "form" }) 
        setCachedTitle('');
      }
      if(showBuildForm){
        //reset the name error on starting
        setNameError("");
      }
    },[showBuildForm])

    return (
      <Modal show={showBuildForm} onHide={onClose} size="sm">
        <Modal.Header>
          <Modal.Title>
            <p>{t(modalHeader)}</p>
          </Modal.Title>

          <div className="icon-close" onClick={onClose} data-testid="close-duplicate-modal">
            <CloseIcon />
          </div>
        </Modal.Header>
        <Modal.Body>
          <FormInput
            name="title"
            type="text"
            placeholder={t(placeholderForForm)}
            label={nameLabel}
            aria-label={t("Name of the form")}
            dataTestId={nameInputDataTestid}
            onBlur={handleOnBlur}
            onChange={(event) => {
              handleInputValueChange(event);
              setNameError("");
              handleChange("title", event);
            }}
            required
            value={values.title}
            isInvalid={!!nameError}
            feedback={nameError}
            turnOnLoader={isFormNameValidating}
            maxLength={200}
            id="form-name"
          />
          <FormTextArea
            name="description"
            placeholder={t(placeholderForDescription)}
            label={descriptionLabel}
            className="form-input"
            aria-label={t("Description of the new form")}
            dataTestId={descriptionDataTestid}
            value={values.description} // Bind description state
            onChange={handleInputValueChange}
            minRows={1}
            id="form-description"
          />

          {/* This below commenting is for open-source use only. It should not be included in EE.
Further clarification on this is to be determined for EE. */}

          {/*
   {buildForm && 
   <>
     <CustomInfo heading="Note" 
     content="Allowing the addition of multiple pages in a single form will prevent you from using this form in a bundle later" />
     <Form.Check
       type="checkbox"
       id="anonymouseCheckbox"
       label={t("Allow adding multiple pages form in this form")}
       checked={values.display == "wizard"}
       onChange={handleInputValueChange} 
       name="display" 
       className="field-label"
       data-testid="wizard-checkbox"
     />   
   </>
   }
*/}
        </Modal.Body>
        <Modal.Footer>
          <div className="buttons-row">
            <CustomButton
              variant={buttonVariant} // Set color based on success or error
              size="md"
              disabled={
                !!nameError ||
                isSaveBtnLoading ||
                !values.title ||
                isFormNameValidating ||
                showSuccess
              } // Disable if errors or fields are empty
              label={
                showSuccess ? `Saving (${successCountdown})` : primaryBtnLabel
              } // Display countdown or primary label
              buttonLoading={isSaveBtnLoading}
              onClick={handlePrimaryAction} // Trigger action on button click
              name="createButton"
              dataTestId={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
            />

            <CustomButton
              name="cancelButton"
              label={secondaryBtnLabel}
              onClick={secondaryBtnAction}
              dataTestId={secondoryBtndataTestid}
              ariaLabel={secondoryBtnariaLabel}
              secondary
            />
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
);
