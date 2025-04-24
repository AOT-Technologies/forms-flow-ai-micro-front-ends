import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  TableFooter,
  SortableHeader,
  FilterSortActions,
  CustomButton,
  DateRangePicker,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import { updateTaskSort } from "../../actions/tableActions";
import TaskFilterModal from "../TaskFilterModal";
import AttributeFilterModal from "../AttributeFilterModal";
import { Dropdown } from "react-bootstrap";
import { editFilters, updateDefaultFilter } from "../../api/services/filterServices";
import { setBPMTaskListActivePage, setDefaultFilter, setSelectedTaskID } from "../../actions/taskActions";

interface TableData {
  submissionId: string;
  task: string;
  createdDate: string;
  assignedTo: string;
  submitterName: string;
}

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
}

export function ResizableTable(): JSX.Element {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { tasks, sort: taskSort } = useSelector((state: any) => state.taskList);
  const [showTaskFilterModal, setShowTaskFilterModal] = useState(false);
  const [showAttrFilterModal, setShowAttrFilterModal] = useState(false);
  const { filtersAndCount: filterList, filterList: filterListItems, defaultFilter } = useSelector(
    (state: any) => state.task
  );
  
  
  const handleToggleFilterModal = () => {
    setShowTaskFilterModal(prevState => !prevState);
  };
  const [columns, setColumns] = useState<Column[]>([
    {
      name: "Submission ID",
      width: 150,
      sortKey: "submissionId",
      resizable: true,
    },
    { name: "Task", width: 250, sortKey: "task", resizable: true },
    {
      name: "Created Date",
      width: 150,
      sortKey: "createdDate",
      resizable: true,
    },
    { name: "Assigned To", width: 200, sortKey: "assignedTo", resizable: true },
    {
      name: "Submitter Name",
      width: 200,
      sortKey: "submitterName",
      resizable: true,
    },
    { name: "Actions", width: 100, sortKey: "", resizable: false },
  ]);

  const tableRef = useRef<HTMLTableElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const [activePage, setActivePage] = useState(1);
  const [sizePerPage, setSizePerPage] = useState(5);
  const [showSortModal, setShowSortModal] = useState(false);
  const [taskAttributeData, setTaskAttributeData] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterParams, setFilterParams] = useState({});
  const [isAssigned,setIsAssigned] = useState(false);


  const optionSortBy = [
    { value: "submissionId", label: t("Submission ID") },
    { value: "task", label: t("Task") },
    { value: "createdDate", label: t("Created Date") },
    { value: "assignedTo", label: t("Assigned To") },
    { value: "submitterName", label: t("Submitter Name") },
  ];

  // Improved Sorting Logic
  const handleSort = (key: string) => {
    const currentSort = taskSort[key];
    const newSortOrder = currentSort.sortOrder === "asc" ? "desc" : "asc";

    // Reset all other columns to default (ascending) except the active one
    const updatedSort = columns.reduce((acc, column) => {
      if (column.sortKey) {
        acc[column.sortKey] = {
          sortOrder: column.sortKey === key ? newSortOrder : "asc",
        };
      }
      return acc;
    }, {});

    dispatch(
      updateTaskSort({
        ...updatedSort,
        activeKey: key,
      })
    );
  };

  // Sorting logic for data
  const sortedData = useMemo(() => {
    const activeKey = taskSort.activeKey;
    const sortOrder = taskSort[activeKey]?.sortOrder || "asc";

    return [...tasks].sort((a, b) => {
      const valueA = a[activeKey];
      const valueB = b[activeKey];

      if (valueA == null) return sortOrder === "asc" ? 1 : -1;
      if (valueB == null) return sortOrder === "asc" ? -1 : 1;

      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return sortOrder === "asc"
        ? valueA > valueB
          ? 1
          : -1
        : valueA < valueB
        ? 1
        : -1;
    });
  }, [tasks, taskSort]);

  // Column resizing logic (updated to only resize specific columns)
  const handleMouseDown = (index: number, e: React.MouseEvent): void => {
    if (!columns[index].resizable) return;

    resizingRef.current = index;
    startXRef.current = e.pageX;
    startWidthRef.current = columns[index].width;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (resizingRef.current === null) return;

    const diff = e.pageX - startXRef.current;
    const newWidth = Math.max(50, startWidthRef.current + diff);

    setColumns((prev) =>
      prev.map((col, i) =>
        i === resizingRef.current ? { ...col, width: newWidth } : col
      )
    );
  };

  const handleMouseUp = (): void => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Sorting modal handlers
  const handleSortModalClose = () => {
    setShowSortModal(false);
  };

  const handleFilterIconClick = () => {
    setShowSortModal(true);
  };

  const handleSortApply = (selectedSortOption, selectedSortOrder) => {
    dispatch(
      updateTaskSort({
        ...taskSort,
        activeKey: selectedSortOption,
        [selectedSortOption]: { sortOrder: selectedSortOrder },
      })
    );
    setShowSortModal(false);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Pagination and limit change handlers
  const handleLimitChange = (newLimit: number) => {
    setSizePerPage(newLimit);
    setActivePage(1);
  };

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleToggleAttrFilterModal = () => {
    setShowAttrFilterModal(prevState => !prevState);
  };

  useEffect(() => {  
     const currentFilter = filterListItems.find((item) => item.id === defaultFilter);
    if (currentFilter) {
      setSelectedFilter(currentFilter);
      const checkedVariables = currentFilter.variables?.filter(variable => variable.isChecked);
      setTaskAttributeData(checkedVariables);
    }
  }, [filterListItems]);
  useEffect(()=>{ 
    if (selectedFilter) {
      const updatedFilter = {
        ...selectedFilter,
        isMyTasksEnabled: isAssigned
      };
      editFilters(updatedFilter,selectedFilter.id);
    }
  },[isAssigned])
  const changeFilterSelection = (filter) => {
    const selectedFilter = filterListItems.find(
      (item) => item.id === filter.id
    );
    const taskAttributes = selectedFilter.variables.filter(variable => variable.isChecked === true);
    setTaskAttributeData(taskAttributes);
    setSelectedFilter(selectedFilter);
    const defaultFilterId = selectedFilter.id === defaultFilter ? null : selectedFilter.id;
    updateDefaultFilter(defaultFilterId)
      .then(updateRes => dispatch(setDefaultFilter(updateRes.data.defaultFilter)))
      .catch(error => console.error("Error updating default filter:", error));
    dispatch(setSelectedTaskID(defaultFilterId));
    dispatch(setBPMTaskListActivePage(1)); 
  };
  const handleCheckBoxChange = ()=> {
    setIsAssigned(!isAssigned)
   }; 
   const onLabelClick = () => {
    handleCheckBoxChange(); 
  };
  
   return (
    <div className="container-fluid py-4" data-testid="resizable-table-container" aria-label="Resizable tasks table container">
      <div className="d-md-flex justify-content-end align-items-center button-align mb-3">
        <CustomButton
          variant="secondary"
          size="md"
          label="Create Filter"
          onClick={handleToggleFilterModal}
          dataTestId="open-create-filter-modal"
          ariaLabel="Toggle Create Filter Modal"
        />
        <TaskFilterModal
          show={showTaskFilterModal}
          onClose={handleToggleFilterModal}
        />
        <Dropdown>
          <Dropdown.Toggle variant="secondary" id="dropdown-basic">
            Select Filter
          </Dropdown.Toggle>

          <Dropdown.Menu className="custom-dropdown-menu">
            {filterList.length ? (
              filterList.map((filter) => (
                <Dropdown.Item
                  key={filter.name}
                  onClick={() => changeFilterSelection(filter)}
                >
                  <div className="d-flex align-items-center">
                    <span className="w-100">
                      {filter?.name} ({filter.count ?? 0})
                    </span>
                  </div>
                </Dropdown.Item>
              ))
            ) : (
              <Dropdown.Item disabled>No Filters Found</Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
        <CustomButton
          variant="secondary"
          size="md"
          label="Attribute Filter"
          onClick={handleToggleAttrFilterModal}
          dataTestId="open-create-filter-modal"
          ariaLabel="Open Create Filter Modal"
        />

        <AttributeFilterModal
          show={showAttrFilterModal}
          onClose={handleToggleAttrFilterModal}
          taskAttributeData={taskAttributeData}
          filterParams={filterParams}
          setFilterParams={setFilterParams}
          selectedFilter={selectedFilter}
        />

        <div className={`assign-to-me-container ${
              isAssigned ? "checked" :""
            }`} 
            onClick={onLabelClick}>
          <input
            type="checkbox"
            className="form-check-input"
            checked={isAssigned}
            onChange={handleCheckBoxChange}
            data-testid="assign-to-me-checkbox"
          />
          <label className="assign-to-me-label">{t("Assign to me")}</label>
        </div>

        <DateRangePicker
          dataTestId="task-date-range-picker"
          ariaLabel="Filter tasks by date range"
        />
        <FilterSortActions
          showSortModal={showSortModal}
          handleFilterIconClick={handleFilterIconClick}
          handleRefresh={() => {}}
          handleSortModalClose={handleSortModalClose}
          handleSortApply={handleSortApply}
          optionSortBy={optionSortBy}
          defaultSortOption={taskSort.activeKey}
          defaultSortOrder={taskSort[taskSort.activeKey]?.sortOrder || "asc"}
          filterDataTestId="task-list-filter"
          filterAriaLabel="Filter the task list"
          refreshDataTestId="task-list-refresh"
          refreshAriaLabel="Refresh the task list"
        />
      </div>
      <div className="container-wrapper" data-testid="table-container-wrapper">
        {/* Outer container with border and border-radius */}
        <div className="table-outer-container" data-testid="table-outer-container">
          {/* Scroll wrapper handles the scrolling */}
          <div 
            className="table-scroll-wrapper resizable-scroll" 
            ref={scrollWrapperRef}
            data-testid="table-scroll-wrapper"
            aria-label="Scrollable task table content"
          >
            {/* Table container */}
            <div className="resizable-table-container" data-testid="inner-table-container">
              <table 
                ref={tableRef} 
                className="resizable-table"
                data-testid="task-resizable-table"
                aria-label="Tasks data table with resizable columns"
              >
                <thead className="resizable-header">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={column.name}
                        className="resizable-column"
                        style={{ width: column.width }}
                        data-testid={`column-header-${column.sortKey || 'actions'}`}
                        aria-label={`${column.name} column${column.sortKey ? ', sortable' : ''}`}
                      >
                        {column.sortKey ? (
                          <SortableHeader
                            title={column.name}
                            columnKey={column.sortKey}
                            currentSort={taskSort}
                            handleSort={() => handleSort(column.sortKey)}
                            className="gap-2"
                            dataTestId={`sort-header-${column.sortKey}`}
                            ariaLabel={`Sort by ${column.name}`}
                          />
                        ) : (
                          column.name
                        )}

                        {column.resizable && index < columns.length - 1 && (
                          <div
                            className={`column-resizer ${
                              resizingRef.current === index ? "resizing" : ""
                            }`}
                            onMouseDown={(e) => handleMouseDown(index, e)}
                            data-testid={`column-resizer-${column.sortKey}`}
                            aria-label={`Resize ${column.name} column`}
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData
                    .slice((activePage - 1) * sizePerPage, activePage * sizePerPage)
                    .map((row, index) => (
                      <tr 
                        key={index}
                        data-testid={`task-row-${index}`}
                      >
                        <td data-testid={`task-${index}-submission-id`}>{row.submissionId}</td>
                        <td data-testid={`task-${index}-task-name`}>{row.task}</td>
                        <td data-testid={`task-${index}-created-date`}>{row.createdDate}</td>
                        <td data-testid={`task-${index}-assigned-to`}>{row.assignedTo}</td>
                        <td data-testid={`task-${index}-submitter-name`}>{row.submitterName}</td>
                        <td>
                          <CustomButton
                            className="btn-table"
                            variant="secondary"
                            label={"View"}
                            onClick={() => {}}
                            dataTestId={`view-task-${index}`}
                            ariaLabel={`View details for task ${row.task}`}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {tasks.length ? (
          <table className="custom-tables" data-testid="table-footer-container">
            <tfoot>
              <TableFooter
                limit={sizePerPage}
                activePage={activePage}
                totalCount={tasks.length}
                handlePageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                pageOptions={[
                  { text: "5", value: 5 },
                  { text: "25", value: 25 },
                  { text: "50", value: 50 },
                  { text: "100", value: 100 },
                  { text: "All", value: tasks.length },
                ]}
                dataTestId="task-table-footer"
                ariaLabel="Table pagination controls"
                pageSizeDataTestId="task-page-size-selector"
                pageSizeAriaLabel="Select number of tasks per page"
                paginationDataTestId="task-pagination-controls"
                paginationAriaLabel="Navigate between task pages"
              />
            </tfoot>
          </table>
        ) : null}
      </div>
    </div>
  );
}