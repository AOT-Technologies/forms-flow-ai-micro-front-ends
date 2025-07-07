import React, { use, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { CustomButton, CloseIcon, CustomInfo, DragandDropSort, FormVariableIcon, AddIcon } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";


interface ManageFieldsModalProps {
  show: boolean;
  onClose: () => void;
}

const ManageFieldsSortModal: React.FC<ManageFieldsModalProps> = ({ show, onClose }) => {
  const { t } = useTranslation();
    const darkColor = StyleServices.getCSSVariable('--ff-gray-darkest');
    const [submissionFields,  setSubmissionFields] = React.useState([]);
    useEffect(() => {
       // this will be replaced with the variables from the selectedc form fields
      const formFields = [
        { id: "id", name: "Submission ID" },
        { id: "formName", name: "Form" },
        { id: "createdBy", name: "Submitter" },
        { id: "created", name: "Submission Date" },
        { id: "applicationStatus", name: "Status" }
      ];
      setSubmissionFields(formFields);
    }, []);
  


  const FormFieldsNote = () => {
    return (
      <div>
        <CustomInfo
              className="manage-fields-note"
              heading="Note"
              content={t(
                "Re-arrange fields shown for the results table and the filter. Toggle their visibility in the results table with the provided checkbox. Form and Submission Date filters will always be persistent and can only be hidden or re-arranged for the results table.\n\n The selected fields and their order are saved for each user for each form. Feel free to customize it for your needs; add or remove fields, show or quickly hide fields."
              )}
              dataTestId="manage-fields-note"
              aria-label={t("Manage fields note")}
            />
      </div>
    );
  }

 const handleUpdateOrder = (updatedFieldOrder) => {
  setSubmissionFields(updatedFieldOrder);
  }
  
 

  return (
    <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered
        data-testid="manage-fields-sort-modal"
        aria-describedby="manage-fields-sort-modal"
        backdrop="static"
        className="manage-fields-sort-modal"
      >
        <Modal.Header>
      
          <Modal.Title id="manage-fields-sort-title">
            <b>
              {/* form name should be replaced here */}
              {t("Manage Fields for form name")} 

            </b> 
          </Modal.Title>
           <div className="icon-close" onClick={onClose}>
            <CloseIcon />
          </div>
        </Modal.Header>
          <Modal.Body>
            <div>
              <FormFieldsNote/>
          <div className="fields-sort-list">
            <DragandDropSort
              items={submissionFields}
              onUpdate={handleUpdateOrder}
              icon={<FormVariableIcon color={darkColor} />}
              data-testid="columns-sort"
            />
          </div>
          
          <CustomButton variant="secondary"
            label={t("More System and Form Fields")}
            icon={<AddIcon />} dataTestId="manage-fields-add"
            ariaLabel={t("Manage fields add")} iconWithText>
          </CustomButton>
            </div>
          

        </Modal.Body>
        
        <Modal.Footer>
                  <div className="buttons-row">

          <CustomButton  label={t("Save Changes")} dataTestId="manage-fields-save" ariaLabel={t("Manage fields save")}> </CustomButton>
          <CustomButton secondary label={t("Cancel")} onClick={onClose} dataTestId="manage-fields-cancel" ariaLabel={t("Manage fields cancel")}> </CustomButton>
        </div>
        </Modal.Footer>

        
      </Modal>
  );
};

export default ManageFieldsSortModal;
