import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { CloseIcon, CustomSearch, CustomButton } from "@formsflow/components";
import { Form, Formio } from "@aot-technologies/formio-react";
import { fetchAllForms, fetchFormById } from "../api/services/filterServices";
import { useSelector, useDispatch } from "react-redux";
interface FormSelectionModalProps {
  showModal: boolean;
  onClose: () => void;
  onSelectForm: ({formId,formName}) => void;
}

export const FormSelectionModal: React.FC<FormSelectionModalProps> = React.memo(
  ({ showModal, onClose, onSelectForm }) => {
    const dispatch = useDispatch();

    const { t } = useTranslation();
    const [selectedFormName, setSelectedFormN] = useState<string>("");
    const [searchFormName, setSearchFormName] = useState<string>("");
    const [loadingForms, setLoadingForm] = useState<boolean>(false);
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
      fetchAllForms().then((res) => {
        const data = res.data?.forms || [];
        setFormNames({
          data: data.map((i) => ({ formName: i.formName, formId: i.formId })),
          isLoading: false,
        });
      });
    }, []);
    useEffect (()=>{
      if(formNames.data.length > 0) {
        setSelectedForm( ({ formId: formNames.data[0].formId, formName: formNames.data[0].formName }));
      }
    },[formNames.data])
    const handleFormNameSearch = () => {
      setLoadingForm(true);
      if (searchFormName?.trim()) {
        setFilteredFormNames(
          formNames?.data.filter((i) =>
            i.formName
              .toLowerCase()
              ?.includes(searchFormName?.trim()?.toLowerCase())
          )
        );
      }
      setLoadingForm(false);
    };
    const handleClearSearch = () => {
      setSearchFormName("");
      setFilteredFormNames(formNames.data);
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
              err.response?.data || err.message
            );
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, [selectedForm]);
    return (
      <Modal 
      show={showModal} 
      centered
      size="lg" 
      className="form-selection-modal">
        <Modal.Header className="form-selection-header">
          <Modal.Title> {t("Select a Form")} </Modal.Title>
          <div className="d-flex align-items-center">
            <CloseIcon
              onClick={onClose}
              data-testid="form-selection-modal-close-icon"
            />
          </div>
        </Modal.Header>
        <Modal.Body className="form-selection-modal-body">
          <div className="form-selection-left">
            <div className="search-form">
              <CustomSearch
                placeholder={t("Search ...")}
                search={searchFormName}
                setSearch={setSearchFormName}
                handleClearSearch={handleClearSearch}
                handleSearch={handleFormNameSearch}
                dataTestId="form-custom-search"
              />
            </div>
            <div className="form-list">
              {loadingForms || formNames.isLoading ? (
                <div className="form-selection-spinner"></div>
              ) : getFormOptions().length > 0 ? (
                getFormOptions().map((item) => {
                  return (
                    <button
                      className={`form-list-item button-as-div ${
                        selectedForm.formId === item.formId ? "active-form" : ""
                      }`}
                      onClick={() => setSelectedForm({formId:item.formId , formName:item.formName})}
                      key={item.formId}
                      data-testid="form-selection-modal-form-item"
                    >
                      {item.formName}
                    </button>
                  );
                })
              ) : (
                <span className="noting-found-text">
                  {t("Nothing is found. Please try again.")}
                </span>
              )}
            </div>
          </div>
          <div className="form-selection-right">
            <div className="form-selection-preview custom-scroll">
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
            <div className="form-select-btn">
              <CustomButton
               onClick={() => {
                 onSelectForm(selectedForm);
                }}
                variant="primary"
                label={t("Select This Form")}
                size="md"
                dataTestid="select-form-btn"
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
);
