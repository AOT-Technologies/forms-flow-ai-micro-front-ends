import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FormComponent,
} from "../../formsflow-components";
import type { FormVariable, SystemVariable } from "./VariableSelection";
interface AutoVariableSelectionProps {
  form: any;
  selectedVariable?: FormVariable | null;
  isLoading?: boolean;
  SystemVariables: SystemVariable[];
  onChange?: (selectedVariable: FormVariable | null) => void;
}

export const AutoVariableSelection: React.FC<AutoVariableSelectionProps> = React.memo(
  ({
    form,
    selectedVariable: propSelectedVariable,
    isLoading = false,
    SystemVariables,
    onChange,
  }) => {
    // Store all available form variables for display
    const [availableFormVariables, setAvailableFormVariables] = useState<Record<string, FormVariable>>({});
    // Store the currently selected variable (only one can be selected)
    const [selectedVariable, setSelectedVariable] = useState<FormVariable | null>(null);
    const detailsRef = useRef(null);
    const isInternalUpdateRef = useRef(false);
    const prevPropSelectedVariableRef = useRef<FormVariable | null | undefined>(propSelectedVariable);
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

    // Layout types: recurse into these but do not add as variables
    const isLayoutComponent = useCallback((component: any, parentType?: string): boolean => {
      const layoutTypes = [
        "panel",
        "columns",
        "fieldset",
        "tabs",
        "well",
        "container",
        "button",
        "htmlelement",
        "survey",
        "table",
        "signature",
        "password",
        "file",
        "address",
      ];
      return (
        (component?.type && layoutTypes.includes(component.type)) || parentType === "tabs"
      );
    }, []); 
    // Returns all nested component arrays and the path to use for their children (Form.io columns/table use different shapes)
    const getNestedComponentArrays = useCallback(
      (component: any, parentPath: string[]): { components: any[]; path: string[] }[] => {
        const key = component?.key ? String(component.key) : "";
        const pathBuildingTypes = ["container", "survey", "columns", "table"];
        const path =
          key && component?.type && pathBuildingTypes.includes(component.type)
            ? [...parentPath, key]
            : parentPath;
        const out: { components: any[]; path: string[] }[] = [];

        if (component?.components && Array.isArray(component.components)) {
          out.push({ components: component.components, path });
        }
        if (component?.type === "columns" && component.columns && Array.isArray(component.columns)) {
          component.columns.forEach((col: any) => {
            if (col?.components && Array.isArray(col.components)) {
              out.push({ components: col.components, path });
            }
          });
        }
        if (component?.type === "table" && component.rows && Array.isArray(component.rows)) {
          component.rows.forEach((row: any[]) => {
            if (Array.isArray(row)) {
              row.forEach((cell: any) => {
                if (cell?.components && Array.isArray(cell.components)) {
                  out.push({ components: cell.components, path });
                }
              });
            }
          });
        }
        return out;
      },
      []
    );

    // Extract all form components automatically
    const extractFormVariables = useCallback(
      (formData: any): FormVariable[] => {
        if (!formData?.components) return [];

        const variables: FormVariable[] = [];

        const extractInputComponents = (
          components: any[],
          parentPath: string[] = [],
          parentType?: string
        ) => {
          components.forEach((component: any) => {
            if (!component) return;
            if (component.key && ignoreKeywords.has(component.key)) return;

            const isLayout = isLayoutComponent(component, parentType);

            if (component.key && !isLayout) {
              const componentKey =
                typeof component.key === "string" ? component.key : String(component.key);
              variables.push({
                key: componentKey,
                altVariable: component.label || componentKey,
                labelOfComponent: component.label || componentKey,
                type: component.type || "textfield",
                isFormVariable: true,
              });
            }

            const nested = getNestedComponentArrays(component, parentPath);
            nested.forEach(({ components: childList, path }) => {
              extractInputComponents(childList, path, component.type);
            });
          });
        };

        if (Array.isArray(formData.components)) {
          extractInputComponents(formData.components, []);
        }
        return variables;
      },
      [ignoreKeywords, isLayoutComponent, getNestedComponentArrays]
    );

    // Auto-extract and store all form variables for display
    useEffect(() => {
      if (form?.components) {
        const extractedVars = extractFormVariables(form);
        const varsByKey: Record<string, FormVariable> = {};
        extractedVars.forEach((varItem) => {
          varsByKey[varItem.key] = varItem;
        });
        setAvailableFormVariables(varsByKey);
      }
    }, [form]);

    // Sync selectedVariable to parent when it changes internally
    useEffect(() => {
      if (isInternalUpdateRef.current && onChange) {
        isInternalUpdateRef.current = false;
        onChange(selectedVariable);
      }
    }, [selectedVariable, onChange]);

    // Sync from propSelectedVariable when it changes externally
    useEffect(() => {
      // Only update if the prop actually changed AND we're not in the middle of an internal update
      // Don't reset selectedVariable if user just selected something internally
      if (isInternalUpdateRef.current) {
        return; // Skip if this is an internal update
      }
      
      const prevProp = prevPropSelectedVariableRef.current;
      const prevKey = prevProp?.key;
      const currentPropKey = propSelectedVariable?.key;
      
      // Only sync from prop if the prop key actually changed
      if (currentPropKey !== prevKey) {
        setSelectedVariable(propSelectedVariable || null);
        prevPropSelectedVariableRef.current = propSelectedVariable;
      }
    }, [propSelectedVariable]); // Only depend on prop, not selectedVariable to avoid resetting after user selection


    // Handle variable selection from RHS list (radio button click)
    const handleVariableSelect = useCallback((variable: FormVariable) => {
      // Set only one selected variable
      isInternalUpdateRef.current = true;
      setSelectedVariable(variable);
      
      // Immediately call onChange to return the selected variable
      if (onChange) {
        onChange(variable);
      }

      setSelectedComponent({
        key: variable.key,
        type: variable.type,
        label: variable.labelOfComponent,
        altVariable: variable.altVariable,
        isFormVariable: variable.isFormVariable ?? true,
      });

      // System variables: remove any existing highlights (not in the form)
      if (variable.isFormVariable === false) {
        const existing = document.querySelector(".formio-hilighted");
        if (existing) {
          existing.classList.remove("formio-hilighted");
        }
      } else {
        // Form variable: highlight the corresponding form component
        const existing = document.querySelector(".formio-hilighted");
        if (existing) {
          existing.classList.remove("formio-hilighted");
        }

        // Find the component by searching through all formio components
        // FormIO uses only the last part of the key in class names (not the full dotted path)
        const keyParts = variable.key.split(".");
        const lastKeyPart = keyParts[keyParts.length - 1];

        let component = null;

        // First, try to find by the last part of the key (most common case)
        try {
          component = document.querySelector(`.formio-component-${lastKeyPart}`);
        } catch {
          component = null; // Invalid selector (e.g. special chars in key); fall back to manual search
        }

        // If not found, search through all components manually
        if (!component) {
          const allComponents = document.querySelectorAll('.formio-component');
          for (let i = 0; i < allComponents.length; i++) {
            const comp = allComponents[i];
            const classes = Array.from(comp.classList);
            const keyClass = classes.find(cls => cls.startsWith('formio-component-'));
            if (keyClass) {
              // Extract the key from the class name
              const compKey = keyClass.replace('formio-component-', '');
              // Match by last part of key or full key
              if (compKey === lastKeyPart || compKey === variable.key) {
                component = comp;
                break;
              }
            }
          }
        }

        if (component) {
          component.classList.add("formio-hilighted");
          component.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, []);


    // Handle form component click - select corresponding variable in RHS
    // This is a wrapper that matches FormComponent's setSelectedComponent signature
    // FormComponent will call setShowElement(true), but we'll close it immediately for selection-only mode
    const handleFormComponentClick = useCallback((selected: {
      key: string | null;
      type: string;
      label: string;
      altVariable: string;
      isFormVariable: boolean;
    }): void => {
      if (!selected.key) return;

      // Find the variable from available form variables
      const variable = availableFormVariables[selected.key];
      if (variable) {
        // Set only one selected variable
        isInternalUpdateRef.current = true;
        const updatedVariable: FormVariable = {
          ...variable,
          altVariable: selected.altVariable || variable.altVariable,
        };
        setSelectedVariable(updatedVariable);
        
        // Immediately call onChange to return the selected variable
        if (onChange) {
          onChange(updatedVariable);
        }
      }

      // Update selectedComponent state which will trigger radio button selection
      setSelectedComponent(selected);
    }, [setSelectedComponent, availableFormVariables, onChange]);

    // Form variables custom form
    const renderFormContent = () => (
      <div className="form-content-block custom-scroll">
        {
          isLoading
            ? <div className="form-spinner"></div>
            : <FormComponent
              form={form}
              setShowElement={setShowElement}
              detailsRef={detailsRef}
              alternativeLabels={availableFormVariables}
              setSelectedComponent={handleFormComponentClick}
              ignoreKeywords={ignoreKeywords}
            />
        }
      </div>
    );

    // Render functions
    const renderRightContainer = () => {
      // Get all available form variables (for display)
      const formVariables = Object.values(availableFormVariables).filter(
        (variable) => !ignoreKeywords.has(variable.key)
      );

      // Get system variables that are available
      const systemVariables = SystemVariables;

      return (

        <div className="variable-box-container-wrapper">
          {/* Form specific variables box */}
          <div className="variable-box-container" >
            <div className="variable-box" >
              <div className="variable-box-header">
                <div className="variable-box-title" >
                  {t("Form specific variables")}
                </div>
                <div className="variable-box-description">
                  {t("These variables are visible in the form")}
                </div>
              </div>
              <hr />
              <div className="variable-box-content custom-scroll">
                {formVariables.length > 0 && (
                  <div className="variable-list">
                    {formVariables.map((variable) => (
                      <div
                        key={variable.key}
                        className="variable-list-item"
                        onClick={() => handleVariableSelect(variable)}
                        data-testid={`variable-selection-form-variable-item-${variable.key}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleVariableSelect(variable);
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="form-variables"
                          checked={selectedVariable?.key === variable.key}
                          onChange={() => handleVariableSelect(variable)}
                          data-testid={`variable-selection-form-variable-radio-${variable.key}`}
                        />
                        <span className="variable-list-item-text">
                          {variable.altVariable || variable.labelOfComponent || variable.key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System variables box */}
          <div className="variable-box-container" >
            <div className="variable-box" >
              <div className="variable-box-header">
                <div className="variable-box-title" >
                  {t("System variables")}
                </div>
                <div className="variable-box-description">
                  {t("These variables are not visible in the form")}
                </div>
              </div>
              <hr />
              <div className="variable-box-content custom-scroll">
                {systemVariables.length > 0 && (
                  <div className="variable-list">
                    {systemVariables.map((sysVar) => {
                      const variable: FormVariable = {
                        key: sysVar.key,
                        altVariable: sysVar.altVariable || sysVar.labelOfComponent,
                        labelOfComponent: sysVar.labelOfComponent,
                        type: sysVar.type,
                        isFormVariable: false,
                      };
                      return (
                        <div
                          key={sysVar.key}
                          className="variable-list-item"
                          onClick={() => handleVariableSelect(variable)}
                          data-testid={`variable-selection-system-variable-item-${sysVar.key}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleVariableSelect(variable);
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name="system-variables"
                            checked={selectedVariable?.key === sysVar.key}
                            onChange={() => handleVariableSelect(variable)}
                            data-testid={`variable-selection-system-variable-radio-${sysVar.key}`}
                          />
                          <span className="variable-list-item-text">
                            {variable?.altVariable || sysVar.labelOfComponent}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) }
              </div>
            </div>
          </div>
        </div>
      );
    };


    return (
      <div className="variable-page-container">
        <div className="variable-page-body d-flex">
          <div className="variable-page-body-form">
            <div className="variable-left-container custom-scroll">
              {renderFormContent()}
            </div>
            <div
              className="variable-right-container"
              ref={detailsRef}
            >
              {renderRightContainer()}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
