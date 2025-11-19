import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "react-bootstrap";
import { CloseIcon, CustomInfo, DragandDropSort, FormVariableIcon, V8CustomButton, VariableSelection } from "@formsflow/components"; 
import { useTranslation } from "react-i18next";
import { StyleServices } from "@formsflow/service";
import { createOrUpdateSubmissionFilter, updateDefaultSubmissionFilter } from "../../api/queryServices/analyzeSubmissionServices";
import { setDefaultSubmissionFilter, setSelectedSubmisionFilter } from "../../actions/analyzeSubmissionActions";
import { SystemVariables } from "../../constants/variables";


interface ManageFieldsModalProps {
  show: boolean;
  onClose: () => void;
  selectedItem: string
  submissionFields: any[]
  setSubmissionFields: ([]) => void
  dropdownSelection: string
  form: any;
  savedFormVariables: Record<string, any>;
  setSavedFormVariables: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isFormFetched: boolean;
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
  form,
  savedFormVariables,
  setSavedFormVariables,
  isFormFetched }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const darkColor = StyleServices.getCSSVariable('--ff-gray-darkest');
  const [activeTab, setActiveTab] = useState("fields");
 const selectedSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.selectedFilter);

 const [sortFields, setSortFields] = useState(selectedSubmissionFilter?.variables || submissionFields)
 const [localSavedFormVariables, setLocalSavedFormVariables] = useState<Record<string, any>>(savedFormVariables || {});
useEffect (() => {
  setSortFields(selectedSubmissionFilter?.variables || submissionFields);
  setLocalSavedFormVariables(savedFormVariables || {});
},[selectedSubmissionFilter, show]);

// Keys for fixed system fields that are always present
const fixedSystemFieldKeys = useMemo(() => (["id", "form_name", "created_by", "created", "application_status"]), []);

// Lookup map for default system field labels (fallbacks)
const defaultSystemLabelByKey = useMemo(() => {
  const map: Record<string, string> = {};
  (submissionFields || []).forEach((f: any) => {
    if (fixedSystemFieldKeys.includes(f.key)) {
      map[f.key] = f.label || f.name || f.key;
    }
  });
  return map;
}, [submissionFields, fixedSystemFieldKeys]);

// Keep sortFields in sync when variable selection changes
useEffect(() => {
  if (!localSavedFormVariables) return;

  const newKeys = Object.keys(localSavedFormVariables || {});

  // Preserve fixed system fields and carry forward isChecked/sortOrder for existing kept fields
  const preservedFixed = (selectedSubmissionFilter?.variables || submissionFields || [])
    .filter((f: any) => fixedSystemFieldKeys.includes(f.key))
    .map((f: any) => ({
      ...f,
      label: f.label || defaultSystemLabelByKey[f.key] || f.key,
      name: f.name || defaultSystemLabelByKey[f.key] || f.key,
    }));

  // Build new fields from variable selection; preserve existing state where applicable
  const existingByKey: Record<string, any> = {};
  (sortFields || []).forEach((f: any) => {
    existingByKey[f.key] = f;
  });

  const newVariableFields = newKeys.map((key, idx) => {
    const v = localSavedFormVariables[key];
    const existing = existingByKey[key];
    return {
      key,
      name: v.altVariable || v.labelOfComponent || key,
      label: v.altVariable || v.labelOfComponent || key,
      isChecked: existing?.isChecked ?? true,
      isFormVariable: v.isFormVariable,
      sortOrder: existing?.sortOrder ?? ((preservedFixed.length + idx + 1) as any),
      type: v.type
    };
  });

  // Combine and set
  setSortFields([
    ...preservedFixed,
    ...newVariableFields
  ]);
}, [localSavedFormVariables]);


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
    // Persist variable selections to parent only after successful save
    setSavedFormVariables(localSavedFormVariables);
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
        {activeTab === "fields" && (
          <>
            <DragandDropSort
              key={sortFields?.length}
              items={sortFields}
              onUpdate={handleUpdateOrder}
              icon={<FormVariableIcon color={darkColor} />}
              data-testid="columns-sort"
              preventLastCheck={true}
            />
          </>
        )}
        {activeTab === "form" && (
          <VariableSelection
            show={true}
            onClose={() => {}}
            form={form}
            savedFormVariables={localSavedFormVariables as any}
            fieldLabel="Field"
            isLoading={isFormFetched}
            tabKey="form"
            SystemVariables={SystemVariables as any}
            onChange={setLocalSavedFormVariables as any}
            disabled={false}
          />
        )}
        {activeTab === "system" && (
          <VariableSelection
            show={true}
            onClose={() => {}}
            form={form}
            savedFormVariables={localSavedFormVariables as any}
            fieldLabel="Variable"
            isLoading={isFormFetched}
            tabKey="system"
            SystemVariables={SystemVariables as any}
            onChange={setLocalSavedFormVariables as any}
            disabled={false}
          />
        )}
          

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
