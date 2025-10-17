import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FormComponent,
  V8CustomButton,
  CustomTextInput
} from "../../formsflow-components";
import { DataGrid } from '@mui/x-data-grid';

interface FormVariable {
  key: string;
  altVariable: string;
  labelOfComponent: string;
  type: string;
  isFormVariable?: boolean;
}
interface VariableSelectionProps {
  show: boolean;
  onClose: () => void;
  primaryBtnAction: (value) => void;
  form: any;
  savedFormVariables?: FormVariable[];
  fieldLabel?: string;
  isLoading?: boolean;
  rowVariables: FormVariable[];
  columns: any;
  tabKey: string;
}

export const VariableSelection: React.FC<VariableSelectionProps> = React.memo(
  ({
    form,
    savedFormVariables,
    fieldLabel = "Variable",
    isLoading = false,
    rowVariables,
    columns,
    tabKey = "system",
  }) => {
    // const [alternativeLabels, setAlternativeLabels] = useState([]);
    const [alternativeLabels, setAlternativeLabels] = useState<Record<string, FormVariable>>({});
    const detailsRef = useRef(null);
    const [showElement, setShowElement] = useState(false);
    const { t } = useTranslation();
    const [selectedComponent, setSelectedComponent] = useState({
      key: null,
      type: "",
      label: "",
      altVariable: "",
      isFormVariable: true,
    });

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
      // if (savedFormVariables) {
      //   setAlternativeLabels(savedFormVariables);
      // }

      if (savedFormVariables && Array.isArray(savedFormVariables)) {
        const byKey = savedFormVariables.reduce((acc, v) => {
          acc[v.key] = v;
          return acc;
        }, {} as Record<string, FormVariable>);
        setAlternativeLabels(byKey);
      } else if (savedFormVariables && typeof savedFormVariables === "object") {
        setAlternativeLabels(savedFormVariables as unknown as Record<string, FormVariable>);
      } else {
        setAlternativeLabels({});
      }
    }, [savedFormVariables]);

    // System variables grid
    const renderSystemContent = () => (
      <div className="system-content-block">
        <div className="system-content-table">
          <DataGrid
            columns={columns}
            rows={rowVariables || []}
            disableColumnMenu
            rowHeight={55}
            disableRowSelectionOnClick
            rowCount={rowVariables?.length}
          />
        </div>
      </div>
    );

    // Form variables custom form
    const renderFormContent = () => (
      <div className="form-content-block">
        {
          isLoading
            ? <div className="form-spinner"></div>
            : <FormComponent
                form={form}
                setShowElement={setShowElement}
                detailsRef={detailsRef}
                alternativeLabels={alternativeLabels}
                setSelectedComponent={setSelectedComponent}
                ignoreKeywords={ignoreKeywords}
              />
        }
      </div>
    );

    const handleAddAlternative = () => {
      if (selectedComponent.key) {
        setAlternativeLabels((prev) => ({
          ...prev,
          [selectedComponent.key]: {
            altVariable: selectedComponent.altVariable,
            labelOfComponent: selectedComponent.label,
            type: selectedComponent.type,
            key: selectedComponent.key,
            isFormVariable: selectedComponent.isFormVariable,
          },
        }));
        const highlightedElement = document.querySelector(".formio-hilighted");
        if (highlightedElement) {
          highlightedElement.classList.remove("formio-hilighted");
        }
      }
      setShowElement(false);
    };

    // const handleSaveChanges = () => {
      // primaryBtnAction(alternativeLabels);
      // onClose();
    // };

    // const removeSelectedVariable = useCallback((key) => {
    //   setSelectedComponent((prev) => ({
    //     ...prev,
    //     altVariable: "",
    //   }));
    //   setAlternativeLabels((prev) => {
    //     const newLabels = { ...prev };
    //     delete newLabels[key];
    //     return newLabels;
    //   });
    // }, []);

    const renderRightContainer = () => {
      return (
        <div className="variable-right-content">
          {/* Slideout panel, always mounted */}
          <div
            className={`slideout-variable-selected ${showElement ? "show" : ""}`}
          >
            <div className="scroll-vertical">
              <div className="content">
                {!ignoreKeywords.has(selectedComponent.key) && (
                  <div className="d-flex flex-column item-container">
                    <span className="label">
                      {t("Type")}
                    </span>
                    <span className="value">
                      {selectedComponent.type}
                    </span>
                  </div>
                )}
                <div className="d-flex flex-column item-container">
                  <span className="label">
                    {fieldLabel}
                  </span>
                  <span className="value">
                    {selectedComponent.key}
                  </span>
                </div>
                {!ignoreKeywords.has(selectedComponent.key) && (
                  <div className="alternative-label-container">
                    <span className="label">
                      {t("Add alternative label")}
                    </span>
                    <CustomTextInput
                      ariaLabel="Add alternative label input"
                      dataTestId="Add-alternative-input"
                      value={selectedComponent.altVariable}
                      setValue={(value) => setSelectedComponent((prev) => ({
                        ...prev,
                        altVariable: value,
                      }))}
                      placeholder=""
                      />
                  </div>
                      // onChange={(e) =>
                      //   setSelectedComponent((prev) => ({
                      //     ...prev,
                      //     altVariable: e.target.value,
                      //   }))
                      // }
                )}
                {!(selectedComponent.key in alternativeLabels && ignoreKeywords.has(selectedComponent.key)) && (
                  <div className="button-container">
                    <V8CustomButton
                      size="medium"
                      variant="primary"
                      dataTestId="Add-alternative-btn"
                      ariaLabel="Add alternative label button"
                      label={
                        alternativeLabels[selectedComponent.key]
                          ? t(`Update`)
                          : t(`Add`)
                      }
                      onClick={handleAddAlternative}
                      disabled={
                        selectedComponent.altVariable ===
                        alternativeLabels[selectedComponent.key]?.altVariable
                      }
                    />
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
      );
    };

    // const hasAltVariableChanged = useMemo(() => {
    //   return (
    //     JSON.stringify(savedFormVariables) !== JSON.stringify(alternativeLabels)
    //   );
    // }, [savedFormVariables, alternativeLabels]);

    return (
      <div className="variable-page-container">
        <div className="variable-page-body d-flex">
          {tabKey === "system" &&
            <div className="variable-left-container">
              {renderSystemContent()}
            </div>
          }
          {tabKey === "form" &&
            <div className="variable-page-body-form">
              <div className="variable-left-container">
                {tabKey === "form" && renderFormContent()}
              </div>
              <div
                className="variable-right-container"
                ref={detailsRef}
              >
                {renderRightContainer()}
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
);
