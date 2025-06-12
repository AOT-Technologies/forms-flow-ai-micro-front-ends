import { AddIcon, ButtonDropdown, PencilIcon, SharedWithMeIcon, SharedWithOthersIcon } from "@formsflow/components";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createFilterPermission, 
} from "../../helper/permissions";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { setDefaultFilter, setFilterToEdit, setSelectedFilter } from "../../actions/taskActions";
import { updateDefaultFilter } from "../../api/services/filterServices";
import TaskFilterModal from "../TaskFilterModal/TaskFilterModal";
import { ReorderTaskFilterModal } from "../ReorderTaskFilterModal";
import {  UserDetail } from "../../types/taskFilter";
import { StorageService } from "@formsflow/service";
 
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
  const userDetails: UserDetail = useSelector((state:RootState)=> state.task.userDetails);

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showReorderFilterModal,setShowReorderFilterModal] = useState(false); 
  
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
  if (filter?.id === defaultFilter) return;

  //if selecetd filter is not in filter list, then select All tasks filter
  const upcomingFilter =
    filterList.find(item => item.id === filter?.id) ||
    filterList.find(item => item.name === "All tasks"); 

  if (!upcomingFilter) return;

  dispatch(setDefaultFilter(upcomingFilter.id));
  updateDefaultFilter(upcomingFilter.id);
  dispatch(setSelectedFilter(upcomingFilter));
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
          <AddIcon />
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
          <PencilIcon />
          {t("Re-order And Hide Filters")}
        </span>
      ),
      type: "reorder",
      onClick: () => setShowReorderFilterModal(true),
      dataTestId: "filter-item-reorder",
      ariaLabel: t("Re-order And Hide Filters"),
    };
    const mappedItems = filtersAndCount
    .filter((filter) => {
    const details = filterList.find((item) => item.id === filter.id);
    
    return details && !details.hide; // only include visible filters
  })
    .map((filter) => { 
      const filterDetails = filterList.find((item) => item.id === filter.id);
      let icon = null;
      if(filterDetails){
        const createdByMe =userDetails?.preferred_username === filterDetails?.createdBy;
        const isSharedToPublic =!filterDetails?.roles?.length && !filterDetails?.users?.length;
        const isSharedToMe = filterDetails?.roles?.some((role) =>
          userDetails?.groups?.includes(role)
        );

        if (createdByMe) {
          icon = <SharedWithOthersIcon/>;
        } else if (isSharedToPublic || isSharedToMe) {
          icon = <SharedWithMeIcon/>;
        }
   
      return { 
        className:  filter.id === selectedFilter?.id ? "selected-filter-item" : "",
        content: <span className="d-flex justify-content-between align-items-center">
          {t(filter.name)} ({filter.count})
          {icon && <span>{icon}</span>}
        </span>,
      type: String(filter.id),
      onClick: () => {
        changeFilterSelection(filter);
      },
      dataTestId: `filter-item-${filter.id}`,
      ariaLabel: t("Select filter {{filterName}}", {
        filterName: t(filter.name),
      }),}
    }})

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
  }, [filtersAndCount, defaultFilter,filterList,userDetails ]);

  const title = selectedFilter
    ? `${isUnsavedFilter ? t("Unsaved Filter") : t(selectedFilter.name)} (${
        tasksCount ?? 0
      })`
    : t("Select Filter");
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
        dropdownItems={filterDropdownItems}
        extraActionIcon={<PencilIcon/>}
        extraActionOnClick={handleEditTaskFilter}
        dataTestId="business-filter-dropdown"
        ariaLabel={t("Select task filter")}
        extraActionAriaLabel={t("Edit task filter")}
        className="input-filter"
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
