import React, { useRef, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { push } from "connected-react-router";

// Types and Services
import { Submission } from "../types/submissions";
import { getSubmissionList } from "../api/queryServices/analyzeSubmissionServices";
import { formatDate } from "../helper/helper";

// Redux Actions
import {
  setAnalyzeSubmissionSort,
  setAnalyzeSubmissionPage,
  setAnalyzeSubmissionLimit,
} from "../actions/analyzeSubmissionActions";

// UI Components
import {
  ReusableResizableTable,
  TableFooter,
  CustomButton,
  SortableHeader,
  CollapsibleSearch,
  DateRangePicker,
  FilterSortActions,
} from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../constants";
import ManageFieldsSortModal from "../components/Modals/ManageFieldsSortModal";


interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
}

const TaskSubmissionList: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // Redux State
  const sortParams = useSelector((state: any) => state?.analyzeSubmission.analyzeSubmissionSortParams ?? {});
  const limit = useSelector((state: any) => state?.analyzeSubmission.limit ?? 10);
  const page = useSelector((state: any) => state?.analyzeSubmission.page ?? 1);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantData?.tenantkey);
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
  const [isManageFieldsModalOpen, setIsManageFieldsModalOpen] = useState(false);

  const handleManageFieldsOpen = () => setIsManageFieldsModalOpen(true);
  const handleManageFieldsClose = () => setIsManageFieldsModalOpen(false);

  // Columns Configuration
  const columns: Column[] = useMemo(() => [
    { name: "Submission ID", sortKey: "id", width: 200, resizable: true },
    { name: "Form Name", sortKey: "form_name", width: 200, resizable: true },
    { name: "Submitter", sortKey: "created_by", width: 200, resizable: true },
    { name: "Submission Date", sortKey: "created", width: 180, resizable: true },
    { name: "Status", sortKey: "application_status", width: 160, resizable: true },
    { name: "", sortKey: "actions", width: 100 },
  ], []);

  const activeSortKey = sortParams.activeKey;
  const activeSortOrder = sortParams?.[activeSortKey]?.sortOrder ?? "asc";

  // Fetch Submissions
  const { data, isLoading: isSubmissionsLoading } = useQuery({
    queryKey: ["submissions", page, limit, activeSortKey, activeSortOrder],
    queryFn: () => getSubmissionList(limit, page, activeSortOrder, activeSortKey),
    keepPreviousData: true,
    staleTime: 0,
  });

  const submissions: Submission[] = data?.submissions ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  // Sort Handler
  const handleSort = useCallback((key: string) => {
    const newOrder = sortParams[key]?.sortOrder === "asc" ? "desc" : "asc";
    const updatedSort = Object.fromEntries(
      Object.keys(sortParams).map((k) => [
        k,
        { sortOrder: k === key ? newOrder : "asc" },
      ])
    );
    dispatch(setAnalyzeSubmissionSort({ ...updatedSort, activeKey: key }));
  }, [dispatch, sortParams]);

  // Page Change Handler
  const handlePageChange = useCallback((pageNum: number) => {
    dispatch(setAnalyzeSubmissionPage(pageNum));
  }, [dispatch]);

  // Limit Change Handler
  const handleLimitChange = (newLimit: number) => {
    dispatch(setAnalyzeSubmissionLimit(newLimit));
    dispatch(setAnalyzeSubmissionPage(1)); // reset page to 1
  };
 const customTdValue = (value, index) => {
  return  <td key={index+value}><div className="text-overflow-ellipsis">{value}  </div></td>

 }
  // Row Renderer
  const renderRow = ({id, formName,createdBy,created,applicationStatus}: Submission) => (
    <tr key={id}>
      {
        [id, formName,createdBy,formatDate(created),applicationStatus].map((item,index)=>customTdValue(item,index))
      }
      <td>
        <div className="text-overflow-ellipsis ">
          <CustomButton
          actionTable
          label={t("View")}
          onClick={() => dispatch(push(`${redirectUrl}application/${id}`))}
          dataTestId={`view-task-${id}`}
          ariaLabel={t("View details for task {{taskName}}", {
            taskName: formName ?? t("unnamed"),
          })}
        />
        </div>
        
      </td>
    </tr>
  );

  // Header Renderer
  const renderHeaderCell = useCallback((
    column: Column,
    index: number,
    columnsLength: number,
    currentResizingColumn: any,
    handleMouseDown: (index: number, column: Column, e: React.MouseEvent) => void
  ) => {
    const isLast = index === columnsLength - 1;
    const headerKey = column.sortKey || `col-${index}`;

    return (
      <th
        key={`header-${headerKey}`}
        className="resizable-column"
        style={{ width: column.width }}
        data-testid={`column-header-${column.sortKey || "actions"}`}
        aria-label={column.name ? `${t(column.name)} ${t("column")}` : ""}
      >
        {!isLast && column.name ? (
          <SortableHeader
            columnKey={column.sortKey}
            title={t(column.name)}
            currentSort={sortParams}
            handleSort={handleSort}
            className="w-100 d-flex justify-content-between align-items-center"
            dataTestId={`sort-header-${column.sortKey}`}
            ariaLabel={t("Sort by {{columnName}}", { columnName: t(column.name) })}
          />
        ) : (
          column.name && t(column.name)
        )}
        {column.resizable && (
          <div
            className={`column-resizer ${currentResizingColumn?.sortKey === column.sortKey ? "resizing" : ""}`}
            onMouseDown={(e) => handleMouseDown(index, column, e)}
            tabIndex={0}
            role="separator"
            aria-orientation="horizontal"
            data-testid={`column-resizer-${column.sortKey}`}
            aria-label={t("Resize {{columnName}} column", {
              columnName: t(column.name),
            })}
          />
        )}
      </th>
    );
  }, [t, sortParams, handleSort]);

  return (
   <div className="main-layout-container">
      {/* Left Panel - Collapsible Search Form */}
      <div className="left-panel">
        <CollapsibleSearch
          isOpen={true}
          hasActiveFilters={false}
          inactiveLabel="No Filters"
          activeLabel="Filters Active"
          onToggle={() => { }}
          manageFieldsAction={handleManageFieldsOpen}
        />

      </div>

      {/* Right Panel - Table Container */}
      <div className="right-panel">
        {/* Top Controls Row - Date Range Picker and Filter/Sort Actions */}
        <div className="top-controls-row d-flex justify-content-between align-items-center mb-3">
          <div className="date-range-section">
            <DateRangePicker
              value={""}
              onChange={() => {}}
              placeholder={t("Filter Created Date")}
              dataTestId="date-range-picker"
              ariaLabel={t("Select date range for filtering")}
              startDateAriaLabel={t("Start date")}
              endDateAriaLabel={t("End date")}
            />
          </div>
          
          <div className="d-flex button-align">
            <FilterSortActions
              showSortModal={false}
              handleFilterIconClick={() => {}}
              handleRefresh={() => {}}
              handleSortModalClose={() => {}}
              handleSortApply={() => {}}
              defaultSortOption={"asc"}
              defaultSortOrder={() => {}}
              optionSortBy={[
                { value: "name", label: "Task" },
                { value: "created", label: "Created Date" },
                { value: "assignee", label: "Assigned To" },
              ]}
              filterDataTestId="task-list-filter"
              filterAriaLabel={t("Filter the task list")}
              refreshDataTestId="task-list-refresh"
              refreshAriaLabel={t("Refresh the task list")}
              sortModalTitle={t("Sort Tasks")}
              sortModalDataTestId="task-sort-modal"
              sortModalAriaLabel={t("Modal for sorting tasks")}
              sortByLabel={t("Sort by")}
              sortOrderLabel={t("Sort order")}
              ascendingLabel={t("Ascending")}
              descendingLabel={t("Descending")}
              applyLabel={t("Apply")}
              cancelLabel={t("Cancel")}
            />
          </div>
        </div>

        {/* Table Container */}
        <div
          className="container-wrapper"
          data-testid="table-container-wrapper"
        >
          <div className="table-outer-container">
            <div
              className="table-scroll-wrapper resizable-scroll"
              ref={scrollWrapperRef}
            >
              <div className="resizable-table-container">
                <ReusableResizableTable
                  columns={columns}
                  data={submissions}
                  renderRow={renderRow}
                  renderHeaderCell={renderHeaderCell}
                  emptyMessage={t(
                    "No submissions have been found. Try a different filter combination or contact your admin."
                  )}
                  onColumnResize={(newWidths) =>
                    console.log("Column resized:", newWidths)
                  }
                  loading={isSubmissionsLoading}
                  tableClassName="resizable-table"
                  headerClassName="resizable-header"
                  containerClassName="resizable-table-container"
                  scrollWrapperClassName="table-scroll-wrapper resizable-scroll"
                  dataTestId="task-resizable-table"
                  ariaLabel={t("submissions data table with resizable columns")}
                />
              </div>
            </div>
          </div>

          {/* Table Footer */}
          {submissions.length > 0 && (
            <div className="table-footer-wrapper">
              <table
                className="custom-tables"
                data-testid="table-footer-container"
              >
                <tfoot>
                  <TableFooter
                    limit={limit}
                    activePage={page}
                    totalCount={totalCount}
                    loader={isSubmissionsLoading}
                    handlePageChange={handlePageChange}
                    onLimitChange={handleLimitChange}
                    pageOptions={[
                      { text: "10", value: 10 },
                      { text: "25", value: 25 },
                      { text: "50", value: 50 },
                      { text: "100", value: 100 },
                      { text: "All", value: totalCount },
                    ]}
                    dataTestId="submission-table-footer"
                    ariaLabel={t("Table pagination controls")}
                    pageSizeDataTestId="submission-page-size-selector"
                    pageSizeAriaLabel={t(
                      "Select number of submissions per page"
                    )}
                    paginationDataTestId="submission-pagination-controls"
                    paginationAriaLabel={t("Navigate between submission pages")}
                  />
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      <ManageFieldsSortModal
        show={isManageFieldsModalOpen}
        onClose={handleManageFieldsClose}
      />

    </div>
  );
};
export default TaskSubmissionList;
