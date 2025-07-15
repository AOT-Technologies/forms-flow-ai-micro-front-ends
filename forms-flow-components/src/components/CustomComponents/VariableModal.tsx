import React, { useCallback, useMemo, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import ModalHeader from "react-bootstrap/esm/ModalHeader";
import { useTranslation } from "react-i18next";
import {
  CloseIcon,
  CustomButton,
  CustomPill,
  CustomTabs,
  FormComponent,
  FormInput,
} from "../../formsflow-components";
import { StyleServices } from "@formsflow/service";
import Badge from "react-bootstrap/Badge";

interface VariableModalProps {
  show: boolean;
  onClose: () => void;
  primaryBtnAction: (value) => void;
  modalHeader?: string;
  primaryBtnLabel?: string;
  secondaryBtnLabel?: string;
  primaryBtndataTestid?: string;
  secondaryBtndataTestid?: string;
  primaryBtnariaLabel?: string;
  secondaryBtnariaLabel?: string;
  closedataTestid?: string;
  form: any;
  updatedAltLabels?: any;
}

export const VariableModal: React.FC<VariableModalProps> = React.memo(
  ({
    show,
    onClose,
    primaryBtnAction = () => {},
    modalHeader = "Select Variables",
    primaryBtnLabel = "Save Changes",
    secondaryBtnLabel = "Cancel",
    primaryBtndataTestid = "save-changes-button",
    secondaryBtndataTestid = "cancel-button",
    primaryBtnariaLabel = "save changes",
    secondaryBtnariaLabel = "Cancel",
    form,
    updatedAltLabels,
  }) => {
    const [alternativeLabels, setAlternativeLabels] =
      useState(updatedAltLabels);
    const detailsRef = useRef(null);
    const [showElement, setShowElement] = useState(false);
    const TAB_KEYS = {
      SYSTEM: "system",
      FORM: "form",
    };
    const [key, setKey] = useState(TAB_KEYS.SYSTEM);
    const { t } = useTranslation();
    const [selectedComponent, setSelectedComponent] = useState({
      key: null,
      type: "",
      label: "",
      altVariable: "",
    });
    const primaryColor = StyleServices.getCSSVariable("--ff-primary");
    const primaryLight = StyleServices.getCSSVariable("--ff-primary-light");
    const ignoreKeywords = new Set([
      "applicationId",
      "applicationStatus",
      "currentUser",
      "submitterEmail",
      "submitterFirstName",
      "submitterLastName",
      "currentUserRoles",
      "allAvailableRoles",
    ]);

    const tabs = useMemo(() => [
  {
    eventKey: "system",
    title: t("System"),
    content: <div className="p-2">System variable show here</div>,
  },
  {
    eventKey: "form",
    title: t("Form"),
    className: "form-container",
    content: (
      <FormComponent
        form={form}
        setShowElement={setShowElement}
        detailsRef={detailsRef}
        alternativeLabels={alternativeLabels}
        setSelectedComponent={setSelectedComponent}
        ignoreKeywords={ignoreKeywords}
      />
    ),
  },
], [form, alternativeLabels, t]);


    const handleAddAlternative = () => {
      if (selectedComponent.key) {
        setAlternativeLabels((prev) => ({
          ...prev,
          [selectedComponent.key]: {
            altVariable: selectedComponent.altVariable,
            labelOfComponent: selectedComponent.label,
            type: selectedComponent.type,
            key: selectedComponent.key,
          },
        }));
        const highlightedElement = document.querySelector(".formio-hilighted");
        if (highlightedElement) {
          highlightedElement.classList.remove("formio-hilighted");
        }
      }
      setShowElement(false);
    };

    const handleSaveChanges = () =>{
      primaryBtnAction(alternativeLabels);
      onClose(); 
    }

    const removeSelectedVariable = useCallback((key) => {
        setSelectedComponent((prev) => ({
            ...prev,
            altVariable: "",
          }));
      setAlternativeLabels((prev) => {
        const newLabels = { ...prev };
        delete newLabels[key];
        return newLabels;
      });

    }, []);

  const renderRightContainer = () => {
  const filteredVariablePills = useMemo(
    () =>
      Object.values(alternativeLabels).filter(
        ({ key }) => !ignoreKeywords.has(key)
      ),
    [alternativeLabels]
  );
   
  return (
    <div className="">
      {/* Slideout panel, always mounted */}
      <div
        className={`slideout-variable-selected ${
          showElement ? "show" : ""
        }`}
      >
        <div className="head">
          <div>
            <CloseIcon
              dataTestId="close"
              color="red"
              onClick={() => setShowElement(false)}
            />
          </div>
        </div>

        <div className="scroll-vertical">
          <div className="content">
            <div className="variable-info">
              <p>{t("Type")}:</p>
              <p>{selectedComponent.type}</p>
            </div>

            <div className="variable-info">
              <p>{t("Variable")}:</p>
              <p>{selectedComponent.key}</p>
            </div>

            <FormInput
              type="text"
              ariaLabel="Add alternative label input"
              dataTestId="Add-alternative-input"
              label="Add Alternative Label"
              value={selectedComponent.altVariable}
              onChange={(e) =>
                setSelectedComponent((prev) => ({
                  ...prev,
                  altVariable: e.target.value,
                }))
              }
            />

            <CustomButton
              variant="primary"
              dataTestId="Add-alternative-btn"
              ariaLabel="Add alternative label button"
              size="sm"
              label={
                alternativeLabels[selectedComponent.key]
                  ? t("Update This Variable")
                  : t("Add This Variable")
              }
              onClick={handleAddAlternative}
              disabled={
                selectedComponent.altVariable ===
                alternativeLabels[selectedComponent.key]?.altVariable
              }
            />
          </div>
        </div>
      </div>

      {/* Pills or empty state - only shown when panel is hidden */}
      {!showElement && (
        <>
          <p className="right-container-header">
            {t("Selected Variables") + ` (${filteredVariablePills.length})`}
          </p>
          
          {filteredVariablePills.length > 0 ? (
            <div className="pill-container">
              {filteredVariablePills.map(
              ({ key, altVariable, labelOfComponent }: any) => (
                <Badge
                  pill
                  variant={primaryLight}
                  data-testid="variable-pill"
                  aria-label="variable-pill"
                  key={key}
                >
                  <div className="d-flex flex-column">
                    <span className="primary-label">
                      {altVariable || labelOfComponent}
                    </span>
                    <span className="secondary-label">{key}</span>
                  </div>
                  <div>
                    <CloseIcon
                      color="red"
                      data-testid="pill-remove-icon"
                      onClick={() => removeSelectedVariable(key)}
                    />
                  </div>
                </Badge>
              )
            )}
          </div>
            
          ) : (
            <p className="select-text">
              {t(
                "To use variables in the flow, submissions and tasks you need to specify which variables you want to import. Variables get imported at the time of the submission. If specific variables are not selected prior to the submission THEY WILL NOT BE AVAILABLE."
              )}
              <br />
              <br />
              {t(
                "Select a form field on the left to add a variable to the list."
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
};

    return (
      <Modal
        show={show}
        data-testid="variable-modal"
        aria-labelledby="variable-modal"
        aria-describedby="variable-modal-message"
        onHide={onClose}
        size="lg"
        className="variable-modal"
      >
        <ModalHeader>
          <Modal.Title id="variable-modal-title">
            <p>{modalHeader}</p>
          </Modal.Title>
          <div className="icon-close" onClick={onClose}>
            <CloseIcon dataTestId="close-task-var-modal" />
          </div>
        </ModalHeader>
        <Modal.Body className="variable-modal-body">
          <div className="variable-modal-left-container tabs">
            <CustomTabs
              defaultActiveKey={key}
              onSelect={setKey}
              tabs={tabs}
              dataTestId="template-form-flow-tabs"
              ariaLabel="Template forms flow  tabs"
              className=""
            />
          </div>
          <div className="variable-modal-right-container" ref={detailsRef}>
            {renderRightContainer()}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="buttons-row">
            <CustomButton
              // disabled={}
              label={t(primaryBtnLabel)}
              onClick={handleSaveChanges}
              name="applyButton"
              dataTestId={primaryBtndataTestid}
              ariaLabel={t(primaryBtnariaLabel)}
            />
            <CustomButton
              name="cancelButton"
              label={t(secondaryBtnLabel)}
              onClick={onClose}
              dataTestId={secondaryBtndataTestid}
              ariaLabel={t(secondaryBtnariaLabel)}
              secondary
            />
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
);
