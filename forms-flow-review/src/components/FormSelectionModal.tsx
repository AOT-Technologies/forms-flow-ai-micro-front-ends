import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useTranslation } from "react-i18next";
import { CloseIcon, CustomSearch } from "@formsflow/components";
import { Form, Formio } from "@aot-technologies/formio-react";
import { fetchAllForms,fetchFormById } from "../api/services/filterServices";
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
    //  useEffect(() => {
    //   if (selectedFormId) {
    //     dispatch(getForm("form",selectedFormId));
    //   }
    // }, [selectedFormId]);

    // useEffect(() => {
    //   console.log("selectedFormId  inside", selectedFormId);
    //   if (selectedFormId) {
       
    //   }
    // }, [selectedFormId]);
    useEffect(() => {
      if (selectedFormId) {
       // setLoading(true);
        // Fetch form data by ID
        fetchFormById(selectedFormId)
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
            //setLoading(false);
          });
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
          <div className="px-4 pt-4 form-preview">
                        <Form
                          form={form}
                          options={{
                            //disableAlerts: true,
                            noAlerts: true,
                            //language: lang, i18n: RESOURCE_BUNDLES_DATA
                          }}
                        />
                      </div>
   
          </div>
        </Modal.Body>
      </Modal>
    );
  }
);
