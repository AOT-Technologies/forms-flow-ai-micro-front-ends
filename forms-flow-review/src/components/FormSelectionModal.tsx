import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { CloseIcon, CustomSearch, CustomButton } from "@formsflow/components";
import { Form } from "@aot-technologies/formio-react";
import {  fetchFormById } from "../api/services/filterServices";
interface FormSelectionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSelectForm: ({formId,formName}) => void;
  forms: any[];
}

export const FormSelectionModal: React.FC<FormSelectionModalProps> = React.memo(
  ({ showModal, onClose, onSelectForm, forms }) => {

    const { t } = useTranslation();
    const [searchFormName, setSearchFormName] = useState<string>("");
    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [selectedForm, setSelectedForm] = useState({ formId: "", formName: "" });
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
    

    useEffect (()=>{
      if(formNames.data.length > 0) {
        setSelectedForm( ({ formId: formNames.data[0].formId, formName: formNames.data[0].formName }));
      }
    },[formNames.data])
    const handleFormNameSearch = () => {
      setLoadingForm(true);
      if (searchFormName?.trim()) {
        setFilteredFormNames(
          formNames?.data.filter(
            (i) =>
              i.formType === "form" && 
              i.formName
                .toLowerCase()
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
        // Fetch form data by ID
        fetchFormById(selectedForm.formId)
          .then((res) => {
            if (res.data) {
              const { data } = res;
              setForm(data);
            }
          })
          .catch((err) => {
            console.error(
              "Error fetching form data:",
              err.response?.data ?? err.message
            );
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, [selectedForm]); 


    function renderFormList() {
      if (loadingForm || formNames.isLoading) {
        return <div className="form-selection-spinner"></div>;
      }
    
      const formOptions = getFormOptions();
      if (formOptions.length > 0) {
        return formOptions.map((item) => (
          <button
            className={`${
              selectedForm.formId === item.formId ? "active" : ""
            }`}
            onClick={() => setSelectedForm({ formId: item.formId, formName: item.formName })}
            key={item.formId}
            data-testid="form-selection-modal-form-item"
          >
            {item.formName}
          </button>
        ));
      }
    
      return <span className="nothing-found-text">{t("Nothing is found. Please try again.")}</span>;
    }
    
    return (
      <Modal 
      show={showModal} 
      size="lg">
        <Modal.Header>
          <Modal.Title> <p> {t("Select a Form")} </p></Modal.Title>
          <div className="icon-close" onClick={onClose}>
            <CloseIcon data-testid="form-selection-modal-close-icon" />
          </div>
        </Modal.Header>
        <Modal.Body className="side-by-side">
          <div className="left scroll-list">
            <CustomSearch
              placeholder={t("Search")}
              search={searchFormName}
              setSearch={setSearchFormName}
              handleClearSearch={handleClearSearch}
              handleSearch={handleFormNameSearch}
              dataTestId="form-custom-search"
            />
            <div className="items">
            {renderFormList()}
            </div>
          </div>
          <div className="right">
            <div className="preview">
              {loading ? (
                <div className="form-selection-spinner"></div>
              ) : (
                <Form
                  form={form}
                  options={{
                    noAlerts: true,
                    viewAsHtml: true,
                    readOnly: true,
                    showHiddenFields:true
                  } as any}
                  
                />
              )}
            </div>
            <div className="actions">
              <CustomButton
               onClick={() => {
                 onSelectForm(selectedForm);
                }}
                label={t("Select This Form")}
                dataTestid="select-form-btn"
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
);
