import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FormComponent,
  V8CustomButton,
  CustomTextInput,
  CloseIcon,
  Switch
} from "../../formsflow-components";
import { BackIcon } from "../SvgIcons";
import { DataGrid } from '@mui/x-data-grid';
import { StyleServices } from "@formsflow/service";

interface FormVariable {
  key: string;
  altVariable: string;
  labelOfComponent: string;
  type: string;
  isFormVariable?: boolean;
}
interface SystemVariable {
  altVariable: string;
  labelOfComponent: string;
  type: string;
  key: string;
}
interface VariableSelectionProps {
  show: boolean;
  onClose: () => void;
  form: any;
  savedFormVariables?: FormVariable[];
  fieldLabel?: string;
  isLoading?: boolean;
  tabKey: string;
  SystemVariables: SystemVariable[];
  onChange?: (alternativeLabels: Record<string, FormVariable>) => void;
  disabled?: boolean;
}

export const VariableSelection: React.FC<VariableSelectionProps> = React.memo(
  ({
    form,
    savedFormVariables,
    fieldLabel = "Variable",
    isLoading = false,
    tabKey = "system",
    SystemVariables,
    onChange,
    disabled = false,
  }) => {
    const [alternativeLabels, setAlternativeLabels] = useState<Record<string, FormVariable>>({});
    const detailsRef = useRef(null);
    const isInternalUpdateRef = useRef(false);
    // Store temporary input values for variables that aren't selected yet
    const tempInputValuesRef = useRef<Record<string, string>>({});
    const [tempInputValues, setTempInputValues] = useState<Record<string, string>>({});
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


    // Sync alternativeLabels to parent when it changes internally
    useEffect(() => {
      if (isInternalUpdateRef.current && onChange) {
        isInternalUpdateRef.current = false;
        onChange(alternativeLabels);
      }
    }, [alternativeLabels, onChange]);

    // Sync from savedFormVariables prop when it changes externally
    useEffect(() => {
      if (savedFormVariables && Array.isArray(savedFormVariables)) {
        const byKey = savedFormVariables.reduce((acc, v) => {
          // Find the matching system variable to check defaults
          const systemVariable = SystemVariables.find(sv => sv.key === v.key);
          const defaultAltVariable = systemVariable?.altVariable || "";
          const labelOfComponent = systemVariable?.labelOfComponent || v.labelOfComponent || "";
          
          // If altVariable equals labelOfComponent or default, clear it (means it wasn't user-typed)
          const shouldClearAltVariable = 
            v.altVariable === labelOfComponent || 
            v.altVariable === defaultAltVariable;
          
          acc[v.key] = {
            ...v,
            altVariable: shouldClearAltVariable ? "" : v.altVariable,
          };
          return acc;
        }, {} as Record<string, FormVariable>);
        isInternalUpdateRef.current = false; // Mark as external update
        setAlternativeLabels(byKey);
      } else if (savedFormVariables && typeof savedFormVariables === "object") {
        // Sanitize object format as well
        const sanitized = Object.entries(savedFormVariables).reduce((acc, [key, v]) => {
          const systemVariable = SystemVariables.find(sv => sv.key === key);
          const defaultAltVariable = systemVariable?.altVariable || "";
          const labelOfComponent = systemVariable?.labelOfComponent || v.labelOfComponent || "";
          
          const shouldClearAltVariable = 
            v.altVariable === labelOfComponent || 
            v.altVariable === defaultAltVariable;
          
          acc[key] = {
            ...v,
            altVariable: shouldClearAltVariable ? "" : v.altVariable,
          };
          return acc;
        }, {} as Record<string, FormVariable>);
        
        isInternalUpdateRef.current = false; // Mark as external update
        setAlternativeLabels(sanitized);
      } else if (!savedFormVariables) {
        isInternalUpdateRef.current = false; // Mark as external update
        setAlternativeLabels({});
      }
    }, [savedFormVariables, SystemVariables]);

    // System Variable Handlers
    const handleSystemAltVariableInputChange = useCallback((variableKey: string, systemVariable: SystemVariable) => {
      return (newVal: string) => {
        setAlternativeLabels((prev) => {
          const existing = prev[variableKey];
          if (existing) {
            // Variable is selected (switch is on), update it in alternativeLabels
            isInternalUpdateRef.current = true;
            return {
              ...prev,
              [variableKey]: {
                ...existing,
                altVariable: newVal,
              },
            };
          }
          // Variable is not selected (switch is off), store value temporarily
          // Don't add to alternativeLabels to prevent switch from turning on
          tempInputValuesRef.current[variableKey] = newVal;
          setTempInputValues((prev) => ({
            ...prev,
            [variableKey]: newVal,
          }));
          return prev; // Return previous state unchanged
        });
      };
    }, []);

    const handleSystemVariableToggle = useCallback((variableKey: string, systemVariable: SystemVariable, isChecked: boolean) => {
      isInternalUpdateRef.current = true;
      if (isChecked) {
        // Add variable to alternativeLabels when switch is turned on
        // Use temp input value if user typed before turning on the switch
        const tempValue = tempInputValuesRef.current[variableKey];
        setAlternativeLabels((prev) => ({
          ...prev,
          [variableKey]: {
            key: variableKey,
            altVariable: tempValue || prev[variableKey]?.altVariable || systemVariable?.altVariable || "",
            labelOfComponent: systemVariable?.labelOfComponent || "",
            type: systemVariable?.type || "hidden",
            isFormVariable: false,
          },
        }));
        // Clear temp value after using it
        delete tempInputValuesRef.current[variableKey];
        setTempInputValues((prev) => {
          const updated = { ...prev };
          delete updated[variableKey];
          return updated;
        });
        
      } else {
        // Remove variable from alternativeLabels when switch is turned off
        // Only save to temp storage if user actually typed a value (different from default and labelOfComponent)
        setAlternativeLabels((prev) => {
          const existing = prev[variableKey];
          const defaultAltVariable = systemVariable?.altVariable || "";
          const labelOfComponent = systemVariable?.labelOfComponent || "";
          
          // Only save if there's a value AND it's different from both the default and labelOfComponent
          // (meaning user actually typed something custom)
          const hasCustomValue = existing?.altVariable && 
            existing.altVariable !== defaultAltVariable && 
            existing.altVariable !== labelOfComponent &&
            existing.altVariable.trim() !== "";
          
          if (hasCustomValue) {
            tempInputValuesRef.current[variableKey] = existing.altVariable;
            setTempInputValues((tempPrev) => ({
              ...tempPrev,
              [variableKey]: existing.altVariable,
            }));
          } else {
            // Clear temp value if it's just the default, labelOfComponent, or empty
            delete tempInputValuesRef.current[variableKey];
            setTempInputValues((tempPrev) => {
              const updated = { ...tempPrev };
              delete updated[variableKey];
              return updated;
            });
          }
          const updated = { ...prev };
          delete updated[variableKey];
          return updated;
        });
      }
    }, []); 
    // Form Variable Handlers
    const handleAddAlternative = useCallback(() => {
      if (selectedComponent.key) {
        isInternalUpdateRef.current = true;
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
    }, [selectedComponent]);

    const removeSelectedVariable = useCallback((key) => {
      setSelectedComponent((prev) => ({
        ...prev,
        altVariable: "",
      }));
      isInternalUpdateRef.current = true;
      setAlternativeLabels((prev) => {
        const newLabels = { ...prev };
        delete newLabels[key];
        return newLabels;
      });
    }, []);
    const rowVariables = SystemVariables.map((variable, idx) => ({
      id: idx + 1,
      type: variable.labelOfComponent,
      variable: variable.key,
      altVariable: alternativeLabels[variable.key]?.altVariable || variable.altVariable || "",
    }));
    const columns = [
      { field: 'type', headerName: 'Type', flex: 2.8, sortable: false,width: 140 },
      { field: 'variable', headerName: 'Variable', flex: 1.5, sortable: false, width: 250,
        renderCell: (params) => (
          <span style={{ color: StyleServices.getCSSVariable('--ff-gray-dark') }}>{params.value}</span>
        )
      },
      {
        field: 'altVariable',
        headerName: 'Alternative Field',
        flex: 3.2,
        width: 250,
        sortable: false,
        renderCell: (params) => {
          const variableKey = params.row.variable;
          const systemVariable = SystemVariables.find(v => v.key === variableKey);
          const isSelected = !!alternativeLabels[variableKey];
          
          // If switch is ON: show value from alternativeLabels (with fallback to default)
          // If switch is OFF: only show tempInputValues if user typed something, otherwise empty
          const inputValue = isSelected
            ? (alternativeLabels[variableKey]?.altVariable || systemVariable?.altVariable || "")
            : (tempInputValues[variableKey] || "");
          
          return (
            <CustomTextInput
              value={inputValue}
              dataTestId={`alt-variable-input-${variableKey}`}
              ariaLabel="System variable alternative field"
              placeholder=""
              setValue={handleSystemAltVariableInputChange(variableKey, systemVariable)}
              disabled={disabled}
            />
          );
        },
      },
      {
        field: "selected",
        headerName: "Selected",
        width: 130,
        flex: 1.3,
        sortable: false,
        headerClassName: 'last-column',
        renderCell: (params) => {
          const variableKey = params.row.variable;
          const isChecked = !!alternativeLabels[variableKey];
          const systemVariable = SystemVariables.find(v => v.key === variableKey);
          
          return (
            <Switch
              type="primary"
              withIcon={true}
              checked={isChecked}
              onChange={(checked) => handleSystemVariableToggle(variableKey, systemVariable, checked)}
              aria-label={t("System variable selection")}
              data-testid={`system-variable-switch-${variableKey}`}
              disabled={disabled}
            />
          );
        },
      },
    ];
    // System variables grid
    const renderSystemContent = () => {
      return (
        <div className="system-content-block">
          <div className="system-content-table">
            <DataGrid
              columns={columns}
              rows={rowVariables || []}
              getRowId={(row) => row.variable}
              disableColumnMenu
              rowHeight={55}
              disableRowSelectionOnClick
              rowCount={rowVariables?.length}
              disableColumnResize
              //hide pagination
              hideFooter
            />
          </div>
        </div>
      );
    };

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

    // Render functions
    const renderRightContainer = () => {
      const filteredVariablePills = Object.values(alternativeLabels).filter(
        ({ key }) => !ignoreKeywords.has(key)
      );
      return (
        <div className="variable-right-content">
          {/* Slideout panel - only shown when showElement is true */}
          {showElement && (
            <div className="slideout-variable-selected show">
              <div className="head">
                <div className="RHS-header">
                  <span className="back-button" onClick={() => setShowElement(false)}>
                    <BackIcon color="#9E9E9E" /> {t("Back")}
                  </span>
                </div>
              </div>

              <div className="scroll-vertical">
                <div className="content">
                  <div className="d-flex flex-column item-container">
                    <span className="label">{t("Type")}</span>
                    <span className="value">{selectedComponent.type}</span>
                  </div>

                  <div className="d-flex flex-column item-container" >
                    <span className="label">{fieldLabel}</span>
                    <span className="value">{selectedComponent.key}</span>
                  </div>
                  <div className="alternative-label-container">
                      <span className="label">
                        {t("Add alternative label")}
                      </span>
                  <CustomTextInput
                    ariaLabel="Add alternative label input"
                    dataTestId="Add-alternative-input"
                    value={selectedComponent.altVariable}
                    setValue={(value) =>
                      setSelectedComponent((prev) => ({
                        ...prev,
                        altVariable: value,
                      }))
                    }
                    disabled={disabled}
                  />
                  </div>
                  <V8CustomButton
                    dataTestId="Add-alternative-btn"
                    ariaLabel="Add alternative label button"
                    label={
                      alternativeLabels[selectedComponent.key]
                        ? t("Update")
                        : t("Add")
                    }
                    onClick={handleAddAlternative}
                    disabled={
                      disabled ||
                      selectedComponent.altVariable ===
                      alternativeLabels[selectedComponent.key]?.altVariable
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pills or empty state - only shown when panel is hidden */}
          {!showElement && (
            <div className="h-100">
            <div className="RHS-header">
            <span className="form-variables-title">Form Variables</span>
            </div>
              {filteredVariablePills.length > 0 ? (
                <div className="pill-container">
                  {filteredVariablePills.map(
                    ({ key, altVariable, labelOfComponent }: any) => (
                      <div
                        key={key}
                        className="variable-card"
                      >
                        {!disabled && <div
                          className="variable-card-close"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedVariable(key);
                          }}
                        >
                          <CloseIcon
                            color="#9E9E9E"
                            dataTestId={`pill-remove-icon-${key}`}
                          />
                        </div>}
                        <div className="d-flex flex-column">
                          <span className="variable-title">
                            {altVariable || labelOfComponent}
                          </span>
                          <span className="variable-subtitle">
                            {key}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="d-flex flex-column h-100 justify-content-center align-items-center">
                  <span className="label">{t("Choose a form field to create a variable")}</span>
                </div>
              )}
            </div>
          )}
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
            <div className="system-variables-container">
              {renderSystemContent()}
            </div>
          }
          {tabKey === "form" &&
            <div className="variable-page-body-form">
              <div className="variable-left-container">
                { renderFormContent()}
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
