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

const AttributeFilterDropdown = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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
      currentCriteria.processVariables?.push(...processVariables);    
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
            content: `${t(filter.name)}`,
            onClick: () => changeAttributeFilterSelection(filter),
            type: String(filter.id),
            dataTestId: `attr-filter-item-${filter.id}`,
            ariaLabel: t("Select attribute filter {{filterName}}", {
              filterName: t(filter.name),
            }),
          }))
        : [];
    const noAttributeFilter = {
      content: <em>{t("No attribute filters found")}</em>,
      onClick: () => {},
      type: "none",
      dataTestId: "no-attr-filters",
      ariaLabel: t("No attribute filters available"),
    };

    const clearAttributeFilter = {
      content: <em>{t("All Fields")}</em>,
      onClick: () => changeAttributeFilterSelection(null),
      type: "none",
      dataTestId: "no-attr-filters",
      ariaLabel: t("All Fields"),
    };

    const customAttribute = {
      content: (
        <span>
          <AddIcon />
          {t("Custom Filter")}
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
          <PencilIcon />
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
      options = [
        clearAttributeFilter,
        ...attributeItems,
        customAttribute,
        reorderOption,
      ];
    } else {
      options = [noAttributeFilter, customAttribute];
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
          <span title={title}>
            {title}
          </span>
        }
        variant="primary"
        size="md"
        dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
        dropdownItems={filterDropdownAttributeItems()}
        extraActionIcon={<PencilIcon />}
        extraActionOnClick={handleEditAttrFilter}
        dataTestId="attribute-filter-dropdown"
        ariaLabel={t("Select attribute filter")}
        extraActionAriaLabel={t("Edit attribute filters")}
        className="input-filter"
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
