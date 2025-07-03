import {
  CustomButton,
  CustomInfo,
  DeleteIcon,
  FormInput,
  InputDropdown,
  SaveIcon,
  UpdateIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import {
  ACCESSIBLE_FOR_ALL_GROUPS,
  PRIVATE_ONLY_YOU,
  SPECIFIC_USER_OR_GROUP,
} from "../../constants";
import { StorageService } from "@formsflow/service";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { UserDetail } from "../../types/taskFilter";
import { userRoles  } from "../../helper/permissions";

const filterNameLength = 50;

const SaveFilterTab = ({
  filterToEdit, 
  handleUpdateFilter,
  handleDeleteFilter,
  handleSaveCurrentFilter,
  createAndUpdateFilterButtonDisabled,
  shareFilter,
  setShareFilter,
  candidateOptions,
  shareFilterForSpecificRole,
  setShareFilterForSpecificRole,
  handleFilterName,
  filterName,
  successState,
  deleteSuccess,
}) => {
  const { t } = useTranslation();
  const computedStyle = getComputedStyle(document.documentElement);
  const baseColor = computedStyle.getPropertyValue("--ff-primary");
  const whiteColor = computedStyle.getPropertyValue("--ff-white");
  const [filterNameError, setFilterNameError] = useState("");
  const getIconColor = (disabled) => (disabled ? whiteColor : baseColor);
  const saveIconColor = getIconColor(
    createAndUpdateFilterButtonDisabled || filterNameError || deleteSuccess?.showSuccess || !shareFilter|| (shareFilter === SPECIFIC_USER_OR_GROUP && !shareFilterForSpecificRole)
  );
  const { createFilters,manageAllFilters } = userRoles();
  const deleteIconColor = getIconColor(successState?.showSuccess);
  const userDetails: UserDetail = useSelector((state:RootState)=> state.task.userDetails);
  const createdByMe = filterToEdit?.createdBy === userDetails?.preferred_username;
  const editRole = manageAllFilters || (createdByMe && createFilters);


  let saveAndUpdateButtonVariant = "secondary"; // Default value
  if (successState.showSuccess) {
    saveAndUpdateButtonVariant = "success";
  }

  let deleteButtonVariant = "secondary"; // Default value
  if (deleteSuccess.showSuccess) {
    deleteButtonVariant = "success";
  }

  const createFilterShareOption = (labelKey, value) => ({
    label: t(labelKey),
    value,
  });

  const filterShareOptions = [
    createFilterShareOption("Nobody(Keep it private)", PRIVATE_ONLY_YOU),
    createFilterShareOption("Everybody", ACCESSIBLE_FOR_ALL_GROUPS),
    createFilterShareOption("Specific role", SPECIFIC_USER_OR_GROUP),
  ];

  const handleNameError = (e) => {
    const value = e.target.value;
    handleFilterName(value);
    setFilterNameError(
      value.length >= filterNameLength
        ? t("Filter name should be less than {{filterNameLength}} characters", {
            filterNameLength: filterNameLength,
          })
        : ""
    );
  };

  const renderOwnershipNote = () => {
    if (!filterToEdit) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t(
            "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
          )}
          dataTestId="task-filter-save-note"
        />
      );
    }

    if (createdByMe && editRole) {
      return (
        <>
            <CustomInfo
              className="note"
              heading="Note"
              content={t("This filter is created and managed by you")}
              dataTestId="task-self-share-note"
            />
          <CustomInfo
            className="note"
            heading="Note"
            content={t(
              "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
            )}
            dataTestId="task-filter-save-note"
          />
        </>
      );
    }

    if (!editRole && filterToEdit.id) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t("This filter is created and managed by {{createdBy}}", {
            createdBy: createdByMe ? "you" : filterToEdit?.createdBy,
          })}
          dataTestId="task-filter-save-note"
        />
      );
    }

    if (manageAllFilters && !createdByMe) {
      return (
        <>
        {filterToEdit.id && (
          <CustomInfo
            className="note"
            heading="Note"
            content={t(
              "This filter is created and managed by {{createdBy}}",
              {
                createdBy: filterToEdit?.createdBy,
              }
            )}
            dataTestId="task-filter-save-note"
          />
        )}
          <CustomInfo
            className="note"
            heading="Note"
            content={t(
              "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
            )}
            dataTestId="task-filter-save-note"
          />
        </>
      );
    }

    return null;
  };

  const renderActionButtons = () => {
    if (filterToEdit && filterToEdit?.id && filterToEdit.name !== "All Tasks") {
      if (editRole) {
        return (
          <div className="buttons-row">
            <CustomButton
              variant={saveAndUpdateButtonVariant}
              onClick={handleUpdateFilter}
              icon={<UpdateIcon />}
              label={t("Update This Filter")}
              successMessage={
                successState?.showSuccess ?  `${t("Updated!")} (${successState.countdown})` : ""
              }
              dataTestId="save-task-filter"
              ariaLabel={t("Update This Filter")}
              disabled={deleteSuccess?.showSuccess || createAndUpdateFilterButtonDisabled || filterNameError ||!shareFilter || (shareFilter === SPECIFIC_USER_OR_GROUP && !shareFilterForSpecificRole)  }
              iconWithText
            />
            <CustomButton
              variant={deleteButtonVariant}
              onClick={handleDeleteFilter}
              icon={<DeleteIcon/>}
              label={t("Delete This Filter")}
              successMessage={
                deleteSuccess?.showSuccess ?  `${t("Deleted!")} (${deleteSuccess.countdown})` : ""
              }
              dataTestId="delete-task-filter"
              ariaLabel={t("Delete This Filter")}
              disabled={successState?.showSuccess}
              iconWithText
            />
          </div>
        );
      }
      return null; 
    }

    if (createFilters) {
      if(filterToEdit?.name !== "All Tasks"){
        return (
          <CustomButton
            variant={saveAndUpdateButtonVariant}
            onClick={handleSaveCurrentFilter}
            icon={
              successState?.showSuccess ? "" : (
                <SaveIcon />
              )
            }

            label={
              successState?.showSuccess
                ? `${t("Saved!")} (${successState.countdown})`
                : t("Save This Filter")
            }

            dataTestId="save-task-filter"
            ariaLabel={t("Save Task Filter")}
            disabled={createAndUpdateFilterButtonDisabled || filterNameError}
            iconWithText
          />
      );
      }
    }
    return null;
  };
  return (
    <>
      <FormInput
        name="filter-name"
        type="text"
        label={t("Filter Name")}
        ariaLabel={t("TaskFilter Name")}
        dataTestId="task-filter-name"
        value={filterName}
        onChange={(e) => handleFilterName(e.target.value)}
        isInvalid={!!filterNameError}
        onBlur={handleNameError}
        feedback={filterNameError}
        disabled={filterToEdit && !editRole}
        id="filter-name"
      />

      <div className="input-combination">
        <InputDropdown
          Options={filterShareOptions}
          dropdownLabel={t("Share This Filter With")}
          isAllowInput={false}
          ariaLabelforDropdown={t("filter sharing dropdown")}
          dataTestIdforInput="share-filter-input"
          dataTestIdforDropdown="share-filter-options"
          selectedOption={shareFilter}
          setNewInput={setShareFilter}
          disabled={filterToEdit && !editRole}
          id="share-this-filter-with"
        />
        {shareFilter === SPECIFIC_USER_OR_GROUP && (
            <InputDropdown
              Options={candidateOptions}
              isAllowInput={false}
              ariaLabelforDropdown={t("candidate dropdown")}
              ariaLabelforInput={t("candidate input")}
              dataTestIdforInput="candidate-options-input"
              dataTestIdforDropdown="candidate-options"
              selectedOption={shareFilterForSpecificRole}
              setNewInput={setShareFilterForSpecificRole}
              disabled={ filterToEdit &&!editRole}
            />
        )}
      </div>

      {renderOwnershipNote()}
      {renderActionButtons()}
    </>
  );
};

export default SaveFilterTab;
