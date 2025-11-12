import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { userRoles } from "../../helper/permissions";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import {
  setDefaultFilter,
  setFilterToEdit,
  setSelectedFilter,
  setBPMTaskListActivePage,
  setTaskListLimit,
} from "../../actions/taskActions";
import {
  fetchAttributeFilterList,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import TaskFilterModal from "../TaskFilterModal/TaskFilterModal";
import { ReorderTaskFilterModal } from "../ReorderTaskFilterModal";
import { FilterItemType, UserDetail } from "../../types/taskFilter";
import {
  AddIcon,
  FilterDropDown,
  ReorderIcon
} from "@formsflow/components";
import { cloneDeep } from "lodash";



const TaskListDropdownItems = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { createFilters } = userRoles();
  const selectedFilter = useSelector(
    (state: RootState) => state.task.selectedFilter
  );
  const tasksCount = useSelector((state: RootState) => state.task.tasksCount);
  const isUnsavedFilter = useSelector(
    (state: RootState) => state.task.isUnsavedFilter
  );
  const filtersAndCount = useSelector(
    (state: RootState) => state.task.filtersAndCount
  );
  const filterList = useSelector((state: RootState) => state.task.filterList);
  const defaultFilter = useSelector(
    (state: RootState) => state.task.defaultFilter
  );
  const userDetails: UserDetail = useSelector(
    (state: RootState) => state.task.userDetails
  );

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showReorderFilterModal, setShowReorderFilterModal] = useState(false);
  const [filterSearchTerm, setFilterSearchTerm] = useState("");

  const handleEditFilterFromItem = (filter) => {
    // Prevent editing if the active filter is the initial "All Tasks".
    if (!selectedFilter || (!isUnsavedFilter && filterList.length === 0))
      return;
    dispatch(setFilterToEdit(cloneDeep(filter)));
    setShowTaskFilterModal(true);
  };



  const handleCloseFilterModal = () => {
    setShowTaskFilterModal(false);
    dispatch(setFilterToEdit(null));
  };



  const handleToggleFilterModal = () => {
    setShowTaskFilterModal((prev) => !prev);
  };
  const changeFilterSelection = (filter) => {
    if (filter?.id === defaultFilter) return;

    //if selecetd filter is not in filter list, then select All tasks filter
    const upcomingFilter = filterList.find((item) => item.id === filter?.id);

    if (!upcomingFilter) return;

    dispatch(setDefaultFilter(upcomingFilter.id));
    updateDefaultFilter(upcomingFilter.id);
    dispatch(setSelectedFilter(upcomingFilter));
    dispatch(fetchAttributeFilterList(upcomingFilter.id));
    // Let TaskList effect trigger the fetch; set pagination to first page and default limit
    dispatch(setBPMTaskListActivePage(1));
    dispatch(setTaskListLimit(25));
  };

  const onSearch = (searchTerm: string) => {
    setFilterSearchTerm(searchTerm);
  };

  const filterDropdownItems = useMemo(() => {
    const filterDropdownItemsArray: FilterItemType[] = [];
    const noFilter: FilterItemType = {
      content: <em>{t("No filters found")}</em>,
      onClick: () => {},
      type: "none",
      dataTestId: "no-filters",
      ariaLabel: t("No filters available"),
      category: "none",
    };
    const createFilter: FilterItemType = {
      content: (
        <div className="d-flex align-items-center justify-content-between">
        <span>{t("Create custom filter")}</span> <AddIcon />
        </div>
      ),
      onClick: handleToggleFilterModal,
      type: "custom",
      dataTestId: "filter-item-custom",
      ariaLabel: t("Custom Filter"),
      category: "action",
    };
    const reOrderFilter: FilterItemType = {
      content: (
        <div className="d-flex align-items-center justify-content-between">
          <span>{t("Re-order / Hide Filters")}</span> <ReorderIcon />
        </div>
      ),
      type: "reorder",
      onClick: () => setShowReorderFilterModal(true),
      dataTestId: "filter-item-reorder",
      ariaLabel: t("Re-order And Hide Filters"),
      category: "action",
    };
    const mappedItems = (filtersAndCount || [])
      .filter((filter) => {
        const details = filterList.find((item) => item.id === filter.id);
        const filterName = t(filter.name).toLowerCase();
        return (
          details &&
          !details.hide &&
          filterName.includes(filterSearchTerm.toLowerCase())
        ); // only include visible filters
      })
      .map((filter) => {
        const filterDetails = filterList.find((item) => item.id === filter.id);
        let icon = null;
        let category: "my" | "shared" = "my";

        if (filterDetails) {
          const createdByMe =
            userDetails?.preferred_username === filterDetails?.createdBy;
          const isSharedToPublic =
            !filterDetails?.roles?.length && !filterDetails?.users?.length;
          const isSharedToRoles = filterDetails?.roles.length;
          const isSharedToMe = filterDetails?.roles?.some((role) =>
            userDetails?.groups?.includes(role)
          );

           if (createdByMe && (isSharedToPublic || isSharedToRoles)) {
            category = "my";
          } else if (isSharedToPublic || isSharedToMe) {
            category = "shared";
          }
          // category remains "my" for all other cases (default)
          return {
            className:
              filter.id === selectedFilter?.id ? "selected-filter-item" : "",
            content: (
              <span className="d-flex justify-content-between align-items-center">
                {t(filter.name)} ({filter.count}) {icon && <span>{icon}</span>}
              </span>
            ),
            type: String(filter.id),
            onClick: () => {
              changeFilterSelection(filter);
            },
            dataTestId: `filter-item-${filter.id}`,
            ariaLabel: t("Select filter {{filterName}}", {
              filterName: t(filter.name),
            }),
            category,
            onEdit: () => handleEditFilterFromItem(filter),
          };
        }
      }).filter(Boolean) as FilterItemType[];

    if (createFilters) {
      filterDropdownItemsArray.push(createFilter, reOrderFilter);
    }

    if (mappedItems.length) {
      filterDropdownItemsArray.push(...mappedItems);
    } else {
      filterDropdownItemsArray.push(noFilter);
    }

    return filterDropdownItemsArray;
  }, [
    filtersAndCount,
    filterList,
    selectedFilter,
    createFilters,
    userDetails,
    filterSearchTerm,
    t,
  ]);

  // filter title based on unsaved filter, empty list or selected filter
  let title;
  if (selectedFilter) {
    if (isUnsavedFilter) {
      title = t("Unsaved Filter");
    } else if (filterList.length === 0) {
      title = t("All Tasks");
    } else {
      title = `${selectedFilter.name} (${tasksCount ?? 0})`;
    }
  }

  return (
    <>
      <FilterDropDown
        label={title}
        items={filterDropdownItems}
        searchable={true}
        searchPlaceholder={t("Search all filters")}
        onSearch={onSearch}
        dataTestId="business-filter-dropdown"
        ariaLabel={t("Select task filter")}
        className="input-filter"
        variant="task"
        categorize={true}
      />
      <TaskFilterModal
        toggleModal={handleToggleFilterModal}
        show={showTaskFilterModal}
        onClose={handleCloseFilterModal}
      />
      <ReorderTaskFilterModal
        showModal={showReorderFilterModal}
        setShowReorderFilterModal={setShowReorderFilterModal}
        onClose={() => {
          setShowReorderFilterModal(false);
        }}
        filtersList={filterList}
      />
    </>
  );
});

export default TaskListDropdownItems;
