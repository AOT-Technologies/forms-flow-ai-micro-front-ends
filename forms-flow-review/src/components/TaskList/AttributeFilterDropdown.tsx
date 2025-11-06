import {
  AddIcon,
  FilterDropDown,
  ReorderIcon,
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
import { FilterItemType, UserDetail } from "../../types/taskFilter";
import { buildDateRangePayload } from "../../helper/tableHelper";
import { SelectDropdown } from "@formsflow/components"; // ✅ Use reusable dropdown


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
  const dateRange = useSelector(
    (state: RootState) => state.task.dateRange
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
        }
      })
    );
  };

  const changeAttributeFilterSelection = (attributeFilter) => {
    dispatch(setSelectedBpmAttributeFilter(attributeFilter));

    if (
      !selectedFilter ||
      (!isUnsavedAttributeFilter &&
        attributeFilter?.id === selectedAttributeFilter?.id)
    )
      return;

  const date = buildDateRangePayload(dateRange);

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

  // append date range to currentCriteria if date is available
  const updatedCriteria = {
    ...currentCriteria,
    ...date,
  };

  const data = { ...selectedFilter, criteria: updatedCriteria };
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


  const handleEditAttributeFromItem = (filter) => {
    if (!filter) return;
    setShowAttributeFilter(true);
    dispatch(setAttributeFilterToEdit(cloneDeep(filter)));
  };

  const filterDropdownAttributeItems = useMemo(() => {
    const attributeDropdownItemsArray: FilterItemType[] = [];

    const createCustomField: FilterItemType = {
      content: (
        <div className="d-flex align-items-center justify-content-between">
          <span>{t("Custom Filter")}</span>
          <AddIcon />
        </div>
      ),
      onClick: handleToggleAttrFilterModal,
      type: "custom",
      dataTestId: "attr-filter-item-custom",
      ariaLabel: t("Custom Attribute Filter"),
      category: "action",
    };

    const reOrderAttribute: FilterItemType = {
      content: (
        <div className="d-flex align-items-center justify-content-between">
          <span>{t("Re-order / Hide Filters")}</span>
          <ReorderIcon />
        </div>
      ),
      onClick: () => setShowReorderAttributeFilterModal(true),
      type: "reorder",
      dataTestId: "attr-filter-item-reorder",
      ariaLabel: t("Re-order And Hide Filters"),
      category: "action",
    };

    const clearAttributeFilter: FilterItemType = {
      className: !selectedAttributeFilter?.id ? "selected-filter-item" : "",
      content: <span>{t("All Fields")}</span>,
      onClick: () => changeAttributeFilterSelection(null),
      type: "none",
      dataTestId: "attr-filter-item-none",
      ariaLabel: t("All Fields"),
      category: "action",
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

            let category: "my" | "shared" = "my";

            if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
              category = "my";
            } else if (isSharedToPublic || isSharedToMe) {
              category = "shared";
            }
            // category remains "my" for all other cases (default)

            return {
              className:
                filter?.id === selectedAttributeFilter?.id
                  ? "selected-filter-item"
                  : "",
              content: (
                <span className="d-flex justify-content-between align-items-center">
                  {t(filter.name)}
                </span>
              ),
              onClick: () => changeAttributeFilterSelection(filter),
              type: String(filter.id),
              dataTestId: `attr-filter-item-${filter.id}`,
              ariaLabel: t("Select attribute filter {{filterName}}", {
                filterName: t(filter.name),
              }),
              category,
              onEdit: () => handleEditAttributeFromItem(filter),
            };
          })
      : [];

    const isSearching = filterSearchTerm?.trim().length > 0;

    // Add "Create" and "Reorder" at the top if feature is enabled
    if (createFilters) {
      attributeDropdownItemsArray.push(createCustomField);

      if (filteredItems.length > 1) {
        attributeDropdownItemsArray.push(reOrderAttribute);
      }
    }

    // Only show "All Fields" when not searching
    if (!isSearching || filteredItems.length === 0) {
      attributeDropdownItemsArray.push(clearAttributeFilter);
    }

    // Add dynamic filtered items
    attributeDropdownItemsArray.push(...filteredItems);

    return attributeDropdownItemsArray;
  }, [
    attributeFilterList,
    filterSearchTerm,
    selectedAttributeFilter,
    userDetails,
    selectedFilter,
    createFilters,
  ]);

  //  Dynamic title
  const title = selectedAttributeFilter
    ? `${
        isUnsavedAttributeFilter
          ? t("Unsaved Filter")
          : t(selectedAttributeFilter.name)
      }`
    : t("All Fields");

  return (
    <>
      <FilterDropDown
        label={title}
        items={filterDropdownAttributeItems}
        searchable={false}
        searchPlaceholder={t("Search")}
        onSearch={onSearch}
        dataTestId="attribute-filter-dropdown"
        ariaLabel={t("Select attribute filter")}
        className="input-filter"
        variant="field"
        categorize={true}
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
