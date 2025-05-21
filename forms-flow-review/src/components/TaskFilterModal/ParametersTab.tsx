import { CloseIcon, InputDropdown, PencilIcon } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { FormSelectionModal } from "../FormSelectionModal";
const ParametersTab = ({
  accessOption,
  changeAcessOption,
  candidateOptions,
  accessValue,
  setAccessValue,
  handleFormSelectionClear,
  selectedForm,
  toggleFormSelectionModal,
  showFormSelectionModal, 
  handleFormSelection,
  forms  
}) => {
  const computedStyle = getComputedStyle(document.documentElement);
  const baseColor = computedStyle.getPropertyValue("--ff-primary");
  const { t } = useTranslation();
  const userList = useSelector(
    (state: any) => state.task.userList
  );
  const userListData = userList.data ?? [];
  const assigneeOptions = userListData.map((user) => ({
    value: user.username,
    label: user.username,
  }));

  const accessOptions = [
    {
      label: t("Specific role"),
      value: "specificRole",
    },
    {
      label: t("Specific assignee"),
      value: "specificAssignee",
    },
  ];

  return <>
    <InputDropdown
      Options={accessOptions}
      dropdownLabel={t("Tasks Accessible To")}
      isAllowInput={false}
      ariaLabelforDropdown={t("dropdown for selecting options")}
      ariaLabelforInput={t("input for typing option")}
      dataTestIdforInput="access-options-input"
      dataTestIdforDropdown="access-options"
      selectedOption={accessOption}
      setNewInput={changeAcessOption}
    />
    {accessOption === "specificRole" ? (
      <div className="d-flex filter-dropdown">
        <div className="L-style"></div>
        <InputDropdown
          key="specificRoleDropdown"
          Options={candidateOptions}
          isAllowInput={false}
          ariaLabelforDropdown={t("specific role dropdown")}
          ariaLabelforInput={t("specific role input")}
          dataTestIdforInput="specific-roles-input"
          dataTestIdforDropdown="specific-roles"
          selectedOption={accessValue}
          setNewInput={setAccessValue}
        />
      </div>
    ) : (
      <div className="d-flex filter-dropdown">
        <div className="L-style"></div>
        <InputDropdown
          key="assigneeDropdown"
          Options={assigneeOptions}
          isAllowInput={false}
          ariaLabelforDropdown={t("assignee dropdown")}
          ariaLabelforInput={t("assignee input")}
          data-testid="assignee-dropdown"
          dataTestIdforInput="assignee-input"
          selectedOption={accessValue}
          setNewInput={setAccessValue}
          name="assigneeOptions"
        />
      </div>
    )}

    <div className="pt-4">
      <label className="mb-2">{t("Form")}</label>
      <div className="form-selection-input d-flex justify-content-end">
        <label className="w-100">{selectedForm.formName}</label>
        {selectedForm.formName && (
          <div className="form-selection-input-container">
            <CloseIcon
              color={baseColor}
              width="15px"
              height="15px"
              className="form-selection-icon"
              data-testid="clear-formId"
              aria-label="clear-formId"
              onClick={handleFormSelectionClear}
            />
          </div>
        )}
        <div className="form-selection-input-container">
          <PencilIcon
            className="form-selection-icon"
            aria-label="open modal"
            data-testid="open-modal"
            onClick={toggleFormSelectionModal}
          />
        </div>
      </div>
      <FormSelectionModal
        forms={forms}
        showModal={showFormSelectionModal}
        onClose={toggleFormSelectionModal}
        onSelectForm={handleFormSelection}
      />
    </div>
  </>;
};


export default ParametersTab;