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

    <div className={`search-collapsible ${expanded ? "expanded" : ""} ${!isActionDisabled ? "active-toggle" : ""}`}>
      <div
        className={`toggle`}
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
          <AngleRightIcon />
          <span>{t("Collapse")}</span>
        </button>

        {!expanded ? (
          <div className="collapsed-label">
            {t("No Filters Are Active")}
          </div>
        ) : (
          ""
        )}

      </div>

      {expanded && (
        <div className="content">
        <div className="fields">
        <label className="form-label panel-label">{t("Form")}</label>
          <ButtonDropdown
            label={selectedItem}
            dropdownItems={DropdownItems}
            dropdownType="DROPDOWN_ONLY"
            dataTestId="business-filter-dropdown"
            ariaLabel={t("Select business filter")}
            className="input-filter" />

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

          {/* <div className="panel-width">
    <label className="form-label panel-label">{t("Form")}</label>
    <ButtonDropdown
      label="test"
      variant="primary"
      size="md"
      dataTestId="business-filter-dropdown"
      ariaLabel={t("Select business filter")}
      className="w-100"
      dropdownItems={DropdownItems}
    />
  </div>
  <div className="panel-width">
    <label className="form-label panel-label">
      {t("Submission ID")}
    </label>
    <FormInput
      name="title"
      type="text"
      // placeholder={t(placeholderForForm)}
      // label={nameLabel}
      aria-label={t("Name of the form")}
      // dataTestId={nameInputDataTestid}
      // onBlur={handleOnBlur}
      // onChange={(event) => {
      //   handleInputValueChange(event);
      //   setNameError("");
      //   handleChange("title", event);
      // }}
      required
      // value={values.title}
      // isInvalid={!!nameError}
      // feedback={nameError}
      // turnOnLoader={isFormNameValidating}
      maxLength={200}
      value={submissionId}
      onChange={(e) => setSubmissionId(e.target.value)}
    />
  </div>
  <div className="panel-width">
    <label className="form-label panel-label">{t("Submitter")}</label>
    <FormInput
      name="title"
      type="text"
      aria-label={t("Name of the form")}
      required
      value={submitter}
      onChange={(e) => setSubmitter(e.target.value)}
    />
  </div>
  <div className="panel-width">
    <label className="form-label panel-label">{t("Status")}</label>
    <FormInput
      name="title"
      type="text"
      aria-label={t("Name of the form")}
      required
      value={status}
      onChange={(e) => setStatus(e.target.value)}
    />
  </div> */}


          {dropdownSelection && (
            // <div className="panel-width">
            <CustomButton
              label="Manage Fields"
              icon={<PencilIcon />}
              iconWithText 
              dataTestId="manage-fields-button"
              ariaLabel="Manage fields" 
              />
            // </div>
          )}
        </div>
        <div className="actions">
            <div className="buttons-row">
              <CustomButton
                label="Search"
                // onClick={primaryBtnAction}
                dataTestId="search-button"
                ariaLabel="Search filters" 
                // buttonLoading={buttonLoading}
                disabled={isActionDisabled} />
              <CustomButton
                label="Clear"
                onClick={handleClear}
                dataTestId="clear-button"
                ariaLabel="Clear filters" 
                // buttonLoading={buttonLoading}
                disabled={isActionDisabled}
                secondary />
            </div>
        </div>
        </div>
      )}
    </div>
)};
