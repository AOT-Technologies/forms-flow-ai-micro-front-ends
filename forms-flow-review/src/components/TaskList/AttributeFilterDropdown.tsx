import { AddIcon, ButtonDropdown, PencilIcon } from "@formsflow/components";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { useTranslation } from "react-i18next";
import {
  createFilterPermission,
  isFilterAdmin,
} from "../../helper/permissions";
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
  const selectedFilter = useSelector(
    (state: RootState) => state.task.selectedFilter
  );
  const handleToggleAttrFilterModal = () => {
    setShowAttributeFilter((prev) => !prev);
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
    if (!selectedFilter || !attributeFilter) return;
    //this is current selected filter criteria
    const currentCriteria = cloneDeep(selectedFilter.criteria);
    // we only need process variables from attribute filter data
    const processVariables = attributeFilter?.criteria.processVariables?.filter(
      (item) => item.name !== "formId"
    );
    // we need to patch the current criteria with process variables from attribute filter
    if (processVariables && processVariables.length > 0) {
      currentCriteria.processVariables.push(...processVariables);
    }
    const data = { ...selectedFilter, criteria: currentCriteria };
    fetchTaskList(data);
  };

  const handleEditAttrFilter = () => {
    if (!selectedAttributeFilter) return;
    const matchingFilter = attributeFilterList.find(
      (f) => f.id === selectedAttributeFilter.id
    );
    if (!matchingFilter) return;

    const editPermission = matchingFilter?.editPermission;
    const isEditable =
      (createFilterPermission || isFilterAdmin) && editPermission;
    setShowAttributeFilter(true);
    dispatch(setAttributeFilterToEdit(matchingFilter));
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
        : [
            {
              content: <em>{t("No attribute filters found")}</em>,
              onClick: () => {},
              type: "none",
              dataTestId: "no-attr-filters",
              ariaLabel: t("No attribute filters available"),
            },
          ];

    const extraItems = createFilterPermission
      ? [
          {
            content: (
              <span>
                <span>
                  <AddIcon className="filter-plus-icon" />
                </span>{" "}
                {t("Custom Attribute Filter")}
              </span>
            ),
            onClick: handleToggleAttrFilterModal,
            type: "custom",
            dataTestId: "attr-filter-item-custom",
            ariaLabel: t("Custom Attribute Filter"),
          },
          {
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
          },
        ]
      : [];

    return [...attributeItems, ...extraItems];
  };

  return (
    <>
      <ButtonDropdown
        label={
          <span
            className="filter-large"
            title={
              selectedAttributeFilter?.name
                ? `${t(selectedAttributeFilter.name)}`
                : t("Select  Attribute Filter")
            }
          >
            {selectedAttributeFilter?.name
              ? `${t(selectedAttributeFilter.name)}`
              : t("Select Attribute Filter")}
          </span>
        }
        variant="primary"
        size="md"
        dropdownType="DROPDOWN_WITH_EXTRA_ACTION"
        dropdownItems={filterDropdownAttributeItems()}
        extraActionIcon={<PencilIcon color="white" />}
        extraActionOnClick={handleEditAttrFilter}
        dataTestId="attribute-filter-dropdown"
        ariaLabel={t("Select attribute filter")}
        extraActionAriaLabel={t("Edit attribute filters")}
      />
      <AttributeFilterModal
        show={showAttributeFilter}
        onClose={handleToggleAttrFilterModal}
      />
    </>
  );
};

export default AttributeFilterDropdown;
