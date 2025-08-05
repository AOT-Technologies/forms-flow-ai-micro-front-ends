import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { CustomButton, CloseIcon, CustomInfo, DragandDropSort, FormVariableIcon, AddIcon } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";
import { createOrUpdateSubmissionFilter, updateDefaultSubmissionFilter } from "../../api/queryServices/analyzeSubmissionServices";
import { setDefaultSubmissionFilter, setSelectedSubmisionFilter } from "../../actions/analyzeSubmissionActions";


interface ManageFieldsModalProps {
  show: boolean;
  onClose: () => void;
  selectedItem: string
  submissionFields: any[]
  setSubmissionFields: ([]) => void
  dropdownSelection: string
  handleShowVariableModal:()=>void;
}
interface SubmissionField {
  sortOrder: string;
  key: string;
  name: string;
  label: string;
  isChecked: boolean; 
  isFormVariable: boolean;
}

interface VariableListPayload {
  parentFormId: string ;
  variables: SubmissionField[];
}


interface FormFieldsNoteProps {
  content: string;
  ariaLabel: string;
}

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

const ManageFieldsSortModal: React.FC<ManageFieldsModalProps> = ({ 
  show, 
  onClose, 
  dropdownSelection, 
  submissionFields, 
  setSubmissionFields, 
  selectedItem,
  handleShowVariableModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const darkColor = StyleServices.getCSSVariable('--ff-gray-darkest');
 
 const selectedSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.selectedFilter);

 const [sortFields, setSortFields] = useState(selectedSubmissionFilter?.variables ||  submissionFields);

useEffect (() => {
  setSortFields(selectedSubmissionFilter?.variables ||  submissionFields);
},[selectedSubmissionFilter, submissionFields])
 const handleUpdateOrder = (updatedFieldOrder) => {
  setSortFields(updatedFieldOrder);
  }
  const variableList = (): VariableListPayload => ({
  parentFormId: dropdownSelection,
  variables: sortFields
});

const handleSaveSubmissionFields = () => {
  createOrUpdateSubmissionFilter(variableList()).then((res) => {
    updateDefaultSubmissionFilter({ defaultSubmissionsFilter: res.data.id });
    dispatch(setDefaultSubmissionFilter(res.data.id));
    dispatch(setSelectedSubmisionFilter(res.data));
    onClose();
  });
};
  
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
            <p className="text-break">{t(`Manage Fields for ${selectedItem}`)}</p>   
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
          key={sortFields?.length}
          items={sortFields}
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
            onClick={handleShowVariableModal}
          />
        </div>
          

        </Modal.Body>
        
        <Modal.Footer>
                  <div className="buttons-row">

          <CustomButton  label={t("Save Changes")} dataTestId="manage-fields-save" ariaLabel={t("Manage fields save")} onClick={handleSaveSubmissionFields}/>
          <CustomButton secondary label={t("Cancel")} onClick={onClose} dataTestId="manage-fields-cancel" ariaLabel={t("Manage fields cancel")}/>
        </div>
        </Modal.Footer>

        
      </Modal>
  );
}

export default ManageFieldsSortModal;
