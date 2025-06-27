import {
  AddIcon,
  ButtonDropdown,
  PencilIcon,
  SharedWithMeIcon,
  SharedWithOthersIcon,
} from "@formsflow/components";
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
import { ReorderAttributeFilterModal } from "../ReorderAttributeFilterModal";
import { userRoles } from "../../helper/permissions";
import { UserDetail } from "../../types/taskFilter";

const AttributeFilterDropdown = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { createFilters } = userRoles();
  const userDetails: UserDetail = useSelector(
    (state: RootState) => state.task.userDetails
  );
  const selectedAttributeFilter = useSelector(
    (state: RootState) => state.task?.selectedAttributeFilter
  );
  const attributeFilterList = useSelector(
    (state: RootState) => state.task.attributeFilterList || []
  );
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showReorderAttributeFilterModal, setShowReorderAttributeFilterModal] =
    useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
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
    if (!selectedFilter || ( !isUnsavedAttributeFilter && attributeFilter?.id === selectedAttributeFilter?.id))
      return;

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
    currentCriteria.assignee = attributeFilter?.criteria.assignee;
    const data = { ...selectedFilter, criteria: currentCriteria };
    fetchTaskList(data);
  };
  const onSearch = (searchTerm: string) => {
    setFilterSearchTerm(searchTerm);
  };
  const handleEditAttrFilter = () => {
    if (!selectedAttributeFilter) return;
    setShowAttributeFilter(true);
    dispatch(setAttributeFilterToEdit(cloneDeep(selectedAttributeFilter)));
  };

  const filterDropdownAttributeItems = () => {
    const attributeDropdownItemsArray = [];

    const createCustomField = {
      content: (
        <span>
          <AddIcon className="filter-plus-icon" /> {t("Custom Form Fields")}
        </span>
      ),
      onClick: handleToggleAttrFilterModal,
      type: "custom",
      dataTestId: "attr-filter-item-custom",
      ariaLabel: t("Custom Attribute Filter"),
    };

    const reOrderAttribute = {
      content: (
        <span>
          <PencilIcon className="filter-edit-icon" />{" "}
          {t("Re-order And Hide Attribute Filters")}
        </span>
      ),
      onClick: () => setShowReorderAttributeFilterModal(true),
      type: "reorder",
      dataTestId: "attr-filter-item-reorder",
      ariaLabel: t("Re-order And Hide Attribute Filters"),
    };

    const clearAttributeFilter = {
      className: !selectedAttributeFilter?.id ? "selected-filter-item" : "",
      content: <>{t("All Fields")}</>,
      onClick: () => changeAttributeFilterSelection(null),
      type: "none",
      dataTestId: "attr-filter-item-none",
      ariaLabel: t("All Fields"),
    };

    const filteredItems = Array.isArray(attributeFilterList)
      ? attributeFilterList
          .filter((filter) => {
            const nameMatch = filter.name
              .toLowerCase()
              .includes(filterSearchTerm?.toLowerCase() || "");
            const notHidden = !filter?.hide;
            return nameMatch && notHidden;
          })
          .map((filter) => {
            const createdByMe =
              userDetails?.preferred_username === filter?.createdBy;
            const isSharedToPublic =
              !filter?.roles?.length && !filter?.users?.length;
            const isSharedToRoles = filter?.roles?.length > 0;
            const isSharedToMe = filter?.roles?.some((role) =>
              userDetails?.groups?.includes(role)
            );

            let icon = null;
            if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
              icon = <SharedWithOthersIcon className="shared-icon" />;
            } else if (isSharedToPublic || isSharedToMe) {
              icon = <SharedWithMeIcon className="shared-icon" />;
            }

            return {
              className:
                filter?.id === selectedAttributeFilter?.id
                  ? "selected-filter-item"
                  : "",
              content: (
                <span className="d-flex justify-content-between align-items-center">
                  {t(filter.name)}
                  {icon && <span>{icon}</span>}
                </span>
              ),
              onClick: () => changeAttributeFilterSelection(filter),
              type: String(filter.id),
              dataTestId: `attr-filter-item-${filter.id}`,
              ariaLabel: t("Select attribute filter {{filterName}}", {
                filterName: t(filter.name),
              }),
            };
          })
      : [];

    const isSearching = filterSearchTerm?.trim().length > 0;

    // Only show "All Fields" when not searching
    if (!isSearching || filteredItems.length === 0) {
      attributeDropdownItemsArray.push(clearAttributeFilter);
    }

    // Add dynamic filtered items
    attributeDropdownItemsArray.push(...filteredItems);

    // Add "Create" and "Reorder" only if feature is enabled
    if (createFilters) {
      attributeDropdownItemsArray.push(createCustomField);

      if (filteredItems.length > 0) {
        attributeDropdownItemsArray.push(reOrderAttribute);
      }
    }

    return attributeDropdownItemsArray;
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
        onSearch={onSearch}
        dropdownItems={filterDropdownAttributeItems()}
        extraActionIcon={<PencilIcon color="white" />}
        extraActionOnClick={
          !selectedAttributeFilter
            ? handleToggleAttrFilterModal
            : handleEditAttrFilter
        }
        dataTestId="attribute-filter-dropdown"
        ariaLabel={t("Select attribute filter")}
        extraActionAriaLabel={t("Edit attribute filters")}
      />
      <AttributeFilterModal
        show={showAttributeFilter}
        toggleModal={handleToggleAttrFilterModal}
        onClose={handleAttributeFilterModalClose}
      />
      <ReorderAttributeFilterModal
        showAttributeModal={showReorderAttributeFilterModal}
        setShowReorderAttributeFilterModal={setShowReorderAttributeFilterModal}
        onClose={() => {
          setShowReorderAttributeFilterModal(false);
        }}
        attributeFilterList={attributeFilterList}
      />
    </>
  );
};

export default AttributeFilterDropdown;
