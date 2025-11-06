import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import {
  DragandDropSort,
  useSuccessCountdown,
  V8CustomButton,
  SelectDropdown
} from "@formsflow/components";
import { removeTenantKey, trimFirstSlash, addTenantPrefixIfNeeded } from "../../helper/helper";
import {
  ACCESSIBLE_FOR_ALL_GROUPS,
  MULTITENANCY_ENABLED,
  PRIVATE_ONLY_YOU,
  SPECIFIC_USER_OR_GROUP,
} from "../../constants/index";
import { useSelector, useDispatch } from "react-redux";
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
import { Modal } from "react-bootstrap";
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
  const dispatch = useDispatch();

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
    selectedFilterExistingData?.variables || defaultTaskVariable
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
      includeAssignedTasks: true,
      candidateGroupsExpression: "${currentUserGroups()}",
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
    } else if(accessOption === SPECIFIC_ASSIGNEE){
      criteria.assignee = accessValue;
      delete criteria.candidateGroup;
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
      const match = selectedFilter?.variables?.find((sv:any) => sv?.key === v?.key);
      return match?.width ? { ...v, width: match.width } : v;
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
    //TBD updated later
    const { roles = [], users = [], criteria = {}, properties = {} } = selectedFilterExistingData;
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
          const data = res.data?.forms ?? [];
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
      const isEditingWithSameForm = filterToEdit?.id && filterToEdit?.properties?.formId === formId;

      let combinedVars;
      
      if (isEditingWithSameForm) {
        // Get current task variable keys for comparison
        const currentTaskVariableKeys = taskVariables
          .filter(taskVar => isValidVariableType(taskVar))
          .map(taskVar => taskVar.key);
        
        // Filter out deleted form variables from existing filter
        const existingFormVariables = (filterToEdit?.variables?.filter(v => v.isFormVariable) || [])
          .filter(existingVar => currentTaskVariableKeys.includes(existingVar.key));
        
        // Get default variables with existing values preserved
        const defaultVars = defaultTaskVariable.map(defaultVar => {
          const existingVar = findExistingVariable(filterToEdit?.variables || [], defaultVar);
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
        combinedVars = processNewFilterMode(taskVariables, defaultTaskVariable);
      }

      setVariableArray(combinedVars);
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
  const handleSaveFilter = () => {
    createFilter(getData())
      .then((res) => {
        const updatedFilterList = [...filterList, res.data];
        dispatch(setBPMFilterList(updatedFilterList));
        startSuccessCountdown(closeTaskFilterMainModal, 2);
        dispatch(fetchBPMTaskCount(updatedFilterList));
        dispatch(setDefaultFilter(res.data.id));
        updateDefaultFilter(res.data.id);
      })
      .catch((error) => console.error("Error saving filter:", error));
  };

  const handleFormSelection = (selectedFormObj) => {
    setSelectedForm(selectedFormObj);
    handleFetchTaskVariables(selectedFormObj.formId);
    toggleFormSelectionModal();
  };

  const handleUpdateModalClick = () => {
    const isPrivate = filterToEdit?.users?.length!==0;
    const data = getData();
    if(isPrivate){
     handleFilterUpdate(isPrivate,data);
    }else{
      dispatch(setFilterToEdit(data));
    toggleUpdateModal();
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
  const saveFilterButtonDisabled =
    !filterName || 
    ((accessOption !== CURRENT_USER) && !accessValue) ||
    !accessOption ||
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

  const wizardSteps = [
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
      )
    },
    { key: "step3", content: tabs[3]?.content },
  ];

  const stepKeys = wizardSteps.map((s) => s.key);
  const activeStep = Math.min(Math.max((currentStep || 1) - 1, 0), stepKeys.length - 1);

  const goNext = () => {
    const next = Math.min(activeStep + 2, stepKeys.length);
    onStepChange?.(next);
  };

  const goBack = () => {
    const prev = Math.max(activeStep, 1);
    onStepChange?.(prev);
  };

  const isLastStep = activeStep === stepKeys.length - 1;

  useEffect(() => {
    if (updateSuccess?.showSuccess || deleteSuccess?.showSuccess) {
      onStepChange?.(stepKeys.length);
    }
  }, [updateSuccess?.showSuccess, deleteSuccess?.showSuccess]);

  return (
    <>
      <Modal.Body className="overflow-hidden">
        <div className="wizard-step-content">
          {wizardSteps[activeStep]?.content}
        </div>
      </Modal.Body>
      <Modal.Footer data-three-buttons="true">
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
          {t("{{current}} of {{total}}", { current: activeStep + 1, total: stepKeys.length })}
        </div>
        <div className="buttons-row justify-content-end flex-fill">
          <V8CustomButton
          variant="primary"
            label={
              isLastStep
                ? (t("Save and Apply"))
                : t("Next")
            }
            onClick={
              isLastStep
                ? (filterToEdit?.id ? handleUpdateModalClick : handleSaveFilter)
                : goNext
            }
            dataTestId="wizard-next"
            ariaLabel={
              isLastStep
                ? (filterToEdit?.id ? t("Update this filter") : t("Create this filter"))
                : t("Go to next step")
            }
            disabled={
              isLastStep
                ? saveFilterButtonDisabled
                : false
            }
          />
        </div>
      </Modal.Footer>
    </>
  );
};
export default TaskFilterModalBody;
