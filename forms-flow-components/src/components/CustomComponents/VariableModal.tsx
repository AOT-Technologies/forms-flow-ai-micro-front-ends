import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface FormVariable {
  key: string;
  altVariable: string;
  labelOfComponent: string;
  type: string;
}
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
  form: any;
  savedFormVariables?: FormVariable[];
  saveBtnDisabled?: boolean;
  fieldLabel?: string;
  systemVariables: FormVariable[];
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
    savedFormVariables,
    saveBtnDisabled = false,
    fieldLabel = "Variable", // to display the form field labels
    systemVariables
  }) => {
    const [alternativeLabels, setAlternativeLabels] = useState([]);
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

    // ignoring there variables from selection
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

    useEffect(() => {
      if (savedFormVariables) {
        setAlternativeLabels(savedFormVariables);
      }
    }, [savedFormVariables]);

    const SystemTabContent = useCallback(
      () => (
        <div className="system-tab-container">
          {systemVariables?.map(({ key, labelOfComponent, type }) => (
            <span
              key={key}
              className={`system-item ${
                selectedComponent?.key === key ? "selected-item" : ""
              }`}
              onClick={() => {
                setSelectedComponent({
                  key,
                  type,
                  label: labelOfComponent,
                  altVariable: "",
                });
                setShowElement(true);
              }}
            >
              {labelOfComponent}
            </span>
          ))}
        </div>
      ),
      [systemVariables, selectedComponent]
    );


    const tabs = useMemo(
      () => [
        {
          eventKey: "system",
          title: t("System"),
          content: SystemTabContent(),
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
      ],
      [form, alternativeLabels, t,selectedComponent.key]
    );

    // handling the add alternative variable
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

    const handleSaveChanges = () => {
      primaryBtnAction(alternativeLabels);
      onClose();
    };

    // handling the remove selected variables
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
    // render the selection of variables and selected variables
    const renderRightContainer = () => {
      // const filteredVariablePills = Object.values(alternativeLabels).filter(
      //   ({ key }) => !ignoreKeywords.has(key)
      // );
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
                  onClick={() => setShowElement(false)}
                />
              </div>
            </div>

            <div className="scroll-vertical">
              <div className="content">
                {!ignoreKeywords.has(selectedComponent.key)  && (
                  <div className="d-flex flex-column">
                    <span>{t("Type")}:</span>
                    <span className="text-bold">{selectedComponent.type}</span>
                  </div>
                )}

                <div className="d-flex flex-column">
                  <span>{fieldLabel}:</span>
                  <span className="text-bold">{selectedComponent.key}</span>
                </div>

                {!ignoreKeywords.has(selectedComponent.key) && (
                  <FormInput
                    type="text"
                    ariaLabel="Add alternative label input"
                    dataTestId="Add-alternative-input"
                    label="Add Alternative Label"
                    value={selectedComponent.altVariable}
                    id="add-alternative"
                    onChange={(e) =>
                      setSelectedComponent((prev) => ({
                        ...prev,
                        altVariable: e.target.value,
                      }))
                    }
                  />
                )}

                <CustomButton
                  dataTestId="Add-alternative-btn"
                  ariaLabel="Add alternative label button"
                  actionTable
                  label={
                    alternativeLabels[selectedComponent.key]
                      ? t(`Update This ${fieldLabel}`)
                      : t(`Add This ${fieldLabel}`)
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
                {t("Selected Variables") + ` (${Object.keys(alternativeLabels).length })`}
              </p>

              {Object.keys(alternativeLabels).length > 0 ? (
                <div className="pill-container">
                  {Object.values(alternativeLabels).map(
                    ({ key, altVariable, labelOfComponent }: any) => (
                      // <div
                      //   className="button-as-div"
                      //   key={key}
                      //   onClick={() => {
                      //     const selected = alternativeLabels[key];
                      //     setSelectedComponent({
                      //       key: selected.key,
                      //       type: selected.type,
                      //       label: selected.labelOfComponent,
                      //       altVariable: selected.altVariable,
                      //     });
                      //     setShowElement(true);
                      //   }}
                      // >
                      <CustomPill
                        key={key}
                        label={altVariable || labelOfComponent}
                        icon={
                          <CloseIcon
                            color={primaryColor}
                            data-testid="pill-remove-icon"
                          />
                        }
                        bg={primaryLight}
                        onClick={() => removeSelectedVariable(key)}
                        secondaryLabel={key}
                        className="d-flex flex-row justify-content-between align-items-center"
                      />
                      // </div>
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

    // checking if the variables list  have changed ornot to update the save button 
    const hasAltVariableChanged = useMemo(() => {
      return (
        JSON.stringify(savedFormVariables) !== JSON.stringify(alternativeLabels)
      );
    }, [savedFormVariables, alternativeLabels]);
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
          <div
            className="icon-close"
            onClick={onClose}
            data-testid="close-task-var-modal"
          >
            <CloseIcon />
          </div>
        </ModalHeader>
        <Modal.Body className={`variable-modal-body ${saveBtnDisabled && "disabled"}`}>
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
              disabled={saveBtnDisabled || !hasAltVariableChanged}
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
