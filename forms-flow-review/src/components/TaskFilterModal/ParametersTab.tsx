import { InputDropdown, PencilIcon, FormInput } from "@formsflow/components";
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
  forms,
}) => {
  const computedStyle = getComputedStyle(document.documentElement);
  const baseColor = computedStyle.getPropertyValue("--ff-primary");
  const { t } = useTranslation();
  const userList = useSelector((state: any) => state.task.userList);
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

  return (
    <>
    <div className="input-combination">
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
        id="tasks-accessible-to"
      />
      {accessOption === "specificRole" ? (
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
            required={true}
            id="specific-role"
          />
      ) : (
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
            required={true}
            id="assignee"
          />
      )}
      </div>

      <FormInput
        name="form"
        type="text"
        label={t("Form")}
        ariaLabel={t("Form")}
        dataTestId="selected-form"
        value={selectedForm.formName}
        // onChange={(e) => handleFilterName(e.target.value)}
        // isInvalid={!!filterNameError}
        // onBlur={handleNameError}
        // feedback={filterNameError}
        id="selected-form"
        onIconClick={toggleFormSelectionModal}
        icon={<PencilIcon/>}
        className="click-to-edit"
        clear={selectedForm.formName}
        onClearClick={handleFormSelectionClear}
      />

      <FormSelectionModal
        forms={forms}
        showModal={showFormSelectionModal}
        onClose={toggleFormSelectionModal}
        onSelectForm={handleFormSelection}
      />
    </>
  );
};

export default ParametersTab;
