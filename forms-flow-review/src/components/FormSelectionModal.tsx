import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomSearch, CustomCheckbox } from "@formsflow/components";
import { Form } from "@aot-technologies/formio-react";
import {  fetchFormById } from "../api/services/filterServices";
import Loading from "./Loading/Loading";
interface FormSelectionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSelectForm: ({formId,formName}) => void;
  forms: any[];
  selectedForm?: { formId: string; formName: string };
  isFormRendering?: boolean;
}

export const FormSelectionModal: React.FC<FormSelectionModalProps> = React.memo(
  ({ onSelectForm, forms, selectedForm: selectedFormProp }) => {

    const { t } = useTranslation();
    const [searchFormName, setSearchFormName] = useState<string>("");
    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [selectedForm, setSelectedForm] = useState({ formId: selectedFormProp?.formId || "", formName: selectedFormProp?.formName || "" });
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<any>(null);
    const [formNames, setFormNames] = useState({ data: [], isLoading: true });
    const [filteredFormNames, setFilteredFormNames] = useState<any[]>(
      formNames.data
    );

    useEffect(() => {
      handleFormNameSearch();
    }, [searchFormName]);

    useEffect(() => {
      if (forms.length) {
        setFormNames({
          data: forms
            .filter((i) => !i?.formType || i.formType === "form")
            .map((i) => ({
              formName: i.formName,
              formId: i.formId,
              formType: i.formType,
            })),
          isLoading: false,
        });
      }
    }, [forms.length, forms]);
    

    // Sync local selection with parent-provided selection (edit mode)
    useEffect(() => {
      if (selectedFormProp?.formId && selectedFormProp.formId !== selectedForm.formId) {
        setSelectedForm({ formId: selectedFormProp.formId, formName: selectedFormProp.formName });
      }
    }, [selectedFormProp?.formId, selectedFormProp?.formName]);

    
    const handleFormNameSearch = () => {
      setLoadingForm(true);
      if (searchFormName?.trim()) {
        setFilteredFormNames(
          formNames?.data.filter(
            (i) =>
              (!i?.formType || i.formType === "form") &&
              i.formName
                ?.toLowerCase()
                .includes(searchFormName.trim().toLowerCase())
          )
        );
      } else {
        // no search term → show all items with formType = "form"
        setFilteredFormNames(
          formNames?.data?.filter((i) => !i?.formType || i.formType === "form") || []
        );        
      }
    
      setLoadingForm(false);
    };
    const handleClearSearch = () => {
      setSearchFormName("");
      setFilteredFormNames(
        formNames?.data?.filter((i) => !i?.formType || i.formType === "form") || []
      );      
    };
    const getFormOptions = () => {
      return searchFormName ? filteredFormNames : formNames.data;
    };
    useEffect(() => {
      if (selectedForm.formId) {
        setLoading(true);
        setForm(null); // reset previous preview
        fetchFormById(selectedForm.formId)
          .then((res) => {
            if (res.data) setForm(res.data);
          })
          .catch((err) => console.error("Error fetching form data:", err))
          .finally(() => setLoading(false));
      } else {
        setForm(null);
      }
    }, [selectedForm.formId]);
    


    function renderFormList() {
      if (loadingForm || formNames.isLoading) {
        return <div className="form-selection-spinner"></div>;
      }
    
      const formOptions = getFormOptions();
      if (formOptions.length > 0) {
        // Normalize to strings so CustomCheckbox strict-equality matches
        const items = formOptions.map((item) => ({ label: item.formName, value: String(item.formId) }));
        const selectedValues = selectedForm.formId ? [String(selectedForm.formId)] : [];
        return (
          <CustomCheckbox
            key={`form-list-${String(selectedForm.formId)}-${items.length}`}
          size="small"
          variant="secondary"
            items={items}
            inline={false}
            optionClassName="form-option"
            selectedValues={selectedValues}
            onChange={(_values, event) => {
              const clickedId = String(event?.currentTarget?.value ?? event?.target?.value);
              if (!clickedId) return;
              if (String(selectedForm.formId) === clickedId) {
                setSelectedForm({ formId: "", formName: "" });
                return;
              }
              const matched = formOptions.find((i) => String(i.formId) === clickedId);
              if (matched) {
                const newSel = { formId: String(matched.formId), formName: matched.formName };
                setSelectedForm(newSel);
                onSelectForm(newSel);
              }
            }}
            dataTestId="form-selection-modal-form-item"
            ariaLabel={t("Select a form")}
          />
        );
      }
    
      return <span className="nothing-found-text">{t("Nothing is found. Please try again.")}</span>;
    }
    
    return (
             
        <div className="filter-form-selection-page">
          <div className="left-form-list-container">
            <CustomSearch
              placeholder={t("Search for a form")}
              search={searchFormName}
              setSearch={setSearchFormName}
              handleClearSearch={handleClearSearch}
              handleSearch={handleFormNameSearch}
              dataTestId="form-custom-search"
            />
            <div aria-hidden="true" className="border-top my-3" />
          
            <div className="form-items-list">
            {renderFormList()}
            </div>
          </div>
          <div className="right-form-preview-container">
            <div className="form-preview-inner-container" >
              {loading ? (
                <div className="form-selection-spinner">
                  <Loading />
                </div>
              ) : (
                form ? (
                  <Form
                  key={selectedForm.formId}
                  form={form}
                  options={{
                    noAlerts: true,
                    readOnly: true,
                    showHiddenFields: true
                    } as any}
                  />
                ) : null
              )}
            </div>
          </div>
        </div>
        
    );
  }
);
