import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { CloseIcon, CustomSearch } from "@formsflow/components";
import { Form, getForm,Formio } from "@aot-technologies/formio-react";
import { fetchAllForms,getFormProcesses } from "../api/services/filter";
import { useSelector,useDispatch } from "react-redux";
interface FormSelectionModalProps {
  showModal: boolean;
  onClose: () => {};
  onSelectForm?: (formId: string) => {};
  isLoading?: boolean;
}

export const FormSelectionModal: React.FC<FormSelectionModalProps> = React.memo(
  ({ showModal, onClose, onSelectForm,  isLoading }) => {
  const dispatch = useDispatch();

    const { t } = useTranslation();
    const [selectedForm, setSelectedForm] = useState<string>("");
    const [searchFormName, setSearchFormName] = useState<string>("");
    const [loadingForms, setLoadingForm] = useState<boolean>(false);
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [form, setForm] = useState<any>(null);
    const [formNames, setFormNames] = useState({ data: [], isLoading: true });
    const [filteredFormNames, setFilteredFormNames] = useState<any[]>(formNames.data);
    const formstate = useSelector((state: any) => state.form); 
    console.log("formstate", formstate);

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
    console.log(selectedFormId);
     useEffect(() => {
      if (selectedFormId) {
        dispatch(getForm("form",selectedFormId));
      }
    }, [selectedFormId]);
    return (
      <Modal show={showModal} size="lg" className="form-selection-modal">
        <Modal.Header className="form-selection-header">
          <Modal.Title> {t("Select a Form")} </Modal.Title>
          <div className="d-flex align-items-center">
            <CloseIcon
              onClick={onClose}
              data-testid="form-selection-modal-close-icon"
            />
          </div>
        </Modal.Header>
        <Modal.Body className="create-form-modal-body">
          <div className="template-left">
            <div className="search-form">
              <CustomSearch
                placeholder={t("Search ...")}
                search={searchFormName}
                setSearch={setSearchFormName}
                handleClearSearch={handleClearSearch}
                handleSearch={handleFormNameSearch}
                dataTestId="template-custom-search"
              />
            </div>
            <div className="form-list">
              {loadingForms || isLoading ? (
                <div className="template-spinner"></div>
              ) : (
                getFormOptions().map((item) => {
                  return (
                    <div
                      className={`form-list-item ${
                        selectedFormId === item.formId ? "active-form" : ""
                      }`}
                      onClick={() => setSelectedFormId(item.formId)}
                      key={item.formId}
                    >
                      <p>{item.formName}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="template-right">
            {/* <div className="sub-container wizard-tab">
          <Form
            form={updatedForm}
            options={{
              viewAsHtml: true,
              readOnly: true,
                          }}
            showHiddenFields={false}
            formReady={(e) => {
              formRef.current = e;
            }}
          />
          </div> */}
          </div>
        </Modal.Body>
      </Modal>
    );
  }
);
