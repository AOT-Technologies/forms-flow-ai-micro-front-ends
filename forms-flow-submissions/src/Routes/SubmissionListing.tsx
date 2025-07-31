import React, { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { push } from "connected-react-router";

// Types and Services
import { Submission } from "../types/submissions";
import { getSubmissionList, fetchAllForms, fetchSubmissionList } from "../api/queryServices/analyzeSubmissionServices";
import { formatDate,optionSortBy } from "../helper/helper";
import { HelperServices } from "@formsflow/service";

// Redux Actions
import {
  setAnalyzeSubmissionSort,
  setAnalyzeSubmissionPage,
  setAnalyzeSubmissionLimit,
  setAnalyzeSubmissionDateRange,
  setDefaultSubmissionFilter,
  setSelectedSubmisionFilter,
  setSubmissionFilterList
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

interface SubmissionField {
  key: string;
  name: string;
  label: string;
  isChecked: boolean; 
  isFormVariable: boolean;
  sortOrder?: number;
}


const TaskSubmissionList: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState([]);

  // Redux State
  const sortParams = useSelector((state: any) => state?.analyzeSubmission.analyzeSubmissionSortParams ?? {});
  const limit = useSelector((state: any) => state?.analyzeSubmission.limit ?? 10);
  const page = useSelector((state: any) => state?.analyzeSubmission.page ?? 1);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantData?.tenantkey);
  const defaultSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.defaultFilter);
  const selectedSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.selectedFilter);
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
 const filterList = useSelector((state: any) => state?.analyzeSubmission?.submissionFilterList);
  const dateRange = useSelector( (state: any) => state?.analyzeSubmission.dateRange );
  //local state
  const [isManageFieldsModalOpen, setIsManageFieldsModalOpen] = useState(false);
   const handleManageFieldsOpen = () => setIsManageFieldsModalOpen(true);
  const handleManageFieldsClose = () => setIsManageFieldsModalOpen(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [dropdownSelection, setDropdownSelection] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState(selectedSubmissionFilter ||"All Forms");
  const [submissionFields, setSubmissionFields] = useState([
          { key: "id", name: "Submission ID", label: "Submission ID", isChecked: true, isFormVariable: false },
          { key: "form_name", name: "Form", label: "Form", isChecked: true, isFormVariable: false },
          { key: "created_by", name: "Submitter", label: "Submitter", isChecked: true, isFormVariable: false },
          { key: "created", name: "Submission Date", label: "Submission Date", isChecked: true, isFormVariable: false },
          { key: "applicationStatus", name: "Status", label: "Status", isChecked: true, isFormVariable: false }
        ]);
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
const handleFieldSearch = (filters: Record<string, string>) => {
  setFieldFilters(filters);
};

const selectedFilter = useMemo(() => {
  return filterList?.find((item) => dropdownSelection === item.parentFormId);
}, [dropdownSelection, filterList]);

const initialInputFields = useMemo(() => {
  //these pinned fileds should always come  first in sidebar
  const pinnedOrder = ["id", "created_by", "applicationStatus"];
const allVars = [...submissionFields, ...(selectedFilter?.variables ?? [])];

  // Removing  form name & created date since it is always available
  const filteredVars = allVars.filter(
    (item) => item.key !== "form_name" && item.key !== "created"
  );
  const sortedVars = [
    ...pinnedOrder
      .map((key) => filteredVars.find((item) => item.key === key))
      .filter(Boolean), 
    //adding remaining items that are not pinned
    ...filteredVars.filter((item) => !pinnedOrder.includes(item.key)),
  ];

  return sortedVars.map((item) => ({
    id: item.key,
    name: item.key,
    type: "text",
    label: t(item.label),
    value: "",
  }));
}, [selectedFilter]);
  useEffect(() => {

    if (!formData.length || dropdownSelection == null) return;

    const selectedForm = formData.find((form) => form.parentFormId === dropdownSelection);
    setSelectedItem(selectedForm?.formName ?? "All Forms");
  }, [defaultSubmissionFilter, filterList, formData]);


useEffect(() => {
  fetchSubmissionList()
    .then((res) => {
      const { filters = [], defaultSubmissionsFilter } = res.data || {};

      dispatch(setSubmissionFilterList(filters));
      dispatch(setDefaultSubmissionFilter(defaultSubmissionsFilter));

      const defaultFilter = filters.find((f) => f.id === defaultSubmissionsFilter);
      if (defaultFilter) {
        dispatch(setSelectedSubmisionFilter(defaultFilter.parentFormId));
        setDropdownSelection(defaultFilter.parentFormId);
        setSelectedItem(defaultFilter.name);
      } else {
        setDropdownSelection(null);
        setSelectedItem("All Forms");
      }
    })
    .catch((error) => {
      console.error("Error fetching submission list:", error);
    });
}, []);

const columns: Column[] = useMemo(() => {
  const sourceFields = selectedFilter?.variables?.length
    ? selectedFilter.variables
    : submissionFields;

    const getColumnWidth = (key: string): number => {
  const widthMap: Record<string, number> = {
    created: 180,
    application_status: 160,
  };
  return widthMap[key] ?? 200;
};

  const dynamicColumns: Column[] = sourceFields
    .filter((item) => item.isChecked)
    .map((item) => ({
      name: item.name,
      sortKey: item.key,
      width: getColumnWidth(item.key),
      resizable: true,
    }));

  return [
    ...dynamicColumns,
    {
      name: "", 
      sortKey: "actions",
      width: 100,
    },
  ];
}, [selectedFilter, submissionFields]);


  const activeSortKey = sortParams.activeKey;
  const activeSortOrder = sortParams?.[activeSortKey]?.sortOrder ?? "asc";

  // Fetch Submissions
const {
  data,
  isLoading: isSubmissionsLoading,
  refetch,
} = useQuery({
  queryKey: ["submissions", page, limit, activeSortKey, activeSortOrder, dateRange, fieldFilters],
  queryFn: () =>
    getSubmissionList(
      limit,
      page,
      activeSortOrder,
      activeSortKey,
      dateRange,
      fieldFilters 
    ),
  keepPreviousData: true,
  staleTime: 0,
});


  

  useEffect(()=>{
    fetchAllForms()
        .then((res) => {
          const data = res.data?.forms ?? [];
          setFormData(data);
        })
        .catch((err) => {
          console.error(err);
        });
  },[]);

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

  // sortmodal actions
  const handleSortApply = (selectedSortOption, selectedSortOrder) => {
    // if need to reset the sort orders use this function
    const resetSortOrders = HelperServices.getResetSortOrders(
      optionSortBy.options
    );
    const updatedData = {
      ...resetSortOrders,
      activeKey: selectedSortOption,
      [selectedSortOption]: { sortOrder: selectedSortOrder },
    };
    dispatch(setAnalyzeSubmissionSort(updatedData));
    setShowSortModal(false);
  };

  const handlerefresh = () => {
    refetch();
  };

 const handleDateRangeChange = (newDateRange) => {
  const { startDate, endDate } = newDateRange;

  // Update state if:
  // - both dates are selected
  // - OR both are cleared (null)
  const bothSelected = startDate && endDate;
  const bothCleared = !startDate && !endDate;

  if (!(bothSelected || bothCleared)) return;

  dispatch(setAnalyzeSubmissionDateRange(newDateRange));
  dispatch(setAnalyzeSubmissionPage(1));
 };

  const toggleFilterModal = () => setShowSortModal(!showSortModal);
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
          onClick={() => dispatch(push(`${redirectUrl}submissions/${id}`))}
          dataTestId={`view-submission-${id}`}
          ariaLabel={t("View details for submission {{taskName}}", {
            taskName: formName ?? t("unnamed"),
          })}
        />
        </div>
      </td>
    </tr>
  );

  // Header Renderer
  const renderHeaderCell = useCallback(
    (
      column: Column,
      index: number,
      columnsLength: number,
      currentResizingColumn: any,
      handleMouseDown: (
        index: number,
        column: Column,
        e: React.MouseEvent
      ) => void
    ) => {
      const isLast = index === columnsLength - 1;
      const headerKey = column.sortKey || `col-${index}`;

    return (
      <th
        key={`header-${headerKey}`}
        className="header-sortable"
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
   <>
      {/* Left Panel - Collapsible Search Form */}
      <div className="left-panel">
        <CollapsibleSearch
          isOpen={true}
          hasActiveFilters={false}
          inactiveLabel="No Filters"
          activeLabel="Filters Active"
          onToggle={() => { }}
          manageFieldsAction={handleManageFieldsOpen}
          formData={formData}
          dropdownSelection={dropdownSelection}
          setDropdownSelection={setDropdownSelection}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          initialInputFields={initialInputFields}
            onSearch={handleFieldSearch}

        />

      </div>
      
      <div className="page-content">
      {/* Right Panel - Table Container */}
        {/* Top Controls Row - Date Range Picker and Filter/Sort Actions */}
        <div className="table-bar">
          <div className="filters">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              placeholder={t("Filter Created Date")}
              dataTestId="date-range-picker"
              ariaLabel={t("Select date range for filtering")}
              startDateAriaLabel={t("Start date")}
              endDateAriaLabel={t("End date")}
            />
          </div>

          <div className="actions">
            <FilterSortActions
              showSortModal={showSortModal}
              handleFilterIconClick={toggleFilterModal}
              handleRefresh={handlerefresh}
              handleSortModalClose={toggleFilterModal}
              handleSortApply={handleSortApply}
              defaultSortOption={sortParams?.activeKey}
              defaultSortOrder={sortParams?.[sortParams.activeKey]?.sortOrder}
              optionSortBy={optionSortBy.options}
              filterDataTestId="submissiom-list-filter"
              filterAriaLabel={t("Filter the submission list")}
              refreshDataTestId="submission-list-refresh"
              refreshAriaLabel={t("Refresh the submission list")}
              sortModalTitle={t("Sort Tasks")}
              sortModalDataTestId="submission-sort-modal"
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
          className="custom-table-wrapper-outter"
          data-testid="table-container-wrapper"
        >
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
            headerClassName="resizable-header"
            scrollWrapperClassName="table-scroll-wrapper resizable-scroll"
            dataTestId="task-resizable-table"
            ariaLabel={t("submissions data table with resizable columns")}
          />

          {/* Table Footer */}
          {submissions.length > 0 && (
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
          )}
        </div>
      </div>
      {isManageFieldsModalOpen && (
       <ManageFieldsSortModal
        show={isManageFieldsModalOpen}
        onClose={handleManageFieldsClose}
        selectedItem={selectedItem}
        submissionFields={submissionFields}
        setSubmissionFields={setSubmissionFields}
        dropdownSelection={dropdownSelection}
      /> 
      )}
      

    </>
  );
};
export default TaskSubmissionList;
