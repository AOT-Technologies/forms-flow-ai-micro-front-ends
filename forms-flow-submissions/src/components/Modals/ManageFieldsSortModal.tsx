import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "react-bootstrap";
import { CustomButton, CloseIcon, CustomInfo, DragandDropSort, FormVariableIcon, AddIcon } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";
import { createOrUpdateSubmissionFilter, updateDefaultSubmissionFilter } from "../../api/queryServices/analyzeSubmissionServices";
import { setDefaultSubmissionFilter } from "../../actions/analyzeSubmissionActions";


interface ManageFieldsModalProps {
  show: boolean;
  onClose: () => void;
  dropdownSelection: string | null;
  selectedItem: string
}
interface SubmissionField {
  sortOrder: string;
  key: string;
  name: string;
  label: string;
  isChecked: string; 
  isFormVariable: boolean;
}

interface VariableListPayload {
  parentFormId: string | null;
  variables: SubmissionField[];
}

interface FormFieldsNoteProps {
  content: string;
  ariaLabel: string;
}
const ManageFieldsSortModal: React.FC<ManageFieldsModalProps> = ({ show, onClose, dropdownSelection, selectedItem }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
    const darkColor = StyleServices.getCSSVariable('--ff-gray-darkest');
    const [submissionFields,  setSubmissionFields] = React.useState([]);
    useEffect(() => {
       // this will be replaced with system variables from variable selection modal
      const formFields = [
        { key: "id", name: "id", label: "Submission ID", isChecked: "true", isFormVariable: false },
        { key: "formName", name: "formName", label: "Form", isChecked: "true", isFormVariable: false },
        { key: "createdBy", name: "createdBy", label: "Submitter", isChecked: "true", isFormVariable: false },
        { key: "created", name: "created", label: "Submission Date", isChecked: "true", isFormVariable: false },
        { key: "applicationStatus", name: "applicationStatus", label: "Status", isChecked: "true", isFormVariable: false }
      ];
      setSubmissionFields(formFields);
    }, [selectedItem]);
    

  


 const FormFieldsNote: React.FC<FormFieldsNoteProps> = ({ content, ariaLabel }) => (
  <div>
    <CustomInfo
      heading="Note"
      content={content}
      dataTestId="manage-fields-note"
      aria-label={ariaLabel}
    />
  </div>
);
const variableList = (): VariableListPayload => ({
  parentFormId: dropdownSelection,
  variables: submissionFields
});


const handleSaveSubmissionFields = () => {
  createOrUpdateSubmissionFilter(variableList()).then((res) => {
    updateDefaultSubmissionFilter({ defaultSubmissionsFilter: res.data.id });
    dispatch(setDefaultSubmissionFilter(res.data.id))
    onClose();
  });
};



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
      >
        <Modal.Header>
      
          <Modal.Title id="manage-fields-sort-title">
            <b>
              {t(`Manage Fields for ${selectedItem}`)} 

            </b> 
          </Modal.Title>
           <div className="icon-close" onClick={onClose}>
            <CloseIcon />
          </div>
        </Modal.Header>
          <Modal.Body>
        <FormFieldsNote
          content={t(
            "Re-arrange fields shown for the results table and the filter. Toggle their visibility in the results table with the provided checkbox. Form and Submission Date filters will always be persistent and can only be hidden or re-arranged for the results table.\n\n The selected fields and their order are saved for each user for each form. Feel free to customize it for your needs; add or remove fields, show or quickly hide fields."
          )}
          ariaLabel={t("Manage fields note")}
        />
            <DragandDropSort
              items={submissionFields}
              onUpdate={handleUpdateOrder}
              icon={<FormVariableIcon color={darkColor} />}
              data-testid="columns-sort"
        />
        <div>


          <CustomButton

            label={t("More System and Form Fields")}
            secondary
            icon={<AddIcon />}
            dataTestId="manage-fields-add"
            ariaLabel={t("Manage fields add")}
            iconWithText
          >
          </CustomButton>
        </div>
          

        </Modal.Body>
        
        <Modal.Footer>
                  <div className="buttons-row">

          <CustomButton label={t("Save Changes")} dataTestId="manage-fields-save" ariaLabel={t("Manage fields save")} onClick={handleSaveSubmissionFields}
          > </CustomButton>
          <CustomButton secondary label={t("Cancel")} onClick={onClose} dataTestId="manage-fields-cancel" ariaLabel={t("Manage fields cancel")}> </CustomButton>
        </div>
        </Modal.Footer>

        
      </Modal>
  );
};

export default ManageFieldsSortModal;
