import * as React from "react";
import { useCallback, useMemo, useEffect, useState } from "react";
import { useDispatch, useSelector, batch } from "react-redux";
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
  setColumnWidths,
  setSelectedForm
} from "../actions/analyzeSubmissionActions";

// UI Components
import {
  ReusableTable,
  V8CustomButton,
  DateRangePicker,
  SelectDropdown,
  CustomSearch,
  FilterDropDown,
  AddIcon
} from "@formsflow/components";
import { MULTITENANCY_ENABLED } from "../constants";
import ManageFieldsSortModal from "../components/Modals/ManageFieldsSortModal";
import { SystemVariables } from "../constants/variables";
import { setApplicationDetail } from "../actions/applicationActions";

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
  const selectedForm = useSelector((state: any) => state?.analyzeSubmission?.selectedForm);
  const dateRange = useSelector( (state: any) => state?.analyzeSubmission.dateRange );
  const searchFieldValues = useSelector((state: any) => state?.analyzeSubmission?.searchFieldValues ?? {});
  const columnWidths = useSelector((state: any) => state?.analyzeSubmission?.columnWidths ?? {});
  //local state
  const [isManageFieldsModalOpen, setIsManageFieldsModalOpen] = useState(false);
   const handleManageFieldsOpen = useCallback(() => setIsManageFieldsModalOpen(true), []);
  const handleManageFieldsClose = useCallback(() => setIsManageFieldsModalOpen(false), []);
  const [dropdownSelection, setDropdownSelection] = useState<string | null>(null);
  const [form, setForm] = useState([]);
  const [savedFormVariables, setSavedFormVariables] = useState({});
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [lastFetchedFormId, setLastFetchedFormId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState("");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [isFormFetched,setIsFormFetched] =useState(false);
  const [selectedSearchFieldKey, setSelectedSearchFieldKey] = useState<string>("id");
  const [searchFieldFilterTerm, setSearchFieldFilterTerm] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [submissionsData, setSubmissionsData] = useState<{ submissions: Submission[]; totalCount: number }>({
    submissions: [],
    totalCount: 0,
  });
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);

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
    dispatch(setSelectedForm(newSelection));
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


const handleClearSearch = useCallback(() => {
  setFieldFilters({});
  // Clear the search field values globally
  dispatch(clearSearchFieldValues());
}, [dispatch]);



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
 
},[dropdownSelection])




const handleFieldSearch = useCallback((filters: Record<string, string>) => {
  setFieldFilters(filters);
  dispatch(setAnalyzeSubmissionPage(1));
  setFiltersApplied(true);
  dispatch(setSearchFieldValues(filters));
}, [dispatch]);

// When user clears the searched input, clear the applied filters and refresh the table.
useEffect(() => {
  const isSearchCleared = (searchText || "").trim() === "";
  if (isSearchCleared && filtersApplied) {
    setFieldFilters({});
    dispatch(clearSearchFieldValues());
    dispatch(setAnalyzeSubmissionPage(1));
    setFiltersApplied(false);
  }
}, [selectedSearchFieldKey, searchText, filtersApplied]);
// Use the current submissionFields state for calculation
const currentFields = useMemo(() => 
  selectedSubmissionFilter?.variables ?? submissionFields,
  [selectedSubmissionFilter?.variables, submissionFields]
);

