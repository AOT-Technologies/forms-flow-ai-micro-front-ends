import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";
import {
  CustomTabs,
  InputDropdown,
  CustomInfo,
  DragandDropSort,
  ConfirmModal,
  useSuccessCountdown,
  CustomButton,
} from "@formsflow/components";
import { removeTenantKey, trimFirstSlash } from "../../helper/helper";
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

const TaskFilterModalBody = ({
  showTaskFilterMainModal,
  closeTaskFilterMainModal,
  toggleDeleteModal,
  toggleUpdateModal,
  filterToEdit,
  deleteSuccess,
  updateSuccess,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const {
    userGroups: candidateGroups = { data: [] },
    isUnsavedFilter,
    filterList,
    userDetails = {} as UserDetail,
  } = useSelector((state: any) => state.task);

  const [accessOption, setAccessOption] = useState("specificRole");
  const [accessValue, setAccessValue] = useState("");
  const selectedFilterExistingData = filterList.find((i)=>filterToEdit?.id);
  const [variableArray, setVariableArray] = useState(
    filterToEdit?.variables || defaultTaskVariable
  );
  const { successState, startSuccessCountdown } = useSuccessCountdown();

  const [forms, setForms] = useState([]);

  const [filterName, setFilterName] = useState(filterToEdit?.name || "");

  const [sortValue, setSortValue] = useState("dueDate");
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

  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);

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
      sorting: [{ sortBy: sortValue, sortOrder: sortOrder }],
    };

    

    if (selectedForm?.formId) {
      criteria.processVariables = [];
      criteria.processVariables.push({
        name: "formId",
        operator: "eq",
        value: selectedForm.formId,
      });
    }

    if (accessOption === "specificRole") {
      criteria.candidateGroup =
        MULTITENANCY_ENABLED && accessValue
          ? tenantKey + "-" + trimFirstSlash(accessValue)
          : trimFirstSlash(accessValue);
      delete criteria.assignee;
    } else {
      criteria.assignee = accessValue;
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
      roles.push(shareFilterForSpecificRole);
    } else {
      users = [];
      roles = [];
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
    variables: variableArray,
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
      setSortValue(sort.sortBy);
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
    const { roles, users, criteria } = filterToEdit;
    const { assignee, sorting, dataLine, candidateGroup } = criteria;
    setShareFilterForSpecificRole(roles);
    setAccessOption(assignee ? "specificAssignee" : "specificRole");
    setAccessValue(assignee ? assignee : candidateGroup);
    handleSorting(sorting);
    handleShareFilter(roles, users);
    setDataLineValue(dataLine ?? 1);
  }, [filterToEdit]);

  /* -------- handling already selected forms when after forms fetching ------- */
  useEffect(() => {
    if (filterToEdit && forms.length) {
      const matchedForm = forms.find(
        (form) => form.formId === filterToEdit?.properties?.formId
      );
      if (matchedForm) {
        setSelectedForm({
          formId: matchedForm.formId,
          formName: matchedForm.formName,
        });
      }
    }
  }, [filterToEdit, forms.length]);

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

      const name = MULTITENANCY_ENABLED
        ? removeTenantKey(group.name, tenantKey)
        : group.name;

      acc.push({ value: name, label: name });
      return acc;
    }, []);
  }, [candidateGroups, MULTITENANCY_ENABLED, tenantKey]);

  const createSortByOptions = (labelKey, value) => ({
    label: t(labelKey),
    value,
  });

  const dateSortOptions = [
    createSortByOptions("Due Date", "dueDate"),
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
    dueDate: createSortOrderOptions("Oldest to Newest", "Newest to Oldest"),
    assignee: createSortOrderOptions("A to Z", "Z to A"),
    name: createSortOrderOptions("A to Z", "Z to A"),
    formName: createSortOrderOptions("A to Z", "Z to A"),
    applicationId: createSortOrderOptions(
      "Largest to Smallest",
      "Smallest to Largest"
    ),
  };

  const dataLineCount = Array.from({ length: 4 }, (_, i) => {
    const value = (i + 1).toString();
    return { label: value, value, onClick: () => setDataLineValue(i + 1) };
  });

  const isDuplicateVariable = (taskVar, existingVars) => {
    return existingVars.some(
      (existingVar) =>
        existingVar.key === taskVar.key && existingVar.label === taskVar.label
    );
  };

  const transformToDynamicVariables = (taskVariables, existingVars) => {
    return taskVariables
      .filter(
        (taskVar) =>
          taskVar.type !== "hidden" && taskVar.type !== "radio" &&
          !isDuplicateVariable(taskVar, existingVars)
      )
      .map((variable, index) => ({
        ...variable,
        name: variable.key,
        isChecked: true,
        sortOrder: existingVars.length + index + 1,
        isTaskVariable: true,
      }));
  };

  const handleFetchTaskVariables = (formId) => {
    fetchTaskVariables(formId)
      .then((res) => {
        const taskVariables = res.data?.taskVariables || [];
        const dynamicVariables = transformToDynamicVariables(
          taskVariables,
          variableArray
        );
        const combinedVars = [...variableArray, ...dynamicVariables];
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
    dispatch(setFilterToEdit(getData()));
    toggleUpdateModal();
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
    !accessValue ||
    (filterToEdit?.id ? disableFilterButton : isVariableArrayEmpty);
  /* ------------------------------- tab values ------------------------------- */
  const columnsTab = () => (
    <>
      <CustomInfo
        className="note"
        heading="Note"
        content={t(
          "Toggle the visibility of columns and re-order them if needed."
        )}
        dataTestId="task-filter-columns-note"
      />
      {variableArray.length !== 0 && (
        <DragandDropSort
          key={variableArray.length}
          items={variableArray}
          onUpdate={handleUpdateOrder}
          data-testid="columns-sort"
        />
      )}
    </>
  );

  const settingsTab = () => (
    <>
    <div className="input-combination">
      <InputDropdown
        Options={dateSortOptions}
        dropdownLabel={t("Default Sort")}
        isAllowInput={false}
        ariaLabelforDropdown={t("dropdown for sort options")}
        ariaLabelforInput={t("input for typing option")}
        dataTestIdforInput="date-sort-input"
        dataTestIdforDropdown="date-sort"
        selectedOption={sortValue}
        setNewInput={setSortValue}
        id="default-sort"
      />
      {sortValue && sortOptions[sortValue] ? (
        <InputDropdown
          Options={sortOptions[sortValue]}
          isAllowInput={false}
          ariaLabelforDropdown={t("dropdown for sort order")}
          ariaLabelforInput={t("input for sort order")}
          data-testid="sort-order-dropdown"
          dataTestIdforInput="sort-order-input"
          dataTestIdforDropdown="sort-order-list"
          selectedOption={sortOrder}
          setNewInput={setSortOrder}
          id="sort-order"
        />
      ) : null}
      </div>
      <InputDropdown
        Options={dataLineCount}
        dropdownLabel={t("How Many Lines of Data To Show Per Row")}
        isAllowInput={false}
        ariaLabelforDropdown={t("line of data dropdown ")}
        ariaLabelforInput={t("line of data input")}
        dataTestIdforInput="data-line-input"
        dataTestIdforDropdown="data-line"
        selectedOption={dataLineValue}
        setNewInput={setDataLineValue}
        id="how-many-lines-of-data-to-show-per-row"
      />
    </>
  );

  const tabs = [
    {
      eventKey: "parametersTab",
      title: t("Parameters"),
      content: (
        <ParametersTab
          forms={forms}
          accessOption={accessOption}
          changeAcessOption={changeAcessOption}
          accessValue={accessValue}
          setAccessValue={setAccessValue}
          handleFormSelectionClear={handleFormSelectionClear}
          candidateOptions={candidateOptions}
          selectedForm={selectedForm}
          toggleFormSelectionModal={toggleFormSelectionModal}
          showFormSelectionModal={showFormSelectionModal}
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

  return (
    <>
      <Modal.Body className="with-tabs">
        <div className="tabs">
          <CustomTabs
            defaultActiveKey={
              updateSuccess?.showSuccess || deleteSuccess?.showSuccess
                ? "saveFilterTab"
                : "parametersTab"
            }
            tabs={tabs}
            ariaLabel={t("Filter Tabs")}
            dataTestId="create-filter-tabs"
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="buttons-row">
          <CustomButton
            label={t("Filter Results")}
            dataTestId="task-filter-results"
            ariaLabel={t("Filter results")}
            onClick={filterResults}
            disabled={
              successState.showSuccess ||
              updateSuccess?.showSuccess ||
              deleteSuccess?.showSuccess ||
              disableFilterButton
            }
          />
          <CustomButton
            label={t("Cancel")}
            onClick={closeTaskFilterMainModal}
            dataTestId="cancel-task-filter"
            ariaLabel={t("Cancel filter")}
            secondary
          />
        </div>
      </Modal.Footer>
    </>
  );
};
export default TaskFilterModalBody;
