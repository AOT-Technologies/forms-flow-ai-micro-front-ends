import { useState, useMemo, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import {
  AppModal,
  DragandDropSort,
  useSuccessCountdown,
  V8CustomButton,
  SelectDropdown,
  QuickFilterIcon,
} from "@formsflow/components";
import { removeTenantKey, trimFirstSlash, addTenantPrefixIfNeeded } from "../../helper/helper";
import {
  ACCESSIBLE_FOR_ALL_GROUPS,
  MULTITENANCY_ENABLED,
  PRIVATE_ONLY_YOU,
  SPECIFIC_USER_OR_GROUP,
} from "../../constants/index";
import { useSelector, useDispatch } from "react-redux";
import { useAppDispatch } from "../../hooks";
import {
  fetchAllForms,
  fetchBPMTaskCount,
  fetchServiceTaskList,
  fetchTaskVariables,
  getUserRoles,
  createFilter,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import {
  setBPMFilterList,
  setDefaultFilter,
  setFilterToEdit,
  setIsUnsavedFilter,
  setSelectedFilter,
  setUserGroups,
} from "../../actions/taskActions";
import { Filter, FilterCriteria, UserDetail } from "../../types/taskFilter";
import { defaultTaskVariable } from "../../constants/defaultTaskVariable";
import ParametersTab from "./ParametersTab";
import SaveFilterTab from "./SaveFilterTab";
import { RootState } from "../../reducers";
import { useParams } from "react-router-dom";
const TaskFilterModalBody = ({
  showTaskFilterMainModal,
  closeTaskFilterMainModal,
  toggleDeleteModal,
  toggleUpdateModal,
  filterToEdit,
  deleteSuccess,
  updateSuccess,
  handleFilterUpdate,
  currentStep,
  onStepChange,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isQuickFilterEdit = !!filterToEdit?.isQuickFilter;
  const isCreating = !filterToEdit?.id && !isQuickFilterEdit;
  const [introTypeSelection, setIntroTypeSelection] = useState<string>("quickFilter");
  const [introAccessSelection, setIntroAccessSelection] = useState<string>("privateFilter");

  const isQuickFilterMode = isCreating && introTypeSelection === "quickFilter";
  const isQuickFilterFlow = isQuickFilterMode || isQuickFilterEdit;

  // When creating a filter, use the intro page
  useEffect(() => {
    if (!isCreating) return;
    if (introAccessSelection === "sharedFilter") {
      // "For myself and others" → preselect "Specific role"
      setShareFilter(SPECIFIC_USER_OR_GROUP);
    } else if (introAccessSelection === "privateFilter") {
      // "For me" → keep it private by default
      setShareFilter(PRIVATE_ONLY_YOU);
      setShareFilterForSpecificRole("");
    }
  }, [isCreating, introAccessSelection]);

  const handleIntroTypeSelect = (next: string) => {
    setIntroTypeSelection(next);
    // If "Find something now" is selected, the shared access option is not allowed.
    if (next === "quickFilter" && introAccessSelection === "sharedFilter") {
      setIntroAccessSelection("privateFilter");
    }
  };

  const renderIntroDescription = (opt: {
    description?: string;
    descriptionLines?: string[];
  }) => {
    if (opt.descriptionLines?.length) {
      return (
        <>
          {opt.descriptionLines.map((line, idx) => (
            <Fragment key={`${idx}-${line}`}>
              {line}
              {idx < opt.descriptionLines!.length - 1 ? <br /> : null}
            </Fragment>
          ))}
        </>
      );
    }
    return opt.description ?? "";
  };

  const {
    userGroups: candidateGroups = { data: [] },
    isUnsavedFilter,
    filterList,
    userDetails = {} as UserDetail,
  } = useSelector((state: RootState) => state.task);
  const selectedFilter = useSelector((state: RootState) => (state as any).task.selectedFilter);

  const [accessValue, setAccessValue] = useState("");
  const selectedFilterExistingData = filterList.find((i)=> i?.id === filterToEdit?.id);
  const [variableArray, setVariableArray] = useState(
    selectedFilterExistingData?.variables || filterToEdit?.variables || defaultTaskVariable
  );
  const { successState, startSuccessCountdown } = useSuccessCountdown();

  const [forms, setForms] = useState([]);

  const [filterName, setFilterName] = useState(filterToEdit?.name || "");

  const [sortValue, setSortValue] = useState("created");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dataLineValue, setDataLineValue] = useState(1);

  const [shareFilter, setShareFilter] = useState(PRIVATE_ONLY_YOU);
  const [shareFilterForSpecificRole, setShareFilterForSpecificRole] =
    useState("");

  const [selectedForm, setSelectedForm] = useState({
    formId: "",
    formName: "",
  });

  const [showFormSelectionModal, setShowFormSelectionModal] = useState(false);
  const { tenantId } = useParams();
  const tenantKey = useSelector((state: any) => state.tenants?.tenantData?.tenantkey || tenantId || state.tenants?.tenantData?.key);
  const SPECIFIC_ROLE = "specificRole";
  const SPECIFIC_ASSIGNEE = "specificAssignee";
  const CURRENT_USER = "currentUser";
  const [accessOption, setAccessOption] = useState(CURRENT_USER);
  const [isTaskFilterSaving, setIsTaskFilterSaving] = useState(false);


  const changeAcessOption = (option: string) => {
    setAccessOption(option);
    if (option !== accessOption) {
      setAccessValue("");
    }
  };

  const toggleFormSelectionModal = () => {
    setShowFormSelectionModal((prev) => !prev);
  };

  const handleFormSelectionClear = () => {
    setVariableArray(defaultTaskVariable);
    setSelectedForm({ formId: "", formName: "" });
  };

  const getCriteria = () => {
    const criteria: FilterCriteria = {
      "orQueries": [
        {
          "assigneeExpression": "${currentUser()}",
          "candidateGroupsExpression": "${currentUserGroups()}",
          "includeAssignedTasks": true
        }
      ],
      // If sorting is based on submission id or form name, that should be passed as process variable in sorting
      sorting: sortValue === "applicationId" || sortValue === "formName" ?
        ([{
          sortBy: "processVariable", sortOrder: sortOrder,
          "parameters": { "variable": sortValue, "type": sortValue === "applicationId" ? "integer" : "string" }
        }]) :
        [{ sortBy: sortValue, sortOrder: sortOrder }],
    };

    

    if (selectedForm?.formId) {
      criteria.processVariables = [];
      criteria.processVariables.push({
        name: "formId",
        operator: "eq",
        value: selectedForm.formId,
      });
    }

    if (accessOption === SPECIFIC_ROLE) {
      const trimmedAccessValue = trimFirstSlash(accessValue);
      criteria.candidateGroup = addTenantPrefixIfNeeded(
        trimmedAccessValue,
        tenantKey,
        MULTITENANCY_ENABLED
      );
      delete criteria.assignee;
      delete criteria.orQueries;
    } else if(accessOption === SPECIFIC_ASSIGNEE){
      criteria.assignee = accessValue;
      delete criteria.candidateGroup;
      delete criteria.orQueries;
    }
    else{
      delete criteria.assignee;
      delete criteria.candidateGroup;
    }

    return criteria;
  };

 const handleFilterAccess = () => {
  let users = [];
  let roles = [];

  if (shareFilter === PRIVATE_ONLY_YOU) {
    users.push(userDetails?.preferred_username);
  } else if (shareFilter === SPECIFIC_USER_OR_GROUP) {
    roles = Array.isArray(shareFilterForSpecificRole)
      ? shareFilterForSpecificRole
      : [shareFilterForSpecificRole];
  }

  return { users, roles };
};


  const getData = (): Filter => ({
    created: filterToEdit?.created,
    modified: filterToEdit?.modified,
    id: filterToEdit?.id,
    tenant: filterToEdit?.tenant,
    name: filterName,
    criteria: getCriteria(),
    variables: variableArray.map((v:any) => {
      // Preserve variables from the filter being edited (not the globally selected filter)
      const sourceVars =
      selectedFilter ?.variables ||
        selectedFilterExistingData?.variables ||
        filterToEdit?.variables ||
        [];
        const match = sourceVars.find(
          (sv:any) =>
            sv?.key === v?.key &&
            sv?.isFormVariable === v?.isFormVariable
        );
        return typeof match?.width === "number" ? { ...v, width: match.width } : v;
    }),
    properties: {
      displayLinesCount: dataLineValue,
      formId: selectedForm.formId,
    },
    ...handleFilterAccess(),
    status: filterToEdit?.status,
    createdBy: filterToEdit?.createdBy,
    modifiedBy: filterToEdit?.modifiedBy,
    hide: filterToEdit?.hide,
    filterType: "TASK",
    editPermission: filterToEdit?.editPermission,
    sortOrder: filterToEdit?.sortOrder,
  });

  const handleFilterName = (value) => setFilterName(value);

  const handleSorting = (sorting) => {
    if (sorting?.length > 0) {
      const [sort] = sorting;
      setSortValue(sort.sortBy === "processVariable" ?sort.parameters.variable :sort.sortBy);
      setSortOrder(sort.sortOrder); 
    }
  };

  const handleShareFilter = (roles, users) => {
    if (roles.length > 0) {
      setShareFilter(SPECIFIC_USER_OR_GROUP);
    } else if (users.length > 0) {
      setShareFilter(PRIVATE_ONLY_YOU);
    } else {
      setShareFilter(ACCESSIBLE_FOR_ALL_GROUPS);
    }
  };

  /* -------------------- set values for editing the filter ------------------- */
  useEffect(() => {
    if (!filterToEdit) return;

    // For normal edit, prefer the persisted filter from list (it has sharing fields like roles/users).
    // For "Edit Quick Filter", there is no persisted filter; use `filterToEdit` directly.
    const source = filterToEdit?.isQuickFilter ? filterToEdit : selectedFilterExistingData;
    if (!source) return;

    const { roles = [], users = [], criteria = {}, properties = {} } = source;
    const { assignee, sorting, candidateGroup } = criteria;
    const cleanedRoles = roles.map((role) =>
      removeTenantKey(role, tenantKey, MULTITENANCY_ENABLED)
    );
    setShareFilterForSpecificRole(cleanedRoles);
    let accessOption;
    let accessValue;

    if (assignee) {
      accessOption = SPECIFIC_ASSIGNEE;
      accessValue = assignee;
    } else if (candidateGroup) {
      accessOption = SPECIFIC_ROLE;
      accessValue = removeTenantKey(candidateGroup,tenantKey,MULTITENANCY_ENABLED);
    } else {
      accessOption = CURRENT_USER;
      accessValue = "";
    }

    setAccessOption(accessOption);
    setAccessValue(accessValue);

    handleSorting(sorting);
    handleShareFilter(roles, users);
    setDataLineValue(properties?.displayLinesCount ?? 1);
  }, [filterToEdit]);

  /* -------- handling already selected forms when after forms fetching ------- */
  useEffect(() => {
    const savedId = filterToEdit?.properties?.formId || selectedFilterExistingData?.properties?.formId;
    if (!savedId) return;

    // Seed selection early so child modal can show preselection
    if (!forms.length) {
      if (String(selectedForm.formId || "") !== String(savedId)) {
        setSelectedForm({ formId: savedId, formName: "" });
      }
      return;
    }

    // Resolve proper form object and name from the list
    const idStr = String(savedId);
    const matchedForm = forms.find((form:any) =>
      [form?.formId, form?.parentFormId, form?._id, form?.id]
        .filter((v:any) => v !== undefined && v !== null)
        .map((v:any) => String(v))
        .includes(idStr)
    );

    if (matchedForm) {
      const resolvedId = matchedForm.formId ?? matchedForm.parentFormId ?? matchedForm._id ?? matchedForm.id;
      const resolvedName = matchedForm.formName || matchedForm.name || "";
      setSelectedForm({ formId: resolvedId, formName: resolvedName });
      handleFetchTaskVariables(resolvedId);
    }
  }, [filterToEdit, selectedFilterExistingData, forms.length]);

  /* ------------------- fetching all form from webapi side ------------------- */
  useEffect(() => {
    if (showTaskFilterMainModal) {
      fetchAllForms()
        .then((res) => {
          const allForms = res.data?.forms ?? [];
          const data = selectedFilter?.name === "All Tasks"
            ? allForms
            : allForms.filter((f: any) => f.formType === "form");
          setForms(data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [showTaskFilterMainModal]);

  /* ---------------------------- get users groups ---------------------------- */
  useEffect(() => {
    getUserRoles()
      .then((res) => res && dispatch(setUserGroups(res.data)))
      .catch((error) => console.error("error", error));
  }, []);

const candidateOptions = useMemo(() => {
  return candidateGroups.reduce((acc, group) => {
    if (!group.permissions.includes("view_filters")) return acc;
    const label = removeTenantKey(group.name, tenantKey, MULTITENANCY_ENABLED)
    acc.push({ value: group.name, label });
    return acc;
  }, []);
}, [candidateGroups, MULTITENANCY_ENABLED, tenantKey]);


  const createSortByOptions = (labelKey, value) => ({
    label: t(labelKey),
    value,
  });

  const dateSortOptions = [
    createSortByOptions("Created Date", "created"),
    createSortByOptions("Assignee", "assignee"),
    createSortByOptions("Task", "name"),
    createSortByOptions("Form Name", "formName"),
    createSortByOptions("Submission ID", "applicationId"),
  ];

  const createSortOrderOptions = (ascLabel, descLabel) => [
    { label: t(ascLabel), value: "asc" },
    { label: t(descLabel), value: "desc" },
  ];

  const sortOptions = {
    created: createSortOrderOptions("Oldest to Newest", "Newest to Oldest"),
    assignee: createSortOrderOptions("A to Z", "Z to A"),
    name: createSortOrderOptions("A to Z", "Z to A"),
    formName: createSortOrderOptions("A to Z", "Z to A"),
    applicationId: createSortOrderOptions(
      "Smallest to Largest",
      "Largest to Smallest"
    ),
  };

  const dataLineCount = Array.from({ length: 5 }, (_, i) => {
    const value = (i + 1).toString();
    return { label: value, value, onClick: () => setDataLineValue(i + 1) };
  });

 const isDuplicateVariable = (taskVar, existingVars) => {
  return existingVars.some(
    (existingVar) =>
      existingVar.key === taskVar.key && existingVar.label === taskVar.label
  );
};

const isValidVariableType = (taskVar) => {
  return taskVar.type !== "hidden" ;
};

const createVariableFromTask = (variable, baseIndex, isChecked = true) => ({
  ...variable,
  name: variable.key,
  isChecked,
  sortOrder: baseIndex + 1,
  isFormVariable: true,
});

const findExistingVariable = (variables, targetVar) => {
  return variables.find(
    v => v.key === targetVar.key && v.label === targetVar.label
  );
};

const removeDuplicateVariables = (variables) => {
  return variables.filter((variable, index, self) =>
    index === self.findIndex(v => v.key === variable.key && v.label === variable.label)
  );
};

const transformToDynamicVariables = (taskVariables, existingVars) => {
  return taskVariables
    .filter(taskVar => 
      isValidVariableType(taskVar) && 
      !isDuplicateVariable(taskVar, existingVars)
    )
    .map((variable, index) => 
      createVariableFromTask(variable, existingVars.length + index)
    );
};



const processNewFilterMode = (taskVariables, defaultTaskVariable) => {
  const dynamicVariables = transformToDynamicVariables(taskVariables, defaultTaskVariable);
  return [...defaultTaskVariable, ...dynamicVariables];
};

const handleFetchTaskVariables = (formId) => {
  fetchTaskVariables(formId)
    .then((res) => {
      const taskVariables = res.data?.taskVariables || [];
      // Determine if we are editing an existing filter with the same form
      const savedFormId =
        filterToEdit?.properties?.formId ||
        selectedFilterExistingData?.properties?.formId;
      const isEditingWithSameForm =
        !!filterToEdit?.id &&
        savedFormId  &&
        String(savedFormId) === String(formId);

      // Always prefer latest saved filter state for existing variables (preserve isChecked and sortOrder)
      const sourceVars =
        selectedFilterExistingData?.variables || filterToEdit?.variables || [];
      let combinedVars;

      if (isEditingWithSameForm) {
        // Get current task variable keys for comparison
        const currentTaskVariableKeys = taskVariables
          .filter(taskVar => isValidVariableType(taskVar))
          .map(taskVar => taskVar.key);
        
        // Filter out deleted form variables from existing filter
        const existingFormVariables = (sourceVars?.filter(v => v.isFormVariable) || [])
          .filter(existingVar => currentTaskVariableKeys.includes(existingVar.key));
        
        // Get default variables with existing values preserved
        const defaultVars = defaultTaskVariable.map(defaultVar => {
          const existingVar = findExistingVariable(sourceVars || [], defaultVar);
          return existingVar || defaultVar;
        });
        
        // Process new dynamic variables
        const newDynamicVariables = taskVariables
          .filter(taskVar => 
            isValidVariableType(taskVar) && 
            !isDuplicateVariable(taskVar, defaultTaskVariable)
          )
          .map((variable, index) => {
            const existingVar = findExistingVariable(existingFormVariables, variable);
            
            return createVariableFromTask(
              variable,
              existingVar ? existingVar.sortOrder - 1 : defaultTaskVariable.length + existingFormVariables.length + index,
              existingVar ? existingVar.isChecked : false
            );
          });

        // Combine and deduplicate
        const allFormVariables = [...existingFormVariables, ...newDynamicVariables];
        const uniqueFormVariables = removeDuplicateVariables(allFormVariables);
        
        combinedVars = [...defaultVars, ...uniqueFormVariables];
      } else {
        // Preserve default/system variables' saved state even when not the same form
        const preservedDefaultVars = defaultTaskVariable.map(defaultVar => {
          const existingVar = findExistingVariable(sourceVars || [], defaultVar);
          return existingVar || defaultVar;
        });

        const dynamicVariables = transformToDynamicVariables(taskVariables, preservedDefaultVars);
        combinedVars = [...preservedDefaultVars, ...dynamicVariables];
      }

      // Ensure UI reflects persisted ordering
      const sortedVars = [...combinedVars].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      );

      setVariableArray(sortedVars);
    })
    .catch((err) => console.error(err));
};

  // need to check if this function is used anywhere else
  const handleUpdateOrder = (updatedItems) => {
    setVariableArray(updatedItems);
  };

  // fetching task list with current filter with reset page and limit
  const fetchTaskList = () => {
    dispatch(
      fetchServiceTaskList(getData(), null, 1, 15, (error) => {
        if (error) {
          console.error("Error fetching tasks:", error);
          return;
        }
      })
    );
  };
  //handling filter result after clicking on filter result button
  const filterResults = () => {
    // keeping latest data with unsaved true
    dispatch(setSelectedFilter({ ...getData() }));
    dispatch(setIsUnsavedFilter(true));
    dispatch(setDefaultFilter(null)); // need to set this value null because if we need to select original filter it should work
    closeTaskFilterMainModal();
    fetchTaskList();
  };

  /* -------------------- handling create or update filter -------------------- */
  const handleSaveFilter = async () => {
    try {
      setIsTaskFilterSaving(true);
      const res = await createFilter(getData());
      const updatedFilterList = [...filterList, res.data];
      dispatch(setBPMFilterList(updatedFilterList));
      startSuccessCountdown(closeTaskFilterMainModal, 2);
      dispatch(fetchBPMTaskCount(updatedFilterList));
      dispatch(setDefaultFilter(res.data.id));
      updateDefaultFilter(res.data.id);
    } catch (error) {
      console.error("Error saving filter:", error);
    } finally {
      setIsTaskFilterSaving(false);
      closeTaskFilterMainModal();
    }
  };

  const handleFormSelection = (selectedFormObj) => {
    setSelectedForm(selectedFormObj);
    handleFetchTaskVariables(selectedFormObj.formId);
    toggleFormSelectionModal();
  };

  const handleUpdateModalClick = async () => {
    const isPrivate = filterToEdit?.users?.length!==0;
    const data = getData();
    try {
      setIsTaskFilterSaving(true);
      if(isPrivate){
        await handleFilterUpdate(isPrivate,data);
      }else{
        dispatch(setFilterToEdit(data));
        toggleUpdateModal();
      }
    } catch (error) {
      console.error("Error updating filter:", error);
    } finally {
      setIsTaskFilterSaving(false);
      closeTaskFilterMainModal();
    }
  };

  const handleDeleteClick = () => {
    dispatch(setFilterToEdit(getData()));
    toggleDeleteModal();
  };

  // disable filter button when all variable array value unchecked or previous filter and current filter are same
  const isFilterSame = isUnsavedFilter
    ? false
    : isEqual(getData(), selectedFilterExistingData);
  const isVariableArrayEmpty = variableArray.every((item) => !item.isChecked);
  const disableFilterButton = isVariableArrayEmpty || isFilterSame;

  const hasSelectedSpecificRole =
    shareFilter === SPECIFIC_USER_OR_GROUP &&
    (Array.isArray(shareFilterForSpecificRole)
      ? shareFilterForSpecificRole.length > 0
      : !!shareFilterForSpecificRole);

  const saveFilterButtonDisabled =
    !filterName || 
    ((accessOption !== CURRENT_USER) && !accessValue) ||
    !accessOption ||
    (shareFilter === SPECIFIC_USER_OR_GROUP && !hasSelectedSpecificRole) ||
    (filterToEdit?.id ? disableFilterButton : isVariableArrayEmpty);
  /* ------------------------------- tab values ------------------------------- */
  const columnsTab = () => (
    <>
      
      {variableArray.length !== 0 && (
        <div >
           <DragandDropSort
          key={variableArray.length}
          items={variableArray}
          onUpdate={handleUpdateOrder}
          data-testid="columns-sort"
        />
        </div>
       
      )}
    </>
  );

  const settingsTab = () => (
    <>
      <p className="dropdown-label-text">{t("Choose a default sort")}</p>
      <SelectDropdown
        options={dateSortOptions}
        dependentOptions={sortOptions}
        secondDropdown={true}
        defaultValue={sortValue}
        secondDefaultValue={sortOrder}
        onChange={(v) => setSortValue(String(v))}
        onSecondChange={(v) => setSortOrder(String(v))}
        ariaLabel={t("Default Sort")}
        dataTestId="date-sort"
        id="default-sort"
        variant="secondary"
      />
      
      <p className="dropdown-label-text">{t("How Many Lines of Data To Show Per Row")}</p>
      <div className="lines-count-container">
      <SelectDropdown
        options={dataLineCount.map(({ label, value }) => ({ label, value }))}
        value={String(selectedFilterExistingData?.properties?.dataLineValue || dataLineValue)}
        onChange={(v) => setDataLineValue(Number(v))}
        ariaLabel={t("How Many Lines of Data To Show Per Row")}
        dataTestId="data-line"
        id="how-many-lines-of-data-to-show-per-row"
        variant="secondary"
      />
      </div>
      
    </>
  );

  // Build access controls UI for step 2 
  const taskUserList = useSelector((state: any) => state.task.userList);
  const userListData = taskUserList?.data ?? [];
  const assigneeOptions = userListData.map((user) => ({ value: user.username, label: user.username }));

  const renderAccessControls = () => (
    <>
    <div>
    <p className="dropdown-label-text">Tasks Accessible To</p> 
      <SelectDropdown
      options={[
        { label: t("Current user"), value: "currentUser" },
        { label: t("Specific role"), value: "specificRole" },
        { label: t("Specific assignee"), value: "specificAssignee" },
      ]}
      dependentOptions={{
        specificRole: candidateOptions,
        specificAssignee: assigneeOptions,
      }}      
      secondDropdown={true}
      defaultValue={accessOption}
      secondDefaultValue={accessValue}
      onChange={(v) => changeAcessOption(String(v))}
      onSecondChange={(v) => setAccessValue(String(v))}
      ariaLabel={t("Tasks Accessible To")}
      dataTestId="access-options"
      id="tasks-accessible-to"
      variant="secondary"
    />
    </div>     
    </>
  );

  const tabs = [
    {
      eventKey: "parametersTab",
      title: t("Parameters"),
      content: (
        <ParametersTab
          forms={forms}
          selectedForm={selectedForm}
          toggleFormSelectionModal={toggleFormSelectionModal}
          handleFormSelection={handleFormSelection}
        />
      ),
    },
    { eventKey: "columnsTab", title: t("Columns"), content: columnsTab() },
    { eventKey: "settingsTab", title: t("Settings"), content: settingsTab() },
    {
      eventKey: "saveFilterTab",
      title: t("Save"),
      content: (
        <SaveFilterTab
          deleteSuccess={deleteSuccess}
          filterToEdit={filterToEdit}
          successState={
            updateSuccess?.showSuccess ? updateSuccess : successState
          }
          createAndUpdateFilterButtonDisabled={saveFilterButtonDisabled}
          handleUpdateFilter={handleUpdateModalClick}
          handleDeleteFilter={handleDeleteClick}
          handleSaveCurrentFilter={handleSaveFilter}
          handleFilterName={handleFilterName}
          filterName={filterName}
          shareFilter={shareFilter}
          setShareFilter={setShareFilter}
          candidateOptions={candidateOptions}
          shareFilterForSpecificRole={shareFilterForSpecificRole}
          setShareFilterForSpecificRole={setShareFilterForSpecificRole}
        />
      ),
    },
  ];

  const introOptions = [
    {
      value: "quickFilter",
      title: t("Find something now"),
      // Don't parse UI copy to decide formatting; keep formatting intent as data.
      descriptionLines: [
        t("Apply a quick, temporary"),
        t("filter for a one-time search"),
      ],
      section: "filterType",
    },
    {
      value: "newFilter",
      title: t("Build and save an editable filter"),
      description: t(
        "Create a filter you intend to re-use and come back to"
      ),
      section: "filterType",
    },
    {
      value: "privateFilter",
      title: t("For me"),
      description: t(
        "Create a personal view to focus on tasks"
      ),
      section: "filterAccess",
    },
    {
      value: "sharedFilter",
      title: t("For myself and others"),
      description: t("Create a shared view to standardize workflows"),
      section: "filterAccess",
    },
  ];

  const introStep = {
    key: "intro",
    content: (
      <div
        role="radiogroup"
        aria-label={t("Choose how to start")}
        className="d-flex justify-content-center"
      >
        <div className="task-filter-intro-container">
          <div className="task-filter-intro-section-title">
            {t("What are you trying to do?")}
          </div>
          <div className="row g-3 justify-content-center">
            {introOptions
              .filter((o) => o.section === "filterType")
              .map((opt) => {
                const isSelected = introTypeSelection === opt.value;
                return (
                  <div key={opt.value} className="col-12 col-md-6">
                    <div
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => handleIntroTypeSelect(opt.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleIntroTypeSelect(opt.value);
                        }
                      }}
                      className={[
                        "task-filter-intro-card",
                        "h-100 rounded p-3 d-flex align-items-center justify-content-between",
                        isSelected ? "task-filter-intro-card--selected" : "",
                      ].join(" ")}
                    >
                      <div className="task-filter-intro-card__text">
                        <div className="task-filter-intro-card__title">
                          {opt.title}
                        </div>
                        <div
                          className="task-filter-intro-card__description"
                        >
                          {renderIntroDescription(opt)}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="task-filter-intro-type"
                        checked={isSelected}
                        onChange={() => handleIntroTypeSelect(opt.value)}
                        aria-label={opt.title}
                        className="m-0"
                      />
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="task-filter-intro-section-title task-filter-intro-section-title--spaced">
            {t("Who is this filter for?")}
          </div>
          <div className="row g-3 justify-content-center">
            {introOptions
              .filter((o) => o.section === "filterAccess")
              .map((opt) => {
                const isSelected = introAccessSelection === opt.value;
                const isDisabled = introTypeSelection === "quickFilter" && opt.value === "sharedFilter";
                return (
                  <div key={opt.value} className="col-12 col-md-6">
                    <div
                      role="radio"
                      aria-checked={isSelected}
                      aria-disabled={isDisabled}
                      tabIndex={isDisabled ? -1 : 0}
                      onClick={() => {
                        if (!isDisabled) setIntroAccessSelection(opt.value);
                      }}
                      onKeyDown={(e) => {
                        if (isDisabled) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setIntroAccessSelection(opt.value);
                        }
                      }}
                      className={[
                        "task-filter-intro-card",
                        "h-100 rounded p-3 d-flex align-items-center justify-content-between",
                        isDisabled ? "task-filter-intro-card--disabled" : "",
                        isSelected ? "task-filter-intro-card--selected" : "",
                      ].join(" ")}
                    >
                      <div className="task-filter-intro-card__text">
                        <div className="task-filter-intro-card__title">
                          {opt.title}
                        </div>
                        <div
                          className="task-filter-intro-card__description"
                        >
                          {renderIntroDescription(opt)}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="task-filter-intro-access"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => {
                          if (!isDisabled) setIntroAccessSelection(opt.value);
                        }}
                        aria-label={opt.title}
                        className="m-0"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    ),
  };

  const baseWizardSteps = [
    { key: "step1", content: tabs[0]?.content },
    {
      key: "step2",
      content: (
        <div className="task-filter-page2-container">
          <div className="task-filter-page2-container-left">
            {tabs[1]?.content}
          </div>
          <div className="task-filter-page2-container-right">
            {renderAccessControls()}
            {settingsTab()}
          </div>
        </div>
      ),
    },
    { key: "step3", content: tabs[3]?.content },
  ];

  const wizardBase = isQuickFilterFlow
    ? baseWizardSteps.filter((s) => s.key !== "step3")
    : baseWizardSteps;

  const wizardSteps = isCreating ? [introStep, ...wizardBase] : wizardBase;

  const stepKeys = wizardSteps.map((s) => s.key);
  const activeStep = Math.min(Math.max((currentStep || 1) - 1, 0), stepKeys.length - 1);
  const displayTotalSteps = isCreating ? Math.max(stepKeys.length - 1, 1) : stepKeys.length;
  const displayCurrentStep = isCreating ? activeStep : activeStep + 1;
  const isIntroStep = isCreating && activeStep === 0;

  const goNext = () => {
    const next = Math.min(activeStep + 2, stepKeys.length);
    onStepChange?.(next);
  };

  const goBack = () => {
    const prev = Math.max(activeStep, 1);
    onStepChange?.(prev);
  };

  const isLastStep = activeStep === stepKeys.length - 1;

  const handleWizardPrimaryClick = () => {
    if (isLastStep) {
      if (isQuickFilterFlow) {
        filterResults();
      } else if (filterToEdit?.id) {
        handleUpdateModalClick();
      } else {
        handleSaveFilter();
      }
    } else {
      goNext();
    }
  };

  useEffect(() => {
    if (updateSuccess?.showSuccess || deleteSuccess?.showSuccess) {
      onStepChange?.(stepKeys.length);
    }
  }, [updateSuccess?.showSuccess, deleteSuccess?.showSuccess]);

  return (
    <>
      <AppModal.Body >
        <div className="wizard-step-content">
          {wizardSteps[activeStep]?.content}
        </div>
      </AppModal.Body>
      <AppModal.Footer data-three-buttons="true">
        <div className="buttons-row flex-fill" >
          <V8CustomButton
            label={t("Back")}
            onClick={goBack}
            dataTestId="wizard-back"
            ariaLabel={t("Go to previous step")}
            secondary
            disabled={activeStep === 0}
          />
        </div>
        <div className="wizard-page-indicator" aria-live="polite">
          {!isIntroStep
            ? t("{{current}} of {{total}}", {
                current: displayCurrentStep,
                total: displayTotalSteps,
              })
            : null}
        </div>
        <div className="buttons-row justify-content-end flex-fill">
          <V8CustomButton
            variant="primary"
            label={
              isLastStep
                ? (isQuickFilterFlow ? `${t("Apply Quick Filter")}` : t("Save and Apply"))
                : t("Next")
            }
            icon={isLastStep && isQuickFilterFlow ? <QuickFilterIcon/> : null}
            onClick={handleWizardPrimaryClick}
            dataTestId="wizard-next"
            ariaLabel={
              isLastStep
                ? (isQuickFilterFlow
                    ? t("Apply quick filter")
                    : (filterToEdit?.id ? t("Update this filter") : t("Create this filter")))
                : t("Go to next step")
            }
            disabled={
              isLastStep
                ? (isQuickFilterFlow
                    ? (disableFilterButton || isTaskFilterSaving)
                    : (saveFilterButtonDisabled || isTaskFilterSaving))
                : false
            }
            loading={isLastStep && isTaskFilterSaving}
          />
        </div>
      </AppModal.Footer>
    </>
  );
};
export default TaskFilterModalBody;