const initialInputFields = useMemo(() => {
  //these pinned fileds should always come  first in sidebar
  const pinnedOrder = ["id", "created_by", "application_status"];

  // Removing  form name & created date since it is always available
  const filteredVars = currentFields.filter(
    (item) => item.key !== "form_name" && item.key !== "created" && item.type !== "selectboxes"
  );
  const sortedVars = [
    ...pinnedOrder
      .map((key) => filteredVars.find((item) => item.key === key))
      .filter(Boolean),
    //adding remaining items that are not pinned
    ...filteredVars.filter((item) => !pinnedOrder.includes(item.key)),

  ];

const placeholders: Record<string, string> = {
datetime: "DD-MM-YYYY",
day: "DD/MM/YYYY",
time: "HH:MM",
};

return sortedVars.map((item) => ({
id: item.key,
name: item.key,
type: "text",
label: t(item.label),
value: searchFieldValues[item.key] || "",
placeholder: placeholders[item.type] || "",
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
        const currentForm = formData.find((form) => form.parentFormId === selectedForm);
        dispatch(setSelectedSubmisionFilter(defaultFilter));
        setDropdownSelection(selectedForm ?? defaultFilter.parentFormId);
        setSelectedItem(selectedForm ? currentForm.formName : defaultFilter.name);
       } else {
        const lastSelectedForm = formData?.find((form) => form?.parentFormId === selectedForm) || null;
        setDropdownSelection(selectedForm);
        setSelectedItem(selectedForm?lastSelectedForm.formName : "All Forms");
      }
    })
    .catch((error) => {
      console.error("Error fetching submission list:", error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Keep search field and value with persisted values
useEffect(() => {
  if (searchFieldValues && Object.keys(searchFieldValues).length > 0) {
    const keys = Object.keys(searchFieldValues);
    const firstKey = keys.find((k) => (searchFieldValues as any)[k]) || keys[0];
    if (firstKey) {
      setSelectedSearchFieldKey(firstKey);
      setSearchText(String((searchFieldValues as any)[firstKey] ?? ""));
    }
  }
}, [searchFieldValues]);

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
}, [selectedSubmissionFilter, DEFAULT_SUBMISSION_FIELDS, getColumnWidth, columnWidths]);

// Keep sorting functionality intact while hiding unchecked columns from the table
const columnVisibilityModel = useMemo(() => {
  const sourceFields = selectedSubmissionFilter?.variables?.length
    ? selectedSubmissionFilter.variables
    : DEFAULT_SUBMISSION_FIELDS;

  const model: Record<string, boolean> = {};
  (sourceFields || []).forEach((item: any) => {
    // visible when checked (default to true if undefined)
    model[item.key] = item.isChecked !== false;
  });
  // Always keep actions column visible
  model["actions"] = true;
  return model;
}, [selectedSubmissionFilter, DEFAULT_SUBMISSION_FIELDS]);

  // Ensure default sort is form_name if no activeKey is set
  const activeSortKey = sortParams.activeKey || "form_name";
  const activeSortOrder = sortParams?.[activeSortKey]?.sortOrder ?? "asc";

  // Memoize sortModel to prevent unnecessary re-renders and ensure it updates correctly
  const sortModel = useMemo(() => {
    return activeSortKey
      ? [{ field: activeSortKey, sort: activeSortOrder }]
      : [];
  }, [activeSortKey, activeSortOrder]);

  // Fetch Submissions
const systemFields = useMemo(() => ["id", "form_name", "created_by", "created", "application_status"], []);


const selectedFormFields = useMemo(() => {
  return (selectedSubmissionFilter?.variables ?? [])
    .map((v) => v.key)
    .filter((key) => !systemFields.includes(key));
}, [selectedSubmissionFilter, systemFields]);

const appliedFieldFilters = useMemo(
  () => (filtersApplied ? fieldFilters : {}),
  [filtersApplied, fieldFilters]
);


const fetchSubmissions = useCallback(async () => {
  setIsSubmissionsLoading(true);
  try {
    const response = await getSubmissionList(
      limit,
      page,
      activeSortOrder,
      activeSortKey,
      dateRange,
      dropdownSelection,
      appliedFieldFilters,
      selectedFormFields
    );
    setSubmissionsData({
      submissions: response?.submissions ?? [],
      totalCount: response?.totalCount ?? 0,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    setSubmissionsData({
      submissions: [],
      totalCount: 0,
    });
  } finally {
    setIsSubmissionsLoading(false);
  }
}, [
  limit,
  page,
  activeSortOrder,
  activeSortKey,
  dateRange?.startDate,
  dateRange?.endDate,
  dropdownSelection,
  appliedFieldFilters,
  selectedFormFields,
]);


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
     const matchedForm = formData?.find(
    (item) => dropdownSelection === item.parentFormId    
  );
  const newId = matchedForm?.formId;
    setIsFormFetched(true);
    fetchFormById(newId)
    .then((res) => {
      setForm(res.data);
      setLastFetchedFormId(newId); // update the last fetched form ID to avoid duplicate api calls
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      setIsFormFetched(false);
    });
  }, [dropdownSelection, lastFetchedFormId,formData]);
  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // taking data from submission response for mapping to the table
  const submissions: Submission[] = submissionsData.submissions;
  const totalCount: number = submissionsData.totalCount;

  // Pagination Model for ReusableTable
  const paginationModel = useMemo(() => {
    return { page: page - 1, pageSize: limit };
  }, [page, limit]);

  // Handle Pagination Model Change for ReusableTable  
  const handlePaginationModelChange = useCallback(({ page: dataGridPage, pageSize }: any) => {
    const requestedPage = (dataGridPage ?? 0) + 1;
    const expectedDataGridPage = page - 1;

    if (dataGridPage === expectedDataGridPage && pageSize === limit) {
      return;
    }

    if (limit !== pageSize) {
      batch(() => {
        dispatch(setAnalyzeSubmissionLimit(pageSize));
        dispatch(setAnalyzeSubmissionPage(1));
      });
    } else if (page !== requestedPage) {
      dispatch(setAnalyzeSubmissionPage(requestedPage));
    }
  }, [dispatch, limit, page]);

  const handlerefresh = useCallback(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

 const handleDateRangeChange = useCallback((newDateRange) => {
  const { startDate, endDate } = newDateRange;

  // Update state if:
  // - both dates are selected
  // - OR both are cleared (null)
  const bothSelected = startDate && endDate;
  const bothCleared = !startDate && !endDate;

  if (!(bothSelected || bothCleared)) return;

  batch(() => {
    dispatch(setAnalyzeSubmissionDateRange(newDateRange));
    dispatch(setAnalyzeSubmissionPage(1));
  });
 }, [dispatch]);

 // Reset to default: set form to "All Forms" and clear date range
 const handleResetToDefault = useCallback(() => {
   handleDropdownSelectionChange(null);
   dispatch(setAnalyzeSubmissionDateRange({ startDate: null, endDate: null }));
   dispatch(setAnalyzeSubmissionPage(1));
   setSearchText("");
   setSelectedSearchFieldKey("id");
 }, [dispatch, handleDropdownSelectionChange, setSearchText]);

  // Column resize handler for ReusableTable
  const handleColumnResize = useCallback((column: Column, newWidth: number) => {
    // Update Redux column widths
    dispatch(setColumnWidths({ [column.sortKey]: newWidth }));
  }, [dispatch]);

  // Disable reset if already at defaults
  const isResetDisabled = useMemo(() => {
    const noFormSelected = !dropdownSelection;
    const isDefaultField = selectedSearchFieldKey === "id";
    const noSearch = !searchText || searchText.trim() === "";
    const noDateRange = !dateRange?.startDate && !dateRange?.endDate;
    return noFormSelected && isDefaultField && noSearch && noDateRange;
  }, [dropdownSelection, selectedSearchFieldKey, searchText, dateRange]);
  // Get cell value function for ReusableTable (extracted from renderRow logic)
  const getCellValue = useCallback((column: Column, submission: Submission) => {
    const { sortKey } = column;

    if (sortKey === "actions") {
      return (
        <V8CustomButton
          actionTable
          label={t("View")}
          onClick={() => {
            dispatch(setApplicationDetail({}));
            dispatch(push(`${redirectUrl}submissions/${submission.id}`));
          }}
          dataTestId={`view-submission-${submission.id}`}
          ariaLabel={t("View details for submission {{taskName}}", {
            taskName: submission.formName ?? t("unnamed"),
          })}
        />
      );
    }

  const fieldsToRender = (selectedSubmissionFilter?.variables ?? DEFAULT_SUBMISSION_FIELDS)
    .filter((field) => field.isChecked)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const field = fieldsToRender.find((f) => f.key === sortKey);
    if (!field) return "-";

      const { key } = field;

      // Map form variable keys to backend keys
      const fieldKeyMap: Record<string, string> = {
        form_name: "formName",
        created_by: "createdBy",
        application_status: "applicationStatus",
        created: "created",
      };

      const backendKey = fieldKeyMap[key] ?? key;

    // fallback to submission.data
      const rawValue =
        submission[backendKey as keyof Submission] ??
        submission.data?.[backendKey];
    const matchingField = currentFields.find((col) => col.key === key);

    let value: any;
        if (backendKey === "created") {
      value = HelperServices?.getLocalDateAndTime(rawValue);
    } else if (matchingField?.type === "datetime") {
      value = HelperServices.getLocalDateAndTime(rawValue);
    } else if (matchingField?.type === "checkbox") {
      value = rawValue ? "true" : "false";
    } else if (matchingField?.type === "selectboxes") {
      if (!rawValue || typeof rawValue !== "object") {
        value = "-";
      } else {
        const trueKeys = Object.keys(rawValue).filter((key) => rawValue[key]);
        value = trueKeys.length ? trueKeys.join(", ") : "-";
      }
    } else {
      value = rawValue;
    }

    // Handle tenant name removal for currentUserRoles
    let displayValue = value;
    if (key === "currentUserRoles" && MULTITENANCY_ENABLED && typeof value === "string") {
      const tenantKey = localStorage.getItem("tenantKey") || tenantId;
      if (tenantKey) {
        displayValue = HelperServices.removeTenantFromRoles(value, tenantKey);
      }
    }

    return <div className="text-overflow-ellipsis">{displayValue ?? "-"}</div>;
  }, [selectedSubmissionFilter, currentFields, t, dispatch, push, redirectUrl, DEFAULT_SUBMISSION_FIELDS, tenantId]);



  // Handle sort model change for ReusableTable
  const handleSortModelChange = useCallback((model: any) => {
    // If model is empty, reset to default form_name sort
    if (!model || model.length === 0 || !model[0]?.field) {
      const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);
      const updatedSort = {
        ...resetSortOrders,
        form_name: { sortOrder: "asc" },
        activeKey: "form_name",
      };
      // Reset page to 1 when sort is reset
      batch(() => {
        dispatch(setAnalyzeSubmissionSort(updatedSort));
        dispatch(setAnalyzeSubmissionPage(1));
      });
      return;
    }

    const field = model[0].field;
    const dataGridSort = model[0]?.sort || "asc";
    const resetSortOrders = HelperServices.getResetSortOrders(optionSortBy.options);

    const updatedSort = {
      ...resetSortOrders,
      [field]: { sortOrder: dataGridSort },
      activeKey: field,
    };

    dispatch(setAnalyzeSubmissionSort(updatedSort));
  }, [dispatch, optionSortBy]);

  // Convert columns to MUI DataGrid format
  const muiColumns = useMemo(() => {
    // Filter out actions column from regular columns
    const filteredColumns = columns.filter(col => col.sortKey !== 'actions');

    return [
      ...filteredColumns.map((col, idx) => ({
        field: col.sortKey,
        headerName: t(col.name),
        ...(col.width ? { width: col.width, flex: 0 } : { flex: 1 }),
        sortable: col.sortKey !== "currentUserRoles" ? true : false,
        minWidth: 90,
        headerClassName: idx === filteredColumns.length - 1 ? 'no-right-separator' : '',
        renderCell: (params: any) => getCellValue(col, params.row),
      })),
      // Spacer column to keep the actions column pinned to the far right
      {
        field: "__filler__",
        headerName: "",
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        flex: 1,
        minWidth: 0,
        headerClassName: "",
        cellClassName: "",
        renderCell: () => null,
        valueGetter: () => null,
      },
      {
        field: "actions",
        renderHeader: () => (
          <V8CustomButton
            variant="secondary"
            label={t("Refresh")}
            onClick={handlerefresh}
            dataTestId="task-refresh-button"
          />
        ),
        headerName: "",
        sortable: false,
        filterable: false,
        disableReorder: true,
        resizable: false,
        headerClassName: "sticky-column-header last-column",
        cellClassName: "sticky-column-cell",
        width: 100,
        minWidth: 100,
        maxWidth: 100,
        flex: 0,
        renderCell: (params: any) => getCellValue(
          { ...columns.find(c => c.sortKey === "actions")!, sortKey: "actions" },
          params.row
        ),
      },
    ];
  }, [columns, t, getCellValue]);

  // Memoized rows with proper IDs
  const memoizedRows = useMemo(() => {
    return (submissions || []).map((item, index) => ({
      ...item,
      id: item.id || (item as any)._id || `row-${index}`,
    }));
  }, [submissions]);

  // Ensure form data is available while manage fields modal is open
  useEffect(() => {
    if (isManageFieldsModalOpen) {
      fetchFormData();
    }
  }, [isManageFieldsModalOpen, fetchFormData]);

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
  // Build categorized search field dropdown items (action + system fields + form specific)
  const searchFieldDropdownItems = useMemo(() => {
    const items: any[] = [];
    const noFilter = {
      content: <em>{t("No Results found")}</em>,
      onClick: () => {},
      type: "none",
      dataTestId: "no-variables-found",
      ariaLabel: t("No Results available"),
      category: "none",
    };

    // Action: Add additional fields + (only when a form is selected)
    if (dropdownSelection) {
      items.push({
        content: (
          <div className="d-flex align-items-center justify-content-between">
            <span>{t("Add additional fields")}</span> <AddIcon />
          </div>
        ),
        onClick: () => {
          handleManageFieldsOpen();
        },
        type: "add-fields",
        dataTestId: "add-additional-fields",
        ariaLabel: t("Add additional fields"),
        category: "action",
      });
    }

    const available = (selectedSubmissionFilter?.variables ?? DEFAULT_SUBMISSION_FIELDS) as any[];
    const labelByKey: Record<string, string> = {};
    (available || []).forEach((f) => {
      labelByKey[f.key] = f.label || f.name || f.key;
    });

    const term = (searchFieldFilterTerm || "").toLowerCase();

    // System fields: use fixed display order; no reordering within category
    const systemOrder = ["id", "created_by", "application_status"];
    const sysItems = systemOrder
      .map((key) => (available || []).find((f) => f.key === key && f?.isFormVariable !== true))
      .filter(Boolean)
      // Exclude fields not needed in the picker (form_name, created already excluded by order list)
      .filter((f: any) => (labelByKey[f.key] || f.key).toLowerCase().includes(term))
      .map((f: any) => ({
        className: f.key === selectedSearchFieldKey ? "selected-filter-item" : "",
        content: <span>{t(labelByKey[f.key])}</span>,
        type: String(f.key),
        onClick: () => setSelectedSearchFieldKey(f.key),
        dataTestId: `field-item-${f.key}`,
        ariaLabel: t("Select field {{fieldName}}", { fieldName: t(labelByKey[f.key]) }),
        category: "system",
      }));

    const formItems = (available || [])
      .filter((f) => f?.isFormVariable === true) // form specific fields
      .filter((f) => (labelByKey[f.key] || f.key).toLowerCase().includes(term))
      .map((f) => ({
        className: f.key === selectedSearchFieldKey ? "selected-filter-item" : "",
        content: <span>{t(labelByKey[f.key])}</span>,
        type: String(f.key),
        onClick: () => setSelectedSearchFieldKey(f.key),
        dataTestId: `field-item-${f.key}`,
        ariaLabel: t("Select field {{fieldName}}", { fieldName: t(labelByKey[f.key]) }),
        category: "form",
      }));

    items.push(...sysItems, ...formItems);

    // Show "No filters found" when no search results found
    const isSearching = term.trim().length > 0;
    if (isSearching && sysItems.length + formItems.length === 0) {
      items.push(noFilter);
    }
    return items;
  }, [
    t,
    selectedSubmissionFilter,
    DEFAULT_SUBMISSION_FIELDS,
    selectedSearchFieldKey,
    searchFieldFilterTerm,
    dropdownSelection,
  ]);
  return (
   <>
      <div className="analyze-submissions-page">
      <div className="Toastify"></div>
      <div className="toast-section">{}</div>
      <div className="header-section-1">
        <div className="section-seperation-left">
          <h4> Submissions </h4>
        </div>  
      </div>
      <div className="header-section-2 overflow-visible">
        <div className="section-seperation-left">
          {(() => {
            const formOptions = [
              { label: t("All Forms"), value: "" },
              ...(formData || []).map((f: any) => ({
                label: f?.formName ?? "",
                value: f?.parentFormId ?? "",
              })),
            ];
            const currentValue = dropdownSelection ?? "";
            const onDropdownChange = (val: string | number) => {
              const v = String(val);
              handleDropdownSelectionChange(v === "" ? null : v);
              // Reset search field picker to default when form selection changes
              setSelectedSearchFieldKey("id");
              setSearchText("");
            };
            return (
              <>
                <SelectDropdown
                  options={formOptions}
                  value={currentValue}
                  defaultValue=""
                  onChange={onDropdownChange}
                  ariaLabel={t("Select a form")}
                  dataTestId="submission-form-select"
                  id="submission-form-select"
                  variant="secondary"
                  searchDropdown
                  searchable
                  customSearchPlaceholder={t("Search all forms")}
                />
                <FilterDropDown
                  label={t(((selectedSubmissionFilter?.variables ?? DEFAULT_SUBMISSION_FIELDS)?.find((f: any) => f.key === selectedSearchFieldKey)?.label) || "Submission ID")}
                  items={searchFieldDropdownItems}
                  searchable={true}
                  searchPlaceholder={t("Search fields")}
                  onSearch={(term: string) => setSearchFieldFilterTerm(term)}
                  dataTestId="analyze-search-filter-dropdown"
                  ariaLabel={t("Select field to search")}
                  className="input-filter"
                  variant="task"
                  categorize={true}
                  categoryLabels={{ system: t("System fields"), form: t("Form specific fields") }}
                  categoryOrder={["action", "system", "form"]}
                  stickyActions={true}
                />
                <div className="medium-search-container">
                <CustomSearch
                  search={searchText}
                  setSearch={setSearchText}
                  handleSearch={() => handleFieldSearch({ [selectedSearchFieldKey]: searchText })}
                  placeholder={t("Search")}
                  dataTestId="submission-search-input"
                />
                </div>
                
              </>
            );
          })()}
        </div>
      </div>
      <div className="header-section-3 overflow-visible">
        <div className="section-seperation-left">
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
        <div className="section-seperation-right">          
       
              <V8CustomButton
              label={t("Reset to default")}
              onClick={handleResetToDefault}
              dataTestId="reset-to-default-button"
              ariaLabel={t("Reset to default")}
              disabled={isResetDisabled}
              secondary
              />
        </div>
      </div>
  
     
      
        <div className="body-section">
        <div
          className="custom-table-wrapper-outter-submissions"
          data-testid="table-container-wrapper"
        >
          <ReusableTable
            columns={muiColumns}
            rows={memoizedRows}
            rowCount={totalCount}
            loading={isSubmissionsLoading}
            disableColumnResize={false}
            paginationMode="server"
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={handleSortModelChange}
            noRowsLabel={t(
                "No submissions have been found. Try a different filter combination or contact your admin."
              )}
            disableColumnMenu
            disableRowSelectionOnClick
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            pageSizeOptions={[10, 25, 50, 100]}
            dataGridProps={{
              getRowId: (row: any) => row.id || (row as any)._id,
              onColumnWidthChange: (params: any) => {
                try {
                  const field = params?.colDef?.field || params?.field;
                  const width = params?.width;
                  if (!field || !width) return;
                  const column = columns.find((col) => col.sortKey === field);
                  if (column && handleColumnResize) {
                    handleColumnResize(column, width);
                  }
                } catch (e) {
                  // no-op
                }
              },
              columnVisibilityModel: columnVisibilityModel,
            }}
            enableStickyActions={true}
            disableVirtualization
            autoHeight={true}
          />
        </div>
       </div>
       </div>
      {isManageFieldsModalOpen && <ManageFieldsSortModal
        show={isManageFieldsModalOpen}
        onClose={handleManageFieldsClose}
        selectedItem={selectedItem}
        setSubmissionFields={setSubmissionFields}
        submissionFields={DEFAULT_SUBMISSION_FIELDS}
        dropdownSelection={dropdownSelection}
        form={form}
        savedFormVariables={savedFormVariables}
        setSavedFormVariables={setSavedFormVariables}
        isFormFetched={isFormFetched}
      />}

    </>
  );
};
export default AnalyzeSubmissionList;