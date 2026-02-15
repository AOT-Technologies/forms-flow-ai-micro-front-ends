import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FormComponent,
} from "../../formsflow-components";
import { StyleServices } from "@formsflow/service";
import { Utils } from "@aot-technologies/formio-react";
import _ from "lodash";
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

    // Extract all form components automatically
    const extractFormVariables = useCallback((formData: any): FormVariable[] => {
      console.log('formData', formData);
      if (!formData || !formData.components) return [];

      // Layout/wrapper types: recurse into children but do not add as variables
      const layoutOnlyTypes = new Set([
        "button",
        "columns",
        "panel",
        "well",
        "container",
        "htmlelement",
        "tabs",
        "survey",
        "signature",
        "password",
        "file",
        "address"
      ]);

      const variables: FormVariable[] = [];

      // Process components manually to have full control over key construction
      const processComponent = (component: any, parentPath: string[] = []) => {
        if (!component) return;

        // Skip components that are in the ignore list (e.g. applicationId, applicationStatus)
        if (component.key && ignoreKeywords.has(component.key)) {
          return;
        }

        const isLayoutOnly = layoutOnlyTypes.has(component.type);

        // Add variable only for input components (not layout-only wrappers)
        if (component.key && !isLayoutOnly) {
          const componentKey = typeof component.key === 'string' ? component.key : String(component.key);
          const fullKey = parentPath.length > 0
            ? [...parentPath, componentKey].join(".")
            : componentKey;

          variables.push({
            key: fullKey,
            altVariable: component.label || componentKey,
            labelOfComponent: component.label || componentKey,
            type: component.type || "textfield",
            isFormVariable: true,
          });
        }

        // Always recurse into nested components (panel, container, columns, etc.)
        if (component.components && Array.isArray(component.components)) {
          const componentKey = component.key && (typeof component.key === 'string' ? component.key : String(component.key));
          const newParentPath = (component.type === "container" || component.type === "survey") && componentKey
            ? [...parentPath, componentKey]
            : parentPath;

          component.components.forEach((child: any) => {
            processComponent(child, newParentPath);
          });
        }
      };

      // Process components manually instead of using Utils.eachComponent to avoid path issues
      if (formData.components && Array.isArray(formData.components)) {
        formData.components.forEach((component: any) => {
          processComponent(component, []);
        });
      }

      return variables;
    }, [ignoreKeywords]);

    // Auto-extract and store all form variables for display
    useEffect(() => {
      if (form && form.components) {
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
        console.log('Returned selected variable (from useEffect):', selectedVariable);
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
        console.log('Returned selected variable (from handleVariableSelect):', variable);
        onChange(variable);
      }

      setSelectedComponent({
        key: variable.key,
        type: variable.type,
        label: variable.labelOfComponent,
        altVariable: variable.altVariable,
        isFormVariable: variable.isFormVariable ?? true,
      });

      // Only highlight form components if this is a form variable (not a system variable)
      if (variable.isFormVariable !== false) {
        // Highlight the corresponding form component
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
        // Use querySelector with escaped selector for safety
        try {
          // Escape any special characters in the key part
          const escapedKey = lastKeyPart.replace(/([\.#\[\]\(\)\{\}:;,>+~|^$*?!])/g, '\\$1');
          component = document.querySelector(`.formio-component-${escapedKey}`);
        } catch (e) {
          // If selector fails, fall back to manual search
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
      } else {
        // For system variables, remove any existing highlights since they're not in the form
        const existing = document.querySelector(".formio-hilighted");
        if (existing) {
          existing.classList.remove("formio-hilighted");
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
          console.log('Returned selected variable (from handleFormComponentClick):', updatedVariable);
          onChange(updatedVariable);
        }
      }

      // Update selectedComponent state which will trigger radio button selection
      setSelectedComponent(selected);
    }, [setSelectedComponent, availableFormVariables, onChange]);

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
              <div className="variable-box-content">
                {formVariables.length > 0 && (
                  <div className="variable-list">
                    {formVariables.map((variable) => (
                      <div
                        key={variable.key}
                        className="variable-list-item"
                        onClick={() => handleVariableSelect(variable)}
                      >
                        <input
                          type="radio"
                          name="form-variables"
                          checked={selectedVariable?.key === variable.key}
                          onChange={() => handleVariableSelect(variable)}
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
              <div className="variable-box-content">
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
                        >
                          <input
                            type="radio"
                            name="system-variables"
                            checked={selectedVariable?.key === sysVar.key}
                            onChange={() => handleVariableSelect(variable)}
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
            <div className="variable-left-container">
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
