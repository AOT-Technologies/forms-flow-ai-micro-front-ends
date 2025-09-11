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
    const variableDef = taskVariables?.find((variable) => variable.key === name);
    let processedValue = value;

    if (variableDef?.type === "checkbox") {
      const normalized = String(value).trim().toLowerCase();
      if (normalized === "true") processedValue = true;
      else if (normalized === "false") processedValue = false;
    }
    handleSelectChange(name, processedValue);
  };
    return <>
         {taskVariables.map((item) => {
        if (item.isChecked && item.name !== "created" && item.type !== "selectboxes") {
          const uniqueKey = getUniqueFieldKey(item);

          if (item?.key === "assignee") {
            return (
              <InputDropdown
                Options={assigneeOptions}
                dropdownLabel={t(item.label)}
                isAllowInput={false}
                ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
                ariaLabelforInput={t(`input for attribute ${item.label}`)}
                dataTestIdforDropdown={`${uniqueKey}-attribute-dropdown`}
                selectedOption={attributeData[uniqueKey] || ""}
                setNewInput={(selectedOption) =>
                  handleSelectChange(uniqueKey, selectedOption)
                }
                name={uniqueKey}
                id={uniqueKey}
              />
            );
          } else if (item.key === "roles") {
            return (
              <InputDropdown
                Options={candidateOptions}
                dropdownLabel={t(item.label)}
                isAllowInput={false}
                ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
                ariaLabelforInput={t(`input for attribute ${item.label}`)}
                dataTestIdforDropdown={`${uniqueKey}-attribute-dropdown`}
                selectedOption={attributeData[uniqueKey] || ""}
                setNewInput={(selectedOption) =>
                  handleSelectChange(uniqueKey, selectedOption)
                }
                name={uniqueKey}
                id={uniqueKey}
              />
            );
          } else {
            return (
              item.type === "checkbox" ? (
                <InputDropdown
                  Options={[
                    { label: "true", value: true },
                    { label: "false", value: false }
                  ]}
                  dropdownLabel={t(item.label)}
                  isAllowInput={false}
                  ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
                  ariaLabelforInput={t(`input for attribute ${item.label}`)}
                  dataTestIdforDropdown={`${item.key}-attribute-dropdown`}
                  selectedOption={String(attributeData[item.key] ?? "")}
                  setNewInput={(selectedOption) =>
                   { const val = selectedOption === "true" ? true : selectedOption === "false" ? false : selectedOption;
                    handleSelectChange(item.key, val)}
                  }
                  name={item.key}
                  id={item.key}
                />
              ) : (
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
              )
            );
          }
        }
        return null;
      })}
    </>
}
export default ParametersTab;