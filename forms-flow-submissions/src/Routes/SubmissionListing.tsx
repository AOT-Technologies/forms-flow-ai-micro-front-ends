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
  fetchFormById,
  createOrUpdateSubmissionFilter,
  updateDefaultSubmissionFilter,
} from "../api/queryServices/analyzeSubmissionServices";
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
  const [showVariableModal, setShowVariableModal] = React.useState(false);
  const [form, setForm] = React.useState([]);
  const [savedFormVariables, setSavedFormVariables] = useState({});
  const [selectedItem, setSelectedItem] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);


useEffect(() => {
  const matched = filterList?.find(
    (item) => dropdownSelection === item.parentFormId
  );
  const filter = matched ?? null; 

  dispatch(setSelectedSubmisionFilter(filter));
  setSubmissionFields(filter?.variables ?? submissionFields);
}, [dropdownSelection, filterList]);

useEffect(() => {
    if (selectedSubmissionFilter?.variables) {
      // Filter out system fields
      const filtered = selectedSubmissionFilter.variables
      .filter((item) => !systemFields.includes(item.key))
      .map((item)=>{ 
        const { label,...rest} = item;
        return { ...rest,labelOfComponent:label}
      });
      // Convert to object with key as property (if that's your structure)
      const obj = {};
      filtered.forEach((v) => {
        obj[v.key] = v;
      });
      setSavedFormVariables(obj);
    }
  }, [selectedSubmissionFilter]);


useEffect (() => {
  if(!selectedSubmissionFilter?.id){
    setSubmissionFields(submissionFields);
  }
},[dropdownSelection])


  const [submissionFields, setSubmissionFields] = useState( [
          { key: "id", name: "Submission ID", label: "Submission ID", isChecked: true, isFormVariable: false, type: "hidden" },
          { key: "form_name", name: "Form", label: "Form", isChecked: true, isFormVariable: false,  type: "hidden" },
          { key: "created_by", name: "Submitter", label: "Submitter", isChecked: true, isFormVariable: false,  type: "hidden" },
          { key: "created", name: "Submission Date", label: "Submission Date", isChecked: true, isFormVariable: false,  type: "hidden" },
          { key: "application_status", name: "Status", label: "Status", isChecked: true, isFormVariable: false,  type: "hidden" }
        ]);
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  
const handleFieldSearch = (filters: Record<string, string>) => {
  setFieldFilters(filters);
  setFiltersApplied(true);
};
 





const initialInputFields = useMemo(() => {
  setSubmissionFields(selectedSubmissionFilter?.variables ?? submissionFields);
  //these pinned fileds should always come  first in sidebar
  const pinnedOrder = ["id", "created_by", "application_status"];

  // Removing  form name & created date since it is always available
  const filteredVars = submissionFields.filter(
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
}, [selectedSubmissionFilter,dropdownSelection, submissionFields]);
  useEffect(() => {

    if (!formData.length || dropdownSelection == null) return;

    const selectedForm = formData.find((form) => form.parentFormId === dropdownSelection);
    setSelectedItem(selectedForm?.formName ?? "All Forms");
  }, [defaultSubmissionFilter, filterList, formData]);

  useEffect (() => {
    if(selectedItem === "All Forms") {
      setDropdownSelection(null);
      setSelectedSubmisionFilter(null);
    }
  },[dropdownSelection])


useEffect(() => {
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

const columns: Column[] = useMemo(() => {
  const sourceFields = selectedSubmissionFilter?.variables?.length
    ? selectedSubmissionFilter.variables
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
  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  .map((item) => ({
    name: item.label,
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
}, [selectedSubmissionFilter, submissionFields]);


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
  
  //fetch form by id to render in the variable modal
 useEffect(() => {
  if (!dropdownSelection) return;
  fetchFormById(dropdownSelection)
  .then((res) => {
    setForm(res.data);
  })
  .catch((err) => {
    console.error(err);
  });
}, [dropdownSelection]);
const submissions: Submission[] = data?.submissions ?? [];



  const totalCount: number = data?.totalCount ?? 0;
  //map submission keys 
  const mapSubmissionKeys = (submission: Submission, fieldMap: Record<string, string>) => {
  const remapped: Record<string, any> = {};
  for (const [newKey, originalKey] of Object.entries(fieldMap)) {
    remapped[newKey] = submission[originalKey];
  }
  return remapped;
};
const fieldKeyMap: Record<string, string> = {
  id: "id",
  form_name: "formName",
  created_by: "createdBy",
  created: "created",
  application_status: "applicationStatus",
};

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
const renderRow = (submission: Submission) => {
  const fieldsToRender = (selectedSubmissionFilter?.variables ?? submissionFields)
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
          backendKey === "created" ? formatDate(rawValue) : rawValue;

        return customTdValue(value, index);
      })}

      {/* Action column */}
      <td>
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

  const handleCloseVariableModal = () => { 
    setShowVariableModal(false) 
    handleManageFieldsOpen();
  };
  const handleShowVariableModal = () => {
     setShowVariableModal(true) ;
     handleManageFieldsClose();
    };
    
    const handleSaveVariables = useCallback(
      (variables) => {
        setSavedFormVariables(variables);
        // Convert object to array of SubmissionField
        const convertedVariableArray = Object.values(variables).map(
          ({ key, altVariable, labelOfComponent ,isFormVariable, type}, index) => ({
            key: key,
            name: key,
            label: altVariable || labelOfComponent || key,
            isChecked: false,
            isFormVariable: isFormVariable,
            sortOrder: submissionFields.length + index + 1,
            type
          })
        );

        // Merge with existing fields and filter to remove duplicates by key
        // ensure the need of filtering submissionfields
        const merged = [
          ...submissionFields.filter(
            (field) =>
              !convertedVariableArray.find(
                (newField) => newField.key === field.key
              )
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
      [dispatch, dropdownSelection, submissionFields]
    );

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
      {isManageFieldsModalOpen && <ManageFieldsSortModal
        show={isManageFieldsModalOpen}
        onClose={handleManageFieldsClose}
        selectedItem={selectedItem}
        setSubmissionFields={setSubmissionFields}
        submissionFields={submissionFields}
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
        />}

    </>
  );
};
export default TaskSubmissionList;
