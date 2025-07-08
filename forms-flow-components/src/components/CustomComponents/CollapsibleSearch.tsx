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
  const [submissionId, setSubmissionId] = useState("");
  const [submitter, setSubmitter] = useState("");
  const [status, setStatus] = useState("");
  const [selectedItem, setSelectedItem] = useState("All Forms");

  const toggleExpand = () => {
    setExpanded(true);
  };
  const hasAnyInput = !!dropdownSelection || submissionId.trim() !== "" || submitter.trim() !== "" || status.trim() !== "";
  const handleSelection = (label) => setSelectedItem(label);

  const handleCollapse = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up
    setExpanded(false);
  };

  // Derived value for disabling buttons
  const isActionDisabled =
    !dropdownSelection &&
    submissionId.trim() === "" &&
    submitter.trim() === "" &&
    status.trim() === "";

  const DropdownItems = formData.map((form) => ({
    type: "form",
    content: form.formName, // Display name in dropdown
    dataTestId: `dropdown-item-${form.formName.replace(/\s+/g, '-').toLowerCase()}`,
    ariaLabel: `Select form: ${form.formName}`,
    onClick: () => {
      handleSelection(form.formName);
      setDropdownSelection(form.parentFormId); // Store the selected form ID
    },
  }));
console.log("iddd", dropdownSelection);
  return (
    <div
      className={`collapsible-toggle ${expanded ? "expanded" : ""} ${hasAnyInput ? "active-toggle" : ""}`}
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
            <AngleLeftIcon />
          </div>
        ) : (
          <AngleRightIcon />
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
        <div className="panel-content">
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
            </div>
            {dropdownSelection && (
              <div className="panel-width">
                <CustomButton
                  // variant="secondary"
                  secondary
                  size="md"
                  label="Manage fields"
                  icon={<PencilIcon className="" />}
                />
              </div>
            )}
          </div>
          <div className="search-clear">
            <CustomButton
              // variant={"primary"}
              size="md"
              label="Search"
              // disabled={primaryBtnDisable}
              // onClick={primaryBtnAction}
              // dataTestId={primaryBtndataTestid}
              // ariaLabel={primaryBtnariaLabel}
              // buttonLoading={buttonLoading}
              disabled={isActionDisabled}
            />
            <CustomButton
              secondary
              size="md"
              label="Clear"
              // disabled={primaryBtnDisable}
              // onClick={primaryBtnAction}
              // dataTestId={primaryBtndataTestid}
              // ariaLabel={primaryBtnariaLabel}
              // buttonLoading={buttonLoading}
              disabled={isActionDisabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};
