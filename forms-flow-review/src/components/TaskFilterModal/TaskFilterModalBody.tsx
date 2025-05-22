import {
  useState,
  useMemo,
  useEffect,
} from "react";
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
import { useSelector, useDispatch, batch } from "react-redux";
import {
  deleteFilter,
  updateFilter,
  fetchAllForms,
  fetchBPMTaskCount,
  fetchFilterList,
  fetchServiceTaskList,
  fetchTaskVariables,
  getUserRoles,
  createFilter,
  updateDefaultFilter,
} from "../../api/services/filterServices";
import {
  setBPMFilterList,
  setBPMFiltersAndCount,
  setDefaultFilter,
  setIsUnsavedFilter,
  setSelectedFilter,
  setUserGroups,
} from "../../actions/taskActions";
import { Filter, FilterCriteria, UserDetail } from "../../types/taskFilter";
import { StorageService } from "@formsflow/service";
import { defaultTaskVariable } from "../../constants/defaultTaskVariable";
import ParametersTab from "./ParametersTab";
import SaveFilterTab from "./SaveFilterTab";
import { Modal } from "react-bootstrap";

 
const TaskFilterModalBody =  
  (
    {
      toggleFilterModal,
      showTaskFilterMainModal,
      closeTaskFilterMainModal,
      filter,
      canEdit,
    }
  ) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const {
      userGroups: candidateGroups = { data: [] }, 
      defaultFilter, 
      isUnsavedFilter,
      filterList,
    } = useSelector((state: any) => state.task);
    const activePage = 1;
    const limit = 5;
    const [accessOption, setAccessOption] = useState("specificRole");
    const [accessValue, setAccessValue] = useState("");
    const [variableArray, setVariableArray] = useState(filter?.variables || defaultTaskVariable);
    const { successState, startSuccessCountdown } = useSuccessCountdown();
    const userDetail: UserDetail | null = StorageService.getParsedData(
      StorageService.User.USER_DETAILS
    );
    const [forms, setForms] = useState([]);

    const [filterName, setFilterName] = useState(filter?.name || "");

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
 
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    let buttonVariant = "secondary"; // Default value
    if (successState.showSuccess) {
      buttonVariant = "success";
    }

    const changeAcessOption = (option: string) => {
      setAccessOption(option);
      if (option !== accessOption) {
        setAccessValue("");
      }
    };
    const toggleFormSelectionModal = () => {
      setShowFormSelectionModal(!showFormSelectionModal);
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

      criteria.processVariables = []

      if (selectedForm.formId) { 
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
        users.push(userDetail?.preferred_username);
      } else if (shareFilter === SPECIFIC_USER_OR_GROUP) {
        roles.push(shareFilterForSpecificRole);
      } else {
        users = [];
        roles = [];
      }
      return { users, roles };
    };

    const getData = (): Filter => ({
      created: filter?.created,
      modified: filter?.modified,
      id: filter?.id,
      tenant: filter?.tenant,
      name: filterName,
      criteria: getCriteria(),
      variables: variableArray,
      properties: {
        displayLinesCount: dataLineValue,
        formId: selectedForm.formId,
      },
      ...handleFilterAccess(),
      status: filter?.status,
      createdBy: filter?.createdBy,
      modifiedBy: filter?.modifiedBy,
      //task visible attributes need to remove after checking with backend
      taskVisibleAttributes: {
        applicationId: true,
        assignee: true,
        created: true,
        dueDate: true,
        followUp: true,
        priority: true,
      },
      hide: filter?.hide,
      filterType: "TASK",
      editPermission: filter?.editPermission,
      sortOrder: filter?.sortOrder, 
      //these variables are not used in the filter but keeping for comparison prvious and current filter state
      description: null,
     order: null,
     parentFilterId: null,
     resourceId: null,
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
      if (!filter) return;
      const {  roles, users, criteria } = filter;
      const { assignee, sorting, dataLine, candidateGroup } = criteria;
      setShareFilterForSpecificRole(roles);
      setAccessOption(assignee ? "specificAssignee" : "specificRole");
      setAccessValue(assignee ? assignee : candidateGroup);
      handleSorting(sorting);
      handleShareFilter(roles, users);
      setDataLineValue(dataLine ?? 1);
    }, [filter]);

    /* -------- handling already selected forms when after forms fetching ------- */
    useEffect(() => {
      if (filter && forms.length) {
        const matchedForm = forms.find(
          (form) => form.formId === filter?.properties?.formId
        );
        if (matchedForm) {
          setSelectedForm({
            formId: matchedForm.formId,
            formName: matchedForm.formName,
          });
        }
      }
    }, [filter, forms.length]);

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
        .filter((taskVar) => taskVar.type !=="hidden" && !isDuplicateVariable(taskVar, existingVars))
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

    const handleFilterDelete = () => {
      deleteFilter(filter?.id)
        .then(()=>{
          setShowDeleteModal(false);
          handleDeleteSuccess();
          closeTaskFilterMainModal();
        })
        .catch((error) => {
          console.error("error", error);
        });
    };

    const handleDeleteSuccess = () => {
       const nextFilters = filterList.filter(i=> i.id !== filter.id);
        const nextFilter = nextFilters.length > 0 ? nextFilters[0] : null;
       batch(()=>{
        dispatch(setBPMFilterList(nextFilters));
        dispatch(setSelectedFilter(nextFilter));
       if(nextFilter){
         dispatch(setDefaultFilter(nextFilter?.id));
         updateDefaultFilter(nextFilter?.id) //update default filter value in background
       }
       })
    };
 
   

    // need to check if this function is used anywhere else
    const handleUpdateOrder = (updatedItems) => { 
      setVariableArray(updatedItems);
    };

    //handling filter result after clicking on filter result button
    const filterResults = () => {
      // keeping latest data with unsaved true
      dispatch(setSelectedFilter({ ...getData()}));
      dispatch(setIsUnsavedFilter(true));
      closeTaskFilterMainModal();
      dispatch(
        fetchServiceTaskList(getData(), null, activePage, limit, (error) => {
          if (error) {
            console.error("Error fetching tasks:", error);
            return;
          }
        })
      );
    };

    /* -------------------- handling create or update filter -------------------- */
    const handleSaveFilter = () => {
      const saveAction = filter && filter.id
        ? updateFilter(getData(), filter.id)
        : createFilter(getData());

      saveAction
        .then((res) => {
          setSelectedFilter(res.data);
          dispatch(setIsUnsavedFilter(false));
          handleSuccessSaveFilter(res)
        })
        .catch((error) => console.error("Error saving filter:", error));
    };

    const handleSuccessSaveFilter = (res) => {
      const filtersList = filterList.filter(
        (item) => item.id !== res.data.id);
      const updatedFilterList = [res.data,...filtersList];
      dispatch(setBPMFilterList(updatedFilterList));
      dispatch(fetchBPMTaskCount(updatedFilterList,(err)=>{
        if(!err){
             startSuccessCountdown(closeTaskFilterMainModal, 2);
        }
      }) )
      updateDefaultAfterSave(res);
      
    };

 
    const updateDefaultAfterSave = (res) => { 
      const isDefaultFilter = res.data.id === defaultFilter ;
      if(isDefaultFilter) return;
      updateDefaultFilter(res.data.id)
        .then(
          (updateRes) =>
            dispatch(setDefaultFilter(updateRes.data.defaultFilter)),
        )
        .catch((error) =>
          console.error("Error updating default filter:", error)
        );
    };

    const handleFormSelection = (selectedFormObj) => {
      setSelectedForm(selectedFormObj);
      handleFetchTaskVariables(selectedFormObj.formId);
      toggleFormSelectionModal();
    };

    const toggleupdateConfirmationModal = () => {
      setShowUpdateModal(!showUpdateModal);
    };

    const toggleDeleteConfirmationModal = () => {
      setShowDeleteModal(!showDeleteModal);
    };
 
    // disable filter button when all variable array value unchecked or previous filter and current filter are same
   const isFilterSame = isUnsavedFilter ? false: isEqual(getData(), filter);
   const isVariableArrayEmpty = variableArray.every((item) => !item.isChecked);
   const disableFilterButton = isVariableArrayEmpty || isFilterSame ;   
   const saveFilterButtonDisabled = !filterName || !accessValue || (filter?.id ? disableFilterButton : isVariableArrayEmpty);
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
        />
        {sortValue && sortOptions[sortValue] ? (
          <div className="d-flex filter-dropdown">
            <div className="L-style"></div>
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
            />
          </div>
        ) : null}
        <div className="pt-4">
          <InputDropdown
            Options={dataLineCount}
            dropdownLabel={t("How Many Line of Data To Show Per Row?")}
            isAllowInput={false}
            ariaLabelforDropdown={t("line of data dropdown ")}
            ariaLabelforInput={t("line of data input")}
            dataTestIdforInput="data-line-input"
            dataTestIdforDropdown="data-line"
            selectedOption={dataLineValue}
            setNewInput={setDataLineValue}
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
            filter={filter}
            createAndUpdateFilterButtonDisabled={saveFilterButtonDisabled}
            userDetail={userDetail}
            handleUpdateFilter={toggleupdateConfirmationModal}
            handleDeleteFilter={toggleDeleteConfirmationModal}
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

       <Modal.Body className="modal-body p-0">
        <div className="filter-tab-container">
          <CustomTabs
            defaultActiveKey="parametersTab"
            tabs={tabs}
            ariaLabel={t("Filter Tabs")}
            dataTestId="create-filter-tabs"
          />
        </div>
        </Modal.Body>
          <Modal.Footer className="d-flex justify-content-start">
          <CustomButton
            variant="primary"
            size="md"
            label={t("Filter Results")}
            dataTestId="task-filter-results"
            ariaLabel={t("Filter results")}
            onClick={filterResults}
            disabled={disableFilterButton}
          />
          <CustomButton
            variant="secondary"
            size="md"
            label={t("Cancel")}
            onClick={closeTaskFilterMainModal}
            dataTestId="cancel-task-filter"
            ariaLabel={t("Cancel filter")}
          />
        </Modal.Footer>

        {showDeleteModal && (
          <ConfirmModal
            show={showDeleteModal}
            title={t("Delete This Filter?")}
            message={
              <CustomInfo
                className="note"
                heading="Note"
                content={t(
                  "This filter is shared with others. Deleting this filter will delete it for everybody and might affect their workflow."
                )}
                dataTestId="task-filter-delete-note"
              />
            }
            primaryBtnAction={() => {
              setShowDeleteModal(false);
              closeTaskFilterMainModal();
            }}
            closeTaskFilterMainModal={() => setShowDeleteModal(false)}
            primaryBtnText={t("No, Keep This Filter")}
            secondaryBtnText={t("Yes, Delete This Filter For Everybody")}
            secondaryBtnAction={handleFilterDelete}
            secondoryBtndataTestid="confirm-revert-button"
          />
        )}

        {showUpdateModal && (
          <ConfirmModal
            show={showUpdateModal}
            title={t("Update This Filter?")}
            message={
              <CustomInfo
                className="note"
                heading="Note"
                content={t(
                  "This filter is shared with others. Updating this filter will update it for everybody and might affect their workflow. Proceed with caution."
                )}
                dataTestId="task-filter-update-note"
              />
            }
            primaryBtnAction={() => {
              setShowUpdateModal(false);
            }}
            closeTaskFilterMainModal={() => setShowUpdateModal(false)}
            primaryBtnText={t("No, Cancel Changes")}
            secondaryBtnText={t("Yes, Update This Filter For Everybody")}
            secondaryBtnAction={handleSaveFilter}
            secondoryBtndataTestid="confirm-revert-button"
          />
        )}
      </>
    );
  }
;

export default TaskFilterModalBody;
