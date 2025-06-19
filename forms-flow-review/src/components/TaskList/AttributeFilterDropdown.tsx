import { AddIcon, ButtonDropdown, PencilIcon } from "@formsflow/components";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  setAttributeFilterToEdit,
  setSelectedBpmAttributeFilter,
} from "../../actions/taskActions";
import AttributeFilterModal from "../AttributeFilterModal/AttributeFilterModal";
import { fetchServiceTaskList } from "../../api/services/filterServices";
import { cloneDeep } from "lodash";
import { userRoles } from "../../helper/permissions";

const AttributeFilterDropdown = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { createFilters } = userRoles();

  const selectedAttributeFilter = useSelector(
    (state: RootState) => state.task?.selectedAttributeFilter
  );
  const attributeFilterList = useSelector(
    (state: RootState) => state.task.attributeFilterList || []
  );
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const isUnsavedAttributeFilter = useSelector(
    (state: RootState) => state.task.isUnsavedAttributeFilter
  );
  const selectedFilter = useSelector(
    (state: RootState) => state.task.selectedFilter
  );
  const handleToggleAttrFilterModal = () => {
    setShowAttributeFilter((prev) => !prev);
  };

  const handleAttributeFilterModalClose = () => {
    dispatch(setAttributeFilterToEdit(null));
    setShowAttributeFilter(false);
  };

  // fetching task list with current filter with reset page and limit
  const fetchTaskList = (data) => {
    dispatch(
      fetchServiceTaskList(data, null, 1, 15, (error) => {
        if (error) {
          console.error("Error fetching tasks:", error);
          return;
        }
      })
    );
  };

  const changeAttributeFilterSelection = (attributeFilter) => {
    dispatch(setSelectedBpmAttributeFilter(attributeFilter));
    // need to feth task list based on selected attribute filter
    // need to reset all params
    if (!selectedFilter || attributeFilter?.id === selectedAttributeFilter?.id) return; 
 
    //this is current selected filter criteria
    const currentCriteria = cloneDeep(selectedFilter.criteria);
    // we only need process variables from attribute filter data
    const processVariables = attributeFilter?.criteria.processVariables?.filter(
      (item) => item.name !== "formId"
    );
    // we need to patch the current criteria with process variables from attribute filter
   if (processVariables && processVariables.length > 0) {
    currentCriteria.processVariables = currentCriteria.processVariables || [];
    currentCriteria.processVariables.push(...processVariables);
}

    // changing  assignee if assignee changed in attirbuite filter
    currentCriteria.assignee =  attributeFilter?.criteria.assignee;
    const data = { ...selectedFilter, criteria: currentCriteria };
    fetchTaskList(data);
  };

  const handleEditAttrFilter = () => {
    if (!selectedAttributeFilter) return;
    setShowAttributeFilter(true);
    dispatch(setAttributeFilterToEdit(cloneDeep(selectedAttributeFilter)));
  };

  const filterDropdownAttributeItems = () => {
    // Generate items based on the attributeFilterList
    const attributeItems =
      Array.isArray(attributeFilterList) && attributeFilterList.length > 0
        ? attributeFilterList.map((filter) => ({
            className:
              filter?.id === selectedAttributeFilter?.id
                ? "selected-filter-item"
                : "",
            content: `${t(filter.name)}`,
            onClick: () => changeAttributeFilterSelection(filter),
            type: String(filter.id),
            dataTestId: `attr-filter-item-${filter.id}`,
            ariaLabel: t("Select attribute filter {{filterName}}", {
              filterName: t(filter.name),
            }),
          }))
        : [];
  

    const clearAttributeFilter = {
      className:  !selectedAttributeFilter?.id ? "selected-filter-item" : "",   
      content: <>{t("All Fields")}</>,
      onClick: () => changeAttributeFilterSelection(null),
      type: "none",
      dataTestId: "no-attr-filters",
      ariaLabel: t("All Fields"),
    };

    const customAttribute = {
      content: (
        <span>
          <span>
            <AddIcon className="filter-plus-icon" />
          </span>{" "}
          {t("Custom Form Fields")}
        </span>
      ),
      onClick: handleToggleAttrFilterModal,
      type: "custom",
      dataTestId: "attr-filter-item-custom",
      ariaLabel: t("Custom Attribute Filter"),
    };
    const reorderOption = {
      content: (
        <span>
          <span>
            <PencilIcon className="filter-edit-icon" />
          </span>{" "}
          {t("Re-order And Hide Attribute Filters")}
        </span>
      ),
      onClick: () => console.log("Re-order attribute filters clicked"),
      type: "reorder",
      dataTestId: "attr-filter-item-reorder",
      ariaLabel: t("Re-order And Hide Attribute Filters"),
    };
    let options = [];
    if (attributeItems.length) {
      options = [clearAttributeFilter, ...attributeItems];
      //If only createFilters is there then only push custom attribute filter and reorder option
      if (createFilters) {
        options.push(customAttribute, reorderOption);
      }
    } else {
      options = [clearAttributeFilter];
      if (createFilters) {
        options.push(customAttribute);
      }
    }
    return options;
  };

  const title = selectedAttributeFilter
    ? `${
        isUnsavedAttributeFilter
          ? t("Unsaved Filter")
          : t(selectedAttributeFilter.name)
      }`
    : t("All Fields");

  return (
    <>
      <ButtonDropdown
        label={
          <span className="filter-large" title={title}>
            {title}
          </span>
        }
        variant="primary"
        size="md"
        dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
        dropdownItems={filterDropdownAttributeItems()}
        extraActionIcon={<PencilIcon color="white" />}
        extraActionOnClick={!selectedAttributeFilter ? handleToggleAttrFilterModal : handleEditAttrFilter}
        dataTestId="attribute-filter-dropdown"
        ariaLabel={t("Select attribute filter")}
        extraActionAriaLabel={t("Edit attribute filters")}
      />
      <AttributeFilterModal
        show={showAttributeFilter}
        toggleModal={handleToggleAttrFilterModal}
        onClose={handleAttributeFilterModalClose}
      />
    </>
  );
};

export default AttributeFilterDropdown;
