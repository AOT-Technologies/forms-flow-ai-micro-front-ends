import React, { useRef, useCallback, useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { push } from "connected-react-router";

// Types and Services
import { Submission } from "../types/submissions";

import {
  getSubmissionList,
  fetchAllForms,
  fetchSubmissionList,
  createOrUpdateSubmissionFilter,
  updateDefaultSubmissionFilter,
  fetchFormById,
} from "../api/queryServices/analyzeSubmissionServices";
import { optionSortBy } from "../helper/helper";
import { HelperServices } from "@formsflow/service";

// Redux Actions
import {
  setAnalyzeSubmissionSort,
  setAnalyzeSubmissionPage,
  setAnalyzeSubmissionLimit,
  setAnalyzeSubmissionDateRange,
  setDefaultSubmissionFilter,
  setSelectedSubmisionFilter,
  setSubmissionFilterList,
  setSearchFieldValues,
  clearSearchFieldValues,
  setColumnWidths
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
  VariableModal
} from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../constants";
import ManageFieldsSortModal from "../components/Modals/ManageFieldsSortModal";
import { SystemVariables } from "../constants/variables";

interface Column {
  name: string;
  width: number;
  sortKey: string;
  resizable?: boolean;
  newWidth?: number;
  isFormVariable?: boolean;
}
interface VariableListPayload {
  parentFormId: string ;
  variables: SubmissionField[];
}
interface SubmissionField {
  key: string;
  name: string;
  label: string;
  isChecked: boolean; 
  isFormVariable: boolean;
  sortOrder?: number;
}


const AnalyzeSubmissionList: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState([]);

  // Redux State
  const sortParams = useSelector((state: any) => state?.analyzeSubmission.analyzeSubmissionSortParams ?? {});
  const limit = useSelector((state: any) => state?.analyzeSubmission.limit ?? 10);
  const page = useSelector((state: any) => state?.analyzeSubmission.page ?? 1);
  const tenantId = localStorage.getItem("tenantKey");
  const tenantKey = useSelector((state: any) => state.tenants?.tenantData?.key || tenantId);
  const defaultSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.defaultFilter);
  const selectedSubmissionFilter = useSelector((state: any) => state?.analyzeSubmission?.selectedFilter);
  const redirectUrl = MULTITENANCY_ENABLED ? `/tenant/${tenantKey}/` : "/";
 const filterList = useSelector((state: any) => state?.analyzeSubmission?.submissionFilterList);

  const dateRange = useSelector( (state: any) => state?.analyzeSubmission.dateRange );
  const searchFieldValues = useSelector((state: any) => state?.analyzeSubmission?.searchFieldValues ?? {});
  const columnWidths = useSelector((state: any) => state?.analyzeSubmission?.columnWidths ?? {});
  //local state
  const [isManageFieldsModalOpen, setIsManageFieldsModalOpen] = useState(false);
   const handleManageFieldsOpen = () => setIsManageFieldsModalOpen(true);
  const handleManageFieldsClose = () => setIsManageFieldsModalOpen(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [dropdownSelection, setDropdownSelection] = useState<string | null>(null);
  const [showVariableModal, setShowVariableModal] = React.useState(false);
  const [form, setForm] = React.useState([]);
  const [savedFormVariables, setSavedFormVariables] = useState({});
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [lastFetchedFormId, setLastFetchedFormId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [isFormFetched,setIsFormFetched] =useState(false);
  // Default submission fields constant
  const DEFAULT_SUBMISSION_FIELDS = [
    { key: "id", name: "Submission ID", label: "Submission ID", isChecked: true, isFormVariable: false, type: "hidden",sortOrder:0 },
    { key: "form_name", name: "Form", label: "Form", isChecked: true, isFormVariable: false,  type: "hidden" ,sortOrder:1},
    { key: "created_by", name: "Submitter", label: "Submitter", isChecked: true, isFormVariable: false,  type: "hidden",sortOrder:2 },
    { key: "created", name: "Submission Date", label: "Submission Date", isChecked: true, isFormVariable: false,  type: "hidden",sortOrder:3 },
    { key: "application_status", name: "Status", label: "Status", isChecked: true, isFormVariable: false,  type: "hidden",sortOrder:4 }
  ];
 const [submissionFields, setSubmissionFields] = useState( DEFAULT_SUBMISSION_FIELDS );

  // Wrapper function to reset lastFetchedFormId when dropdown selection changes
  const handleDropdownSelectionChange = useCallback((newSelection: string | null) => {
    dispatch(setAnalyzeSubmissionPage(1));
    if (newSelection !== dropdownSelection) {
      setLastFetchedFormId(null); // Reset the cached form ID when selection changes
       if(newSelection === null){
       dispatch(setDefaultSubmissionFilter(null));
       updateDefaultSubmissionFilter({ defaultSubmissionsFilter: null });
       dispatch(setSelectedSubmisionFilter(null));
      }
    }
    setDropdownSelection(newSelection);
    dispatch(clearSearchFieldValues());
    setFiltersApplied(false);
    setFieldFilters({});
  }, [dropdownSelection]);


const handleClearSearch = () => {
  setFieldFilters({});
  // Clear the search field values globally
  dispatch(clearSearchFieldValues());
};



useEffect(() => {
  const matched = filterList?.find(
    (item) => dropdownSelection === item.parentFormId
  );
  const filter = matched ?? null;

  dispatch(setSelectedSubmisionFilter(filter));
  dispatch(setDefaultSubmissionFilter(filter?.id));
  updateDefaultSubmissionFilter({ defaultSubmissionsFilter: filter?.id });
  setSubmissionFields(filter?.variables ?? DEFAULT_SUBMISSION_FIELDS);
}, [dropdownSelection, filterList]);

useEffect(() => {
  // Update submissionFields when selectedSubmissionFilter changes
  setSubmissionFields(selectedSubmissionFilter?.variables ?? DEFAULT_SUBMISSION_FIELDS);
    if (selectedSubmissionFilter?.variables) {
      // Filter out system fields
      const filtered = selectedSubmissionFilter.variables
      .filter((item) => !systemFields.includes(item.key))
      .map((item)=>{
        const { label,...rest} = item;
        return { ...rest,labelOfComponent:label,altVariable: label}
      });
      // Convert to object with key as property (if that's your structure)
      const obj = {};
      filtered.forEach((v) => {
        obj[v.key] = v;
      });

      setSavedFormVariables(obj);
    } else {
      // When there's no selectedSubmissionFilter or no variables, set to empty object
      setSavedFormVariables({});
    }
  }, [selectedSubmissionFilter]);

useEffect (() => {
  if(!selectedSubmissionFilter?.id){
    setSubmissionFields(DEFAULT_SUBMISSION_FIELDS);
  }
    if(selectedItem === "All Forms") {
      setDropdownSelection(null);
      setSelectedSubmisionFilter(null);
    }
},[dropdownSelection])




const handleFieldSearch = (filters: Record<string, string>) => {
  setFieldFilters(filters);
  dispatch(setAnalyzeSubmissionPage(1));
  setFiltersApplied(true);
  dispatch(setSearchFieldValues(filters));
};

const initialInputFields = useMemo(() => {
  // Use the current submissionFields state for calculation
  const currentFields = selectedSubmissionFilter?.variables ?? submissionFields;

  //these pinned fileds should always come  first in sidebar
  const pinnedOrder = ["id", "created_by", "application_status"];

  // Removing  form name & created date since it is always available
  const filteredVars = currentFields.filter(
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
    value: searchFieldValues[item.key] || "",
  }));
}, [selectedSubmissionFilter, submissionFields, searchFieldValues]);

  useEffect(() => {

    if (!formData.length || dropdownSelection == null) return;

    const selectedForm = formData.find((form) => form.parentFormId === dropdownSelection);
    setSelectedItem(selectedForm?.formName ?? "All Forms");
  }, [defaultSubmissionFilter, filterList, formData]);

  useEffect (() => {
      fetchSubmissionList()
     .then ((res) => {
      const { filters = [] } = res.data || {};
      dispatch(setSubmissionFilterList(filters));
     })
  },[defaultSubmissionFilter])



