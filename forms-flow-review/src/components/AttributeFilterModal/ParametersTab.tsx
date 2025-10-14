import { FormInput, InputDropdown } from "@formsflow/components";
import { useTranslation } from "react-i18next";

const ParametersTab = ({taskVariables, attributeData ,handleSelectChange, assigneeOptions, candidateOptions}) => {
    const {t} = useTranslation();
    
  // Create unique identifier for fields with same key but different isFormVariable
  const getUniqueFieldKey = (item) => {
    return item.isFormVariable ? `${item.key}_form` : item.key;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Find variable by unique key (which includes _form suffix for form variables)
    const variableDef = taskVariables?.find((variable) => getUniqueFieldKey(variable) === name);
    let processedValue = value;

    if (variableDef?.type === "checkbox") {
      const normalized = String(value).trim().toLowerCase();
      if (normalized === "true") processedValue = true;
      else if (normalized === "false") processedValue = false;
    }
    handleSelectChange(name, processedValue);
  };

  // Helper function to create FormInput component
  const createFormInput = (item, uniqueKey) => (
    <FormInput
      name={uniqueKey}
      type="text"
      label={t(item.label)}
      ariaLabel={t(item.label)}
      dataTestId={`${uniqueKey}-attribute-input`}
      value={attributeData[uniqueKey] || ""}
      onChange={handleInputChange}
      id={uniqueKey}
    />
  );

  // Helper function to create InputDropdown component
  const createInputDropdown = (item, uniqueKey, options) => (
    <InputDropdown
      Options={options}
      dropdownLabel={t(item.label)}
      isAllowInput={false}
      ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
      ariaLabelforInput={t(`input for attribute ${item.label}`)}
      dataTestIdforDropdown={`${uniqueKey}-attribute-dropdown`}
      selectedOption={attributeData[uniqueKey] || ""}
      setNewInput={(selectedOption) => handleSelectChange(uniqueKey, selectedOption)}
      name={uniqueKey}
      id={uniqueKey}
    />
  );

  // Helper function to create checkbox dropdown
  const createCheckboxDropdown = (item) => {
    const uniqueKey = getUniqueFieldKey(item);
    return (
      <InputDropdown
        Options={[
          { label: "true", value: true },
          { label: "false", value: false }
        ]}
        dropdownLabel={t(item.label)}
        isAllowInput={false}
        ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
        ariaLabelforInput={t(`input for attribute ${item.label}`)}
        dataTestIdforDropdown={`${uniqueKey}-attribute-dropdown`}
        selectedOption={String(attributeData[uniqueKey] ?? "")}
        setNewInput={(selectedOption) => {
          let val = selectedOption;
          if (selectedOption === "true") {
            val = true;
          } else if (selectedOption === "false") {
            val = false;
          }
          handleSelectChange(uniqueKey, val);
        }}
        name={uniqueKey}
        id={uniqueKey}
      />
    );
  };

  // Helper function to create text/number input
  const createTextNumberInput = (item, uniqueKey) => (
    <FormInput
      name={uniqueKey}
      type={item.type === "number" ? "number" : "text"}
      label={t(item.label)}
      ariaLabel={t(item.label)}
      dataTestId={`${uniqueKey}-attribute-input`}
      value={attributeData[uniqueKey] || ""}
      onChange={handleInputChange}
      id={uniqueKey}
    />
  );
  // Helper function to render field component based on item type
  const renderFieldComponent = (item) => {
    const uniqueKey = getUniqueFieldKey(item);

    if (item?.key === "assignee") {
      return item.isFormVariable 
        ? createFormInput(item, uniqueKey)
        : createInputDropdown(item, uniqueKey, assigneeOptions);
    }
    
    if (item.key === "roles") {
      return item.isFormVariable 
        ? createFormInput(item, uniqueKey)
        : createInputDropdown(item, uniqueKey, candidateOptions);
    }
    
    return item.type === "checkbox" 
      ? createCheckboxDropdown(item)
      : createTextNumberInput(item, uniqueKey);
  };

  return (
    <>
      {taskVariables.map((item) => {
        if (item.isChecked && item.name !== "created" && item.type !== "selectboxes") {
          return renderFieldComponent(item);
        }
        return null;
      })}
    </>
  );
}
export default ParametersTab;