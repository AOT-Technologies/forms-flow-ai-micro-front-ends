import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { CloseIcon, CustomInfo, DragandDropSort, FormVariableIcon, V8CustomButton } from "@formsflow/components"; 
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
  selectedItem,
  handleShowVariableModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const darkColor = StyleServices.getCSSVariable('--ff-gray-darkest');
  const [activeTab, setActiveTab] = useState("fields");
 const selectedSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.selectedFilter);

 const [sortFields, setSortFields] = useState(selectedSubmissionFilter?.variables || submissionFields)
useEffect (() => {
  setSortFields(selectedSubmissionFilter?.variables || submissionFields);
},[selectedSubmissionFilter]);


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
        size="lg"
        centered
        dialogClassName="manage-fields-sort-modal"
        data-testid="manage-fields-sort-modal"
        aria-describedby="manage-fields-sort-modal"
        aria-labelledby="manage-fields-sort-title"
        backdrop="static"
      >
        <Modal.Header>
    <div className="modal-header-content">
          <div className="modal-title">
            {selectedItem ? t(`${selectedItem} > Manage Fields`) : t(`All Forms > Manage Fields`)}
            <CloseIcon color="var(--gray-darkest)" onClick={onClose} />
          </div>

        <div>
          <div className="manage-fields-tabs section-seperation-left">
            <V8CustomButton
            label={t("Fields")}
            variant="secondary"
            onClick={() => setActiveTab("fields")}
            dataTestId="manage-fields-fields-tab"
            ariaLabel={t("Manage fields fields tab")}
            selected={activeTab === "fields"}
          />
          <V8CustomButton
            label={t("Form")}
            variant="secondary"
            onClick={() => setActiveTab("form")}
            dataTestId="manage-fields-form-tab"
            ariaLabel={t("Manage fields form tab")}
            selected={activeTab === "form"}
          />
          <V8CustomButton
            label={t("System")}
            variant="secondary"
            onClick={() => setActiveTab("system")}
            dataTestId="manage-fields-system-tab"
            ariaLabel={t("Manage fields system tab")}
            selected={activeTab === "system"}
          />
          </div>
          
        </div>
    </div>
  </Modal.Header>
      
        
          <Modal.Body>
        
        <DragandDropSort
          key={sortFields?.length}
          items={sortFields}
          onUpdate={handleUpdateOrder}
          icon={<FormVariableIcon color={darkColor} />}
          data-testid="columns-sort"
          preventLastCheck={true}
        />
        <div>
        </div>
          

        </Modal.Body>
        
      <Modal.Footer>
        <div className="buttons-row">
          <V8CustomButton secondary label={t("Cancel")} onClick={onClose} dataTestId="manage-fields-cancel" ariaLabel={t("Manage fields cancel")} />

          <V8CustomButton label={t("Save and apply")} dataTestId="manage-fields-save" ariaLabel={t("Manage fields save")} onClick={handleSaveSubmissionFields} />
        </div>
      </Modal.Footer>

        
      </Modal>
  );
}

export default ManageFieldsSortModal;
