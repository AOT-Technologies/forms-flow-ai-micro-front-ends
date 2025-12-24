import { Fragment } from "react";
import { SelectDropdown,CustomTextInput } from "@formsflow/components";
import { useTranslation } from "react-i18next";

const ParametersTab = ({taskVariables, attributeData ,handleSelectChange, assigneeOptions, candidateOptions}) => {
    const {t} = useTranslation();
    
  // Create unique identifier for fields with same key but different isFormVariable
  const getUniqueFieldKey = (item) => {
    return item.isFormVariable ? `${item.key}_form` : item.key;
  };

  const handleValueChange = (name, value) => {
    const variableDef = taskVariables?.find((variable) => getUniqueFieldKey(variable) === name);
    let processedValue = value;
    
    // Validate applicationId - must be a valid number
    if (variableDef?.key === "applicationId" && value !== "") {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        // Invalid number, don't update the value
        console.warn(`Invalid applicationId value: ${value}. Expected a number.`);
        return;
      }
      processedValue = String(numValue); // Store as string for consistency
    } else if (variableDef?.type === "checkbox") {
      const normalized = String(value).trim().toLowerCase();
      if (normalized === "true") processedValue = true;
      else if (normalized === "false") processedValue = false;
    }
    handleSelectChange(name, processedValue);
  };

  // Helper function to create FormInput component
  const createFormInput = (item, uniqueKey) => (
    <div className="custom-input-container">
      <label htmlFor={`${uniqueKey}-attribute-input`}>{t(item.label)}</label>
      <CustomTextInput
        value={attributeData[uniqueKey] || ""}
        setValue={(val) => handleValueChange(uniqueKey, val)}
        // placeholder={item.label}
        dataTestId={`${uniqueKey}-attribute-input`}
        ariaLabel={t(item.label)}
      />
    </div>
  );

  // Helper function to create SelectDropdown component
  const createSelectDropdown = (item, uniqueKey, options) => (
    <div className="custom-input-container">
      <label htmlFor={uniqueKey}>{t(item.label)}</label>
      <SelectDropdown
        options={options}
        value={attributeData[uniqueKey] || ""}
        onChange={(val) => handleSelectChange(uniqueKey, val)}
        ariaLabel={t(`Attribute ${item.label} dropdown`)}
        dataTestId={`${uniqueKey}-attribute-dropdown`}
        id={uniqueKey}
        variant="secondary"
      />
    </div>
  );
  // Helper function to create checkbox dropdown
  const createCheckboxDropdown = (item) => {
    const uniqueKey = getUniqueFieldKey(item);
    return (
      <div className="custom-input-container">
        <label htmlFor={uniqueKey}>{t(item.label)}</label>
        <SelectDropdown
          options={[
            { label: "true", value: "true" },
            { label: "false", value: "false" },
          ]}
          value={String(attributeData[uniqueKey] ?? "")}
          onChange={(selected) => {
            let val = selected;
            if (selected === "true") val = true;
            else if (selected === "false") val = false;
            handleSelectChange(uniqueKey, val);
          }}
          ariaLabel={t(`Attribute ${item.label} dropdown`)}
          dataTestId={`${uniqueKey}-attribute-dropdown`}
          id={uniqueKey}
          variant="secondary"
        />
      </div>
    );
  };

  // Helper function to create text/number input
  const createTextNumberInput = (item, uniqueKey) => (
    <div className="custom-input-container">
      <label htmlFor={`${uniqueKey}-attribute-input`}>{t(item.label)}</label>
      <CustomTextInput
        value={attributeData[uniqueKey] || ""}
        setValue={(val) => handleValueChange(uniqueKey, val)}
        placeholder=""
        dataTestId={`${uniqueKey}-attribute-input`}
        ariaLabel={t(item.label)}
      />
    </div>
  );
  // Helper function to render field component based on item type
  const renderFieldComponent = (item) => {
    const uniqueKey = getUniqueFieldKey(item);
    if (item?.key === "assignee") { 
      return item.isFormVariable 
        ? createFormInput(item, uniqueKey)
        : createSelectDropdown(item, uniqueKey, assigneeOptions);
    }
    
    if (item.key === "roles") {
      return item.isFormVariable 
        ? createFormInput(item, uniqueKey)
        : createSelectDropdown(item, uniqueKey, candidateOptions);
    }
    
    return item.type === "checkbox" 
      ? createCheckboxDropdown(item)
      : createTextNumberInput(item, uniqueKey);
  };

  return (
    <div className="parameters-tab-container">
      {taskVariables.map((item) => {
        if (item.isChecked && item.name !== "created" && item.type !== "selectboxes") {
          const uniqueKey = getUniqueFieldKey(item);
          return <Fragment key={uniqueKey}>{renderFieldComponent(item)}</Fragment>;
        }
        return null;
      })}
    </div>
  );
}
export default ParametersTab;