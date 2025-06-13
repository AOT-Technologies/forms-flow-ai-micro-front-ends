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
    createAndUpdateFilterButtonDisabled || filterNameError || deleteSuccess?.showSuccess
  );
  const deleteIconColor = getIconColor(successState?.showSuccess);
  const userRoles = StorageService.getParsedData(StorageService.User.USER_ROLE);
  const userDetails: UserDetail = useSelector((state:RootState)=> state.task.userDetails);
  const isCreateFilters = userRoles?.includes("create_filters");
  const isFilterAdmin = userRoles?.includes("manage_all_filters");
  const createdByMe = filterToEdit?.createdBy === userDetails?.preferred_username;
  const publicAccess = filterToEdit?.roles.length === 0 && filterToEdit?.users.length === 0;
  const roleAccess = filterToEdit?.roles.some((role) =>
    userDetails?.groups.includes(role)
  );
  const canAccess = roleAccess || publicAccess || createdByMe;
  const viewOnly = !isFilterAdmin && canAccess;
  const editRole = isFilterAdmin && canAccess;
  const isCreator = filterToEdit?.createdBy === userDetails?.preferred_username;
  const selectedFilter = useSelector((state: any) => state.task.selectedFilter);


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

    if (isCreator) {
      return (
        <>
          <div className="pb-4">
            <CustomInfo
              className="note"
              heading="Note"
              content={t("This filter is created and managed by you")}
              dataTestId="task-self-share-note"
            />
          </div>
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

    if (viewOnly) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t("This filter is created and managed by {{createdBy}}", {
            createdBy: filterToEdit?.createdBy,
          })}
          dataTestId="task-filter-save-note"
        />
      );
    }

    if (editRole) {
      return (
        <>
          <div className="pb-4">
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
          </div>
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
      if (canAccess && isFilterAdmin) {
        return (
          <div className="pt-4 d-flex">
            <CustomButton
              className="me-3"
              variant={saveAndUpdateButtonVariant}
              size="md"
              onClick={handleUpdateFilter}
              icon={
                successState?.showSuccess
                  ? null
                  : <UpdateIcon color={saveIconColor} />
              }

              label={
              successState?.showSuccess ?  `${t("Updated!")} (${successState.countdown})` : t("Update This Filter")
            }
              dataTestId="save-task-filter"
              ariaLabel={t("Update This Filter")}
              disabled={deleteSuccess?.showSuccess || createAndUpdateFilterButtonDisabled || filterNameError}
            />
            <CustomButton
              variant={deleteButtonVariant}
              size="md"
              onClick={handleDeleteFilter}
              icon={deleteSuccess?.showSuccess ? "" : <DeleteIcon color={deleteIconColor}/>}
             
              label={
              deleteSuccess?.showSuccess ?  `${t("Deleted!")} (${deleteSuccess.countdown})` : t("Delete This Filter")
            }
             
              dataTestId="delete-task-filter"
              ariaLabel={t("Delete This Filter")}
              disabled={successState?.showSuccess}
            />
          </div>
        );
      }
      return null; 
    }

    if (isCreateFilters && filterName !== "All Tasks") {
      return (
        <div className="pt-4">
          <CustomButton
            size="md"
            variant={saveAndUpdateButtonVariant}
            onClick={handleSaveCurrentFilter}
            icon={
              successState?.showSuccess ? "" : (
                <SaveIcon color={saveIconColor} />
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
          />
        </div>
      );
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
        disabled={viewOnly}
      />

      <div className="pt-4 pb-4">
        <InputDropdown
          Options={filterShareOptions}
          dropdownLabel={t("Share This Filter With")}
          isAllowInput={false}
          ariaLabelforDropdown={t("filter sharing dropdown")}
          dataTestIdforInput="share-filter-input"
          dataTestIdforDropdown="share-filter-options"
          selectedOption={shareFilter}
          setNewInput={setShareFilter}
          disabled={viewOnly}
        />
        {shareFilter === SPECIFIC_USER_OR_GROUP && (
          <div className="d-flex filter-dropdown">
            <div className="L-style"></div>
            <InputDropdown
              Options={candidateOptions}
              isAllowInput={false}
              ariaLabelforDropdown={t("candidate dropdown")}
              ariaLabelforInput={t("candidate input")}
              dataTestIdforInput="candidate-options-input"
              dataTestIdforDropdown="candidate-options"
              selectedOption={shareFilterForSpecificRole}
              setNewInput={setShareFilterForSpecificRole}
              disabled={viewOnly}
            />
          </div>
        )}
      </div>

      {renderOwnershipNote()}
      {renderActionButtons()}
    </>
  );
};

export default SaveFilterTab;
