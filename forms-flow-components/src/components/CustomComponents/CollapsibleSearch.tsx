import React, { useEffect, useState } from "react";
import { AngleRightIcon, AngleLeftIcon, PencilIcon } from "../SvgIcons";
import { useTranslation } from "react-i18next";
import { ButtonDropdown, FormInput } from "@formsflow/components";
import { CustomButton } from "./Button";

interface FormItem {
  formId: string;
  formName: string;
  parentFormId: string;
}
interface CollapsibleSearchProps {
  isOpen: boolean;
  hasActiveFilters: boolean;
  inactiveLabel: string;
  activeLabel: string;
  onToggle: () => void;
  dataTestId?: string;
  ariaLabel?: string;
  formData: FormItem[];
}

export const CollapsibleSearch: React.FC<CollapsibleSearchProps> = ({
  isOpen,
  hasActiveFilters,
  inactiveLabel,
  activeLabel,
  onToggle,
  dataTestId = "collapsible-search",
  ariaLabel = "Collapsible sidebar",
  formData,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [dropdownSelection, setDropdownSelection] = useState<string | null>(
    null
  );
  const [selectedItem, setSelectedItem] = useState("All Forms");
  const initialInputFields = [
    {
      id: "submissionId",
      label: "Submission ID",
      type: "text",
      value: "",
    },
    {
      id: "submitter",
      label: "Submitter",
      type: "text",
      value: "",
    },
    {
      id: "status",
      label: "Status",
      type: "text",
      value: "",
    },
  ];

  const [inputFields, setInputFields] = useState(initialInputFields);
  
  const handleFieldChange = (index: number, newValue: string) => {
    setInputFields((prevFields) => {
      const updated = [...prevFields];
      updated[index] = { ...updated[index], value: newValue };
      return updated;
    });
  };

  const toggleExpand = () => {
    setExpanded(true);
  };

  const handleSelection = (label) => setSelectedItem(label);

  const handleCollapse = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setExpanded(false);
  };

  // Derived value for disabling buttons
  const hasAnyInputInFields = inputFields.some((field) => field.value.trim() !== "");
  const isActionDisabled = !(dropdownSelection || hasAnyInputInFields);

  const DropdownItems = formData.map((form) => ({ 
    type: `form-${form.formId}`,
    content: form.formName,
    dataTestId: `dropdown-item-${form.formName.replace(/\s+/g, '-').toLowerCase()}`,
    ariaLabel: `Select form: ${form.formName}`,
    onClick: () => {
      handleSelection(form.formName);
      setDropdownSelection(form.parentFormId); // Store the selected form ID
    },
  }));

    const handleClear = () => {
    // Reset all input field values
    setInputFields((prevFields) =>
      prevFields.map((field) => ({
        ...field,
        value: "",
      }))
    );

    // Reset dropdown selection
    setDropdownSelection(null);
    setSelectedItem("All Forms");
  };
  return (
    <div
      className={`collapsible-toggle ${expanded ? "expanded" : ""} ${!isActionDisabled ? "active-toggle" : ""}`}
      onClick={toggleExpand}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          toggleExpand();
        }
      }}
    >
      <button
        className="chevron-icon"
        onClick={expanded ? handleCollapse : undefined}
        type="button"
        data-testid="collapse-toggle-button"
        aria-label={expanded ? t("Collapse") : undefined}
      >
        {expanded ? (
          <div className="handle-collapse">
            <span className="collapse-text">{t("Collapse")}</span>
            <AngleLeftIcon className="svgIcon-onDark" />
          </div>
        ) : (
          <AngleRightIcon className="svgIcon-onDark" />
        )}
      </button>
      {!expanded ? (
        <div className="collapsible-label">
          {t("No Filters Are Active")}
        </div>
      ) : (
        ""
      )}

      {expanded && (
        <div className="panel-content" data-testid="panel-content">
          <div className="main-content">
            <div className="panel-width">
              <label className="form-label panel-label">{t("Form")}</label>
              <ButtonDropdown
                label={t(selectedItem)}
                dropdownItems={DropdownItems}
                dropdownType="DROPDOWN_ONLY"
                dataTestId="business-filter-dropdown"
                ariaLabel={t("Select business filter")}
                className="button-collapsible input-filter"
              />
            </div>
            {inputFields.map((field, index) => (
              <div className="panel-width" key={field.id}>
                <label className="form-label panel-label">{field.label}</label>
                <FormInput
                  type={field.type}
                  value={field.value}
                  onChange={(e) => handleFieldChange(index, e.target.value)}
                  aria-label={field.label}
                  data-testid={`input-${field.id}`} 
                />
              </div>
            ))}
            {dropdownSelection && (
              <div className="panel-width">
                <CustomButton
                  secondary
                  label="Manage fields"
                  iconWithText
                  icon={<PencilIcon />}
                  dataTestId="manage-fields-button"
                  ariaLabel="Manage fields" 
                />
              </div>
            )}
          </div>
          <div className="search-clear">
            <CustomButton
              label="Search"
              // onClick={primaryBtnAction}
              // buttonLoading={buttonLoading}
              disabled={isActionDisabled}
              dataTestId="search-button"
              ariaLabel="Search filters" 
            />
            <CustomButton
              secondary
              label="Clear"
              onClick={handleClear}
              dataTestId="clear-button"
              ariaLabel="Clear filters" 
              // buttonLoading={buttonLoading}
              disabled={isActionDisabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};
