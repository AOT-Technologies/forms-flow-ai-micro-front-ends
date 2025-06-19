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
import { useState, useMemo } from "react";
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
  const selectedAttributeFilter = useSelector(
    (state: RootState) => state.task?.selectedAttributeFilter
  );
  const userDetails: UserDetail = useSelector(
    (state: RootState) => state.task.userDetails
  );
  const attributeFilterList = useSelector(
    (state: RootState) => state.task.attributeFilterList || []
  );
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showReorderAttributeFilterModal, setShowReorderAttributeFilterModal] =
    useState(false);
  const isUnsavedAttributeFilter = useSelector(
    (state: RootState) => state.task.isUnsavedAttributeFilter
  );
  const selectedFilter = useSelector(
    (state: RootState) => state.task.selectedFilter
  );
  const handleToggleAttrFilterModal = () => {
    setShowAttributeFilter((prev) => !prev);
  };
  const [filterSearchTerm, setFilterSearchTerm] = useState("");
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
    if (!selectedFilter || attributeFilter?.id === selectedAttributeFilter?.id)
      return;

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

  const filterDropdownAttributeItems = useMemo(() => {
    const filterDropdownItemsArray = [];

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
      dataTestId: "attr-filter-clear",
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
      onClick: () => setShowReorderAttributeFilterModal(true),
      type: "reorder",
      dataTestId: "attr-filter-item-reorder",
      ariaLabel: t("Re-order And Hide Attribute Filters"),
    };

    const mappedItems =
      attributeFilterList
        ?.filter((filter) => {
          const filterName = (filter.name).toLowerCase();
          return (
            !filter.hide && filterName.includes(filterSearchTerm.toLowerCase())
          );
        })
        .map((filter) => {
          const createdByMe =
            userDetails?.preferred_username === filter?.createdBy;
          const isSharedToPublic =
            !filter?.roles?.length && !filter?.users?.length;
          const isSharedToRoles = filter?.roles?.length;
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
              filter.id === selectedAttributeFilter?.id
                ? "selected-filter-item"
                : "",
            content: (
              <span className="d-flex justify-content-between align-items-center">
                {t(filter.name)} {icon && <span>{icon}</span>}
              </span>
            ),
            onClick: () => changeAttributeFilterSelection(filter),
            type: String(filter.id),
            dataTestId: `attr-filter-item-${filter.id}`,
            ariaLabel: t("Select attribute filter {{filterName}}", {
              filterName: t(filter.name),
            }),
          };
        }) || [];

    if (!mappedItems.length) {
      return createFilters
        ? [noAttributeFilter, customAttribute]
        : [noAttributeFilter];
    }

    // Add standard filters
    filterDropdownItemsArray.push(clearAttributeFilter, ...mappedItems);

    // Conditionally add custom and reorder options
    if (createFilters) {
      filterDropdownItemsArray.push(customAttribute);
      if (mappedItems.length > 0) {
        filterDropdownItemsArray.push(reorderOption);
      }
    }

    return filterDropdownItemsArray;
  }, [
    attributeFilterList,
    userDetails,
    filterSearchTerm,
    selectedAttributeFilter,
    t
  ]);

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
        dropdownItems={filterDropdownAttributeItems}
        extraActionIcon={<PencilIcon color="white" />}
        extraActionOnClick={handleEditAttrFilter}
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
