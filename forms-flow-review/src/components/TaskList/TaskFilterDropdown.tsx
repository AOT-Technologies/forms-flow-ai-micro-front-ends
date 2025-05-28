import { AddIcon, ButtonDropdown, PencilIcon } from "@formsflow/components";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createFilterPermission, 
} from "../../helper/permissions";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { setDefaultFilter, setFilterToEdit } from "../../actions/taskActions";
import { updateDefaultFilter } from "../../api/services/filterServices";
import TaskFilterModal from "../TaskFilterModal/TaskFilterModal";

const TaskListDropdownItems = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
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

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);

  const handleEditTaskFilter = () => {
    if (!selectedFilter) return;
    dispatch(setFilterToEdit(selectedFilter));
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
    if (filter?.id == defaultFilter) return;
    const upcomingFilter = filterList.find((item) => item.id == filter.id);
    if (!upcomingFilter) return;
    dispatch(setDefaultFilter(upcomingFilter.id));
    updateDefaultFilter(upcomingFilter.id);
  };

  const filterDropdownItems = useMemo(() => {
    const filterDropdownItemsArray = [];
    const noFilter = {
      content: <em>{t("No filters found")}</em>,
      onClick: () => {},
      type: "none",
      dataTestId: "no-filters",
      ariaLabel: t("No filters available"),
    };
    const createFilter = {
      content: (
        <span>
          <span>
            <AddIcon className="filter-plus-icon" />
          </span>{" "}
          {t("Custom Filter")}
        </span>
      ),
      onClick: handleToggleFilterModal,
      type: "custom",
      dataTestId: "filter-item-custom",
      ariaLabel: t("Custom Filter"),
    };
    const reOrderFilter = {
      content: (
        <span>
          <span>
            <PencilIcon className="filter-edit-icon" />
          </span>{" "}
          {t("Re-order And Hide Filters")}
        </span>
      ),
      type: "reorder",
      dataTestId: "filter-item-reorder",
      ariaLabel: t("Re-order And Hide Filters"),
    };

    const mappedItems = filtersAndCount.map((filter) => ({
      content: `${t(filter.name)} (${filter.count})`,
      type: String(filter.id),
      onClick: () => {
        changeFilterSelection(filter);
      },
      dataTestId: `filter-item-${filter.id}`,
      ariaLabel: t("Select filter {{filterName}}", {
        filterName: t(filter.name),
      }),
    }));

    if (filtersAndCount.length === 0) {
      filterDropdownItemsArray.push(noFilter);
    }
    // Adding mapped Items
    filterDropdownItemsArray.push(...mappedItems);
    // Adding create filter and reorder filter
    if (createFilterPermission) {
      filterDropdownItemsArray.push(createFilter);
      if (filtersAndCount.length > 1) {
        filterDropdownItemsArray.push(reOrderFilter);
      }
    }

    return filterDropdownItemsArray;
  }, [filtersAndCount, defaultFilter ]);

  const title = selectedFilter
    ? `${isUnsavedFilter ? t("Unsaved Filter") : t(selectedFilter.name)} (${
        tasksCount ?? 0
      })`
    : t("Select Filter");
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
        dropdownItems={filterDropdownItems}
        extraActionIcon={<PencilIcon color="white" />}
        extraActionOnClick={handleEditTaskFilter}
        dataTestId="business-filter-dropdown"
        ariaLabel={t("Select business filter")}
        extraActionAriaLabel={t("Edit selected filter")}
      />
      <TaskFilterModal
        toggleModal={handleToggleFilterModal}
        show={showTaskFilterModal}
        onClose={handleCloseFilterModal} 
      />
    </>
  );
});

export default TaskListDropdownItems;
