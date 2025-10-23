// import {
//   AddIcon,
//   PencilIcon,
//   SharedWithMeIcon,
//   SharedWithOthersIcon,
// } from "@formsflow/components";
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

  //  Convert filters into SelectDropdown-compatible options
  const dropdownOptions = useMemo(() => {
    const filteredItems = attributeFilterList
      .filter((filter) => {
        const nameMatch = filter.name
          .toLowerCase()
          .includes(filterSearchTerm.toLowerCase());
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

        let icon = "";
        if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
          icon = "👥"; // You can replace this with <SharedWithOthersIcon /> inside a custom label if needed
        } else if (isSharedToPublic || isSharedToMe) {
          icon = "🔗";
        }

        return {
          label: `${t(filter.name)} ${icon}`,
          value: filter.id,
        };
      });

    // Include “All Fields” at top
    const allFields = {
      label: t("All Fields"),
      value: "none",
    };

    return [allFields, ...filteredItems];
  }, [attributeFilterList, filterSearchTerm, userDetails, t]);

  //  Handle dropdown selection
  const handleDropdownChange = (value: string | number) => {
    if (value === "none") {
      changeAttributeFilterSelection(null);
      return;
    }
    const selected = attributeFilterList.find((f) => f.id === value);
    if (selected) changeAttributeFilterSelection(selected);
  };

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
      <div className="d-flex align-items-center gap-2">
        <SelectDropdown
          options={dropdownOptions}
          value={selectedAttributeFilter?.id || "none"}
          onChange={handleDropdownChange}
          searchDropdown
          ariaLabel={t("Select attribute filter")}
          dataTestId="attribute-filter-dropdown"
          defaultValue={title}
          variant="secondary"
        />

        {/* Separate Edit / Add button */}
        {/* <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={
            !selectedAttributeFilter
              ? handleToggleAttrFilterModal
              : handleEditAttrFilter
          }
          aria-label={t("Edit attribute filters")}
        >
          <PencilIcon />
        </button> */}
      </div>

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