useEffect(() => {
  // persist previously searched fields
    if (Object.keys(searchFieldValues).length > 0) {
    handleFieldSearch(searchFieldValues); 
  };
  fetchSubmissionList()
    .then((res) => {
      const { filters = [], defaultSubmissionsFilter } = res.data || {};

      dispatch(setSubmissionFilterList(filters));
      dispatch(setDefaultSubmissionFilter(defaultSubmissionsFilter));

      const defaultFilter = filters.find((f) => f.id === defaultSubmissionsFilter);
      if (defaultFilter) {
        dispatch(setSelectedSubmisionFilter(defaultFilter));
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

  // Column width helper function
  const getColumnWidth = useCallback((key: string): number => {
    // Get width from Redux store, fallback to default widths
    if (columnWidths[key]) {
      return columnWidths[key];
    }

    const widthMap: Record<string, number> = {
      created: 180,
      application_status: 160,
    };
    return widthMap[key] ?? 200;
  }, [columnWidths]);


const columns: Column[] = useMemo(() => {
  const sourceFields = selectedSubmissionFilter?.variables?.length
    ? selectedSubmissionFilter.variables
    : DEFAULT_SUBMISSION_FIELDS;


 const dynamicColumns: Column[] = sourceFields
  .filter((item) => item.isChecked)
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  .map((item) => ({
    name: item.label,
    sortKey: item.key,
    width: getColumnWidth(item.key),
    resizable: true,
    isFormVariable: item.isFormVariable ?? false,
  }));

  return [
    ...dynamicColumns,
    {
      name: "",
      sortKey: "actions",
      width: 100,
      resizable: false,
      isFormVariable: false,
    },
  ];
}, [selectedSubmissionFilter, DEFAULT_SUBMISSION_FIELDS, getColumnWidth]);


  const activeSortKey = sortParams.activeKey;
  const activeSortOrder = sortParams?.[activeSortKey]?.sortOrder ?? "asc";

  // Fetch Submissions
const systemFields = ["id", "form_name", "created_by", "created", "application_status"];


const selectedFormFields = useMemo(() => {
  return (selectedSubmissionFilter?.variables ?? [])
    .map((v) => v.key)
    .filter((key) => !systemFields.includes(key));
}, [selectedSubmissionFilter]);



//data for searching data in filter table
const {
  data,
  isLoading: isSubmissionsLoading,
  refetch,
} = useQuery({
  queryKey: [
    "submissions",
    page,
    limit,
    activeSortKey,
    activeSortOrder,
    dateRange,
    dropdownSelection,
    filtersApplied ? fieldFilters : {},
    selectedFormFields
  ],
  queryFn: () =>
    getSubmissionList(
      limit,
      page,
      activeSortOrder,
      activeSortKey,
      dateRange,
      dropdownSelection,
      filtersApplied ? fieldFilters : {},
      selectedFormFields
    ),
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

  //fetch form by id to render in the variable modal and // Check if we already have the form data for this dropdownSelection
  const fetchFormData = useCallback(() => {
    if (!dropdownSelection || (lastFetchedFormId === dropdownSelection)) {
      return;
    }
    setIsFormFetched(true);
    fetchFormById(dropdownSelection)
    .then((res) => {
      setForm(res.data);
      setLastFetchedFormId(dropdownSelection); // update the last fetched form ID to avoid duplicate api calls
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setIsFormFetched(false);
    });
  }, [dropdownSelection, lastFetchedFormId]);
  // taking data from submission response for mapping to the table
  const submissions: Submission[] = data?.submissions ?? [];
  const totalCount: number = data?.totalCount ?? 0;


  // Sort Handler
const handleSort = useCallback((key: string) => {
  const currentOrder = sortParams[key]?.sortOrder || "asc";
  const newOrder = currentOrder === "asc" ? "desc" : "asc";

  const updatedSort = {
    ...sortParams,
    [key]: { sortOrder: newOrder },
    activeKey: key,
  };

  dispatch(setAnalyzeSubmissionSort(updatedSort));
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
 const customTdValue = (value, index, submissionId) => {
  return  <td key={`${submissionId ?? 'no-id'}-${index}-${value ?? 'empty'}`}
              className="custom-td">
            <div className="text-overflow-ellipsis">{value}</div>
          </td>
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

  // Column resize handler for ReusableResizableTable
  const handleColumnResize = useCallback((column: Column, newWidth: number) => {
    // Update Redux column widths
    dispatch(setColumnWidths({ [column.sortKey]: newWidth }));

  }, [dispatch]);


  const toggleFilterModal = () => setShowSortModal(!showSortModal);
  // Row Renderer
const renderRow = (submission: Submission) => {
  const fieldsToRender = (selectedSubmissionFilter?.variables ?? DEFAULT_SUBMISSION_FIELDS)
    .filter((field) => field.isChecked)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <tr key={submission.id}>
      {fieldsToRender.map((field, index) => {
        const { key } = field;

        // Map form variable keys to backend keys
        const fieldKeyMap: Record<string, string> = {
          form_name: "formName",
          created_by: "createdBy",
          application_status: "applicationStatus",
          created: "created",
        };

        const backendKey = fieldKeyMap[key] ?? key;

        //  fallback to submission.data
        const rawValue =
          submission[backendKey as keyof Submission] ??
          submission.data?.[backendKey];

        const value =
          backendKey === "created" ? HelperServices?.getLocalDateAndTime(
                  rawValue
                ) : rawValue;

        return customTdValue(value, index, submission.id);
      })}

      {/* Action column */}
      <td key={`${submission.id}-action`}>
        <div className="text-overflow-ellipsis">
          <CustomButton
            actionTable
            label={t("View")}
            onClick={() =>
              dispatch(push(`${redirectUrl}submissions/${submission.id}`))
            }
            dataTestId={`view-submission-${submission.id}`}
            ariaLabel={t("View details for submission {{taskName}}", {
              taskName: submission.formName ?? t("unnamed"),
            })}
          />
        </div>
      </td>
    </tr>
  );
};



  // Header Renderer
  const renderHeaderCell = useCallback(
    (
      column: Column,
      index: number,
      columnsLength: number,
      currentResizingColumn: any,
      handleMouseDown: (index: number, column: any, e: React.MouseEvent) => void
    ) => {
      const isSortable = column.sortKey !== "actions";
      const isResizable = column.resizable && index < columnsLength - 1;
      const isResizing = currentResizingColumn?.sortkey === column.sortKey;
      const headerKey = column.sortKey || `col-${index}`;

    return (
      <th
        key={`header-${headerKey}`}
        className={`${isSortable ? "header-sortable" : ''}`}
        style={{
          minWidth: `${column.width}px`,
          maxWidth: `${column.width}px`,
          width: `${column.width}px`
        }}
        data-testid={`column-header-${column.sortKey || "actions"}`}
        aria-label={`${t(column.name)} ${t("column")} ${isSortable ? "," + t("sortable") : ""}`}
      >
        {isSortable ? (
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
          <span className="text">
           {t(column.name)}
          </span>
        )}
        {isResizable && (
          <div
            className={`column-resizer ${isResizing ? "resizing" : ""}`}
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

  const handleCloseVariableModal = () => {
    setShowVariableModal(false)
    handleManageFieldsOpen();
  };

  //will wait for the form data to be fetched before opening the modal
  const handleShowVariableModal = () => {
    setShowVariableModal(true);
     fetchFormData(); // Fetch form data when the button is clicked
    handleManageFieldsClose();
    };

  const handleSaveVariables = useCallback(
    (variables) => {
      const prevKeys = Object.keys(savedFormVariables);
      const currentKeys = Object.keys(variables);

      const removedKeys = prevKeys.filter(key => !currentKeys.includes(key));

      // Convert object to array of SubmissionField
      const convertedVariableArray = Object.values(variables).map(
        ({ key, altVariable, labelOfComponent, isFormVariable, type, isChecked }, index) => ({
          key: key,
          name: key,
          label: altVariable || labelOfComponent || key,
          isChecked: isChecked ?? false,
          isFormVariable: isFormVariable,
          sortOrder: submissionFields.length + index + 1,
          type
        })
      );

      setSavedFormVariables(variables);


      // Merge with existing fields and filter to remove duplicates by key
      // ensure the need of filtering submissionfields
      const merged = [
        ...submissionFields.filter(
          (field) =>
            !convertedVariableArray.find(
              (newField) => newField.key === field.key
            ) &&
            !removedKeys.includes(field.key)
        ),
        ...convertedVariableArray,
      ];


      setSubmissionFields(merged);

      // payload interface
      const payload: VariableListPayload = {
        parentFormId: dropdownSelection,
        variables: merged,
      };

      createOrUpdateSubmissionFilter(payload).then((res) => {
        updateDefaultSubmissionFilter({
          defaultSubmissionsFilter: res.data.id,
        });
        dispatch(setDefaultSubmissionFilter(res.data.id));
        dispatch(setSelectedSubmisionFilter(res.data));

      });
    },
    [dispatch, dropdownSelection, DEFAULT_SUBMISSION_FIELDS]
  );

  return (
   <>
      {/* Left Panel - Collapsible Search Form */}
      <div className="left-panel">
        <CollapsibleSearch
          isOpen={true}
          hasActiveFilters={selectedSubmissionFilter  || (dropdownSelection === null && Object.keys(searchFieldValues).length >0)}
          inactiveLabel="No Filters"
          activeLabel="Filters Active"
          onToggle={() => { }}
          manageFieldsAction={handleManageFieldsOpen}
          formData={formData}
          dropdownSelection={dropdownSelection}
          setDropdownSelection={handleDropdownSelectionChange}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          initialInputFields={initialInputFields}
          onSearch={handleFieldSearch}
          onClearSearch={handleClearSearch}
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
              placeholder={t("Filter by Submission Date")}
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
            onColumnResize={handleColumnResize}
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
      {isManageFieldsModalOpen && <ManageFieldsSortModal
        show={isManageFieldsModalOpen}
        onClose={handleManageFieldsClose}
        selectedItem={selectedItem}
        setSubmissionFields={setSubmissionFields}
        submissionFields={DEFAULT_SUBMISSION_FIELDS}
        handleShowVariableModal={handleShowVariableModal}
        dropdownSelection={dropdownSelection}
      />}
      {showVariableModal && <VariableModal
          form={form}
          show={showVariableModal}
          onClose={handleCloseVariableModal}
          primaryBtnAction={handleSaveVariables}
          savedFormVariables={savedFormVariables}
          fieldLabel="Field"
          systemVariables={SystemVariables}
          isLoading={isFormFetched}
        />}

    </>
  );
};
export default AnalyzeSubmissionList;