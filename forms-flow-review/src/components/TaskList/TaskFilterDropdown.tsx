// import { 
//   AddIcon, 
//   PencilIcon, 
//   SharedWithMeIcon, 
//   SharedWithOthersIcon 
// } from "@formsflow/components";
import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { userRoles } from "../../helper/permissions";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { setDefaultFilter, setFilterToEdit, setSelectedFilter } from "../../actions/taskActions";
import { fetchAttributeFilterList, fetchServiceTaskList, updateDefaultFilter } from "../../api/services/filterServices";
import TaskFilterModal from "../TaskFilterModal/TaskFilterModal";
import { ReorderTaskFilterModal } from "../ReorderTaskFilterModal";
import {  UserDetail } from "../../types/taskFilter";
import { SelectDropdown } from "@formsflow/components"; // ✅ Import your reusable component

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
  const userDetails: UserDetail = useSelector((state:RootState)=> state.task.userDetails);

  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showReorderFilterModal,setShowReorderFilterModal] = useState(false); 
  const [filterSearchTerm, setFilterSearchTerm] = useState("");

  // const handleEditTaskFilter = () => {
  //   if (!selectedFilter || (!isUnsavedFilter && filterList.length === 0)) return;
  //   dispatch(setFilterToEdit(selectedFilter));
  //   setShowTaskFilterModal(true);
  // };

  // const handleCloseFilterModal = () => {
  //   setShowTaskFilterModal(false);
  //   dispatch(setFilterToEdit(null));
  // };

  const handleToggleFilterModal = () => {
    setShowTaskFilterModal((prev) => !prev); 
  };
const changeFilterSelection = (filter) => { 
  if (filter?.id === defaultFilter) return;

  //if selecetd filter is not in filter list, then select All tasks filter
  const upcomingFilter =
    filterList.find(item => item.id === filter?.id)  

  if (!upcomingFilter) return;

  dispatch(setDefaultFilter(upcomingFilter.id));
  updateDefaultFilter(upcomingFilter.id);
  dispatch(setSelectedFilter(upcomingFilter));
  dispatch(fetchAttributeFilterList(upcomingFilter.id));
  dispatch(fetchServiceTaskList(upcomingFilter, null, 1, 25));
};

  // const onSearch = (term: string) => {
  //   setFilterSearchTerm(term);
  // };

  // Build dropdown options for SelectDropdown
  const dropdownOptions = useMemo(() => {
    return filtersAndCount
      .filter((filter) => {
        const details = filterList.find((item) => item.id === filter.id);
        const filterName = t(filter.name).toLowerCase();
        return details && !details.hide && filterName.includes(filterSearchTerm.toLowerCase());
      })
      .map((filter) => ({
        label: `${t(filter.name)} (${filter.count})`,
        value: filter.id
      }));
  }, [filtersAndCount, filterList, filterSearchTerm, t]);

  const handleDropdownChange = (value: string | number) => {
    const selected = filtersAndCount.find(f => f.id === value);
    if (selected) changeFilterSelection(selected);
  };
  // Filter title (selected value)
  let title;
  if (selectedFilter) {
    if (isUnsavedFilter) {
      title = t("Unsaved Filter");
    }
    else if (filterList.length === 0) {
      title = t("All Tasks");
    } else {
      title = `${selectedFilter.name} (${tasksCount ?? 0})`;
    }
  }

  return (
    <>
      <div className="d-flex align-items-center gap-2">
        <SelectDropdown
          options={dropdownOptions}
          value={selectedFilter?.id}
          onChange={handleDropdownChange}
          searchDropdown
          ariaLabel={t("Select task filter")}
          dataTestId="business-filter-dropdown"
          defaultValue={title}
          variant="secondary"
        />
        {/* <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleEditTaskFilter}
          aria-label={t("Edit task filter")}
        >
          <PencilIcon />
        </button> */}
      </div>

      {/* <TaskFilterModal
        toggleModal={handleToggleFilterModal}
        show={showTaskFilterModal}
        onClose={handleCloseFilterModal} 
      /> */}
      <ReorderTaskFilterModal
        showModal={showReorderFilterModal}
        setShowReorderFilterModal={setShowReorderFilterModal}
        onClose={() => setShowReorderFilterModal(false)}
        filtersList={filterList}
      />
    </>
  );
});

export default TaskListDropdownItems;
