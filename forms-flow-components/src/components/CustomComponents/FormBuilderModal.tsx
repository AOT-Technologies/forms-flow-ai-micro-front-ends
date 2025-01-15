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
    isFormNameValidating=false

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
        <Modal
          show={showBuildForm}
          onHide={onClose}
          size="sm"
          centered={true}
        >
          <Modal.Header>
            <Modal.Title>
              <b>{t(modalHeader)}</b>
            </Modal.Title>
            <div className="d-flex align-items-center">
              <CloseIcon onClick={onClose} />
            </div>
          </Modal.Header>
          <Modal.Body className="form-builder-modal">
            <FormInput
              name="title"
              type="text"
              placeholder={t(placeholderForForm)}
              label={nameLabel}
              aria-label={t("Name of the form")}
              data-testid={nameInputDataTestid}
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
            />
           <FormTextArea
              name="description"
              placeholder={t(placeholderForDescription)}
              label={descriptionLabel}
              className="form-input"
              aria-label={t("Description of the new form")}
              data-testid={descriptionDataTestid}
              value={values.description} // Bind description state
              onChange={handleInputValueChange}
              minRows={1}
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
          <Modal.Footer className="d-flex justify-content-start">
            <CustomButton
              variant={nameError ? "dark" : "primary"}
              size="md"
              disabled={!!nameError || isSaveBtnLoading || !values.title || isFormNameValidating } // Disable if errors or fields are empty
              label={primaryBtnLabel}
              buttonLoading={isSaveBtnLoading}
              onClick={handlePrimaryAction} // Use the new handler
              name="createButton"
              dataTestid={primaryBtndataTestid}
              ariaLabel={primaryBtnariaLabel}
            />

            <CustomButton
              variant="secondary"
              size="md"
              name="cancelButton"
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
