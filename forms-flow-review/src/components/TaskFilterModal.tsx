import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import {
  CloseIcon,
  PencilIcon,
  SaveIcon,
  CustomButton,
  CustomTabs,
  InputDropdown,
  FormInput,
  CustomInfo,
  DragandDropSort,
  DeleteIcon,
  UpdateIcon,
  ConfirmModal,
  useSuccessCountdown
} from "@formsflow/components";
import { removeTenantKey, trimFirstSlash } from "../helper/helper.js";
import {
  ACCESSIBLE_FOR_ALL_GROUPS,
  MULTITENANCY_ENABLED,
  PRIVATE_ONLY_YOU,
  SPECIFIC_USER_OR_GROUP,
} from "../constants/index";
import { useSelector, useDispatch } from "react-redux";
import {
  deleteFilter,
  updateFilter,
  fetchAllForms,
  fetchBPMTaskCount,
  fetchFilterList,
  fetchServiceTaskList,
  fetchTaskVariables,
  fetchUserList,
  getUserRoles,
  createFilter,
  updateDefaultFilter,
} from "../api/services/filterServices";
import { setBPMFiltersAndCount, setDefaultFilter, setUserGroups } from "../actions/taskActions";
import { Filter, FilterCriteria, UserDetail } from "../types/taskFilter.js";
import { StorageService } from "@formsflow/service";
import { FormSelectionModal } from "./FormSelectionModal";


export function TaskFilterModal({ show, onClose, filter, canEdit }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const computedStyle = getComputedStyle(document.documentElement);
  const baseColor = computedStyle.getPropertyValue("--ff-primary");
  const whiteColor = computedStyle.getPropertyValue("--ff-white");
  const filterNameLength = 50;
  const [accessDropdownValue, setAccessDropdownValue] =
    useState("specificRole");
  const [specificRole, setSpecificRole] = useState("");
  const [specificAssignee, setSpecificAssignee] = useState("");
  const [sortValue, setSortValue] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dataLineValue, setDataLineValue] = useState(1);
  const [shareFilter, setShareFilter] = useState(PRIVATE_ONLY_YOU);
  const [filterRole, setFilterRole] = useState([]);
  const [filterName, setFilterName] = useState("");
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [filterNameError, setFilterNameError] = useState("");
  const [selectedForm, setSelectedForm] = useState({
    formId: "",
    formName: "",
  });
  const [variableArray, setVariableArray] = useState([]);

  const [showFormSelectionModal, setShowFormSelectionModal] = useState(false);
  const {
    userList = { data: [] },
    userGroups: candidateGroups = { data: [] },
    activePage,
    defaultFilter,
    limit
  } = useSelector((state: any) => state.task);
  const { successState, startSuccessCountdown } = useSuccessCountdown();
  const userListData = userList.data ?? [];
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const userRoles =
    StorageService.getParsedData(StorageService.User.USER_ROLE)

  const isCreateFilters = userRoles?.includes("create_filters");
  const [initialFilterSnapshot, setInitialFilterSnapshot] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
 const isFilterAdmin = userRoles?.includes("manage_all_filters"); 


  let buttonVariant = "secondary"; // Default value
  if (successState.showSuccess) {
    buttonVariant = "success";
  }
  const assigneeOptions = useMemo(
    () =>
      userListData.map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [userListData]
  );

  useEffect(() => {
    StorageService.getParsedData(StorageService.User.USER_DETAILS) &&
      setUserDetail(
        StorageService.getParsedData(StorageService.User.USER_DETAILS)
      );
  }, [shareFilter]);

  const handleAssigneeAccess = (assignee, candidateGroup) => {
    if (assignee) {
      setAccessDropdownValue("specificAssignee");
      setSpecificAssignee(assignee);
    } else if (candidateGroup) {
      setAccessDropdownValue("specificRole");
      setSpecificRole(candidateGroup);
    }
  };
  
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
  

  useEffect(() => {
    if (!filter) return;
  
    const { name, variables, roles, users, criteria } = filter;
    const {
      assignee,
      candidateGroup,
      sorting,
      dataLine,
      formId,
      formName,
    } = criteria;
  
    setFilterName(name);
    setVariableArray(variables);
    setFilterRole(roles);
    setInitialFilterSnapshot(JSON.stringify(filter));
  
    handleAssigneeAccess(assignee, candidateGroup);
    handleSorting(sorting);
    handleShareFilter(roles, users);
    setDataLineValue(dataLine ?? 1);
  
    if (formId) {
      setSelectedForm({ formId, formName });
    }
  }, [filter]);
  

  useEffect(() => {
    fetchAllForms()
      .then((res) => {
        const data = res.data?.forms ?? [];
        const matchedForm = data.find(
          (form) => form.formId === filter?.properties?.formId
        );

        if (matchedForm) {
          setSelectedForm({
            formId: matchedForm.formId,
            formName: matchedForm.formName,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [show, filter]);




  useEffect(() => {
    getUserRoles()
      .then((res) => res && dispatch(setUserGroups(res.data)))
      .catch((error) => console.error("error", error));
  }, []);

  useEffect(() => {
    if (accessDropdownValue === "specificRole") dispatch(fetchUserList());
  }, [accessDropdownValue]);

  useEffect(() => {
    const properties = getProperties();
    if (properties.formId) {
      setSelectedForm({ formId: properties.formId ?? "", formName: "" });
      handleFetchTaskVariables(properties?.formId);
    }
  }, []);

  const handleFilterName = (e) => setFilterName(e.target.value);

  const handleNameError = (e) => {
    const value = e.target.value;
    setFilterName(value);
    setFilterNameError(
      value.length >= filterNameLength
        ? t("Filter name should be less than {{filterNameLength}} characters", {
          filterNameLength: filterNameLength,
        })
        : ""
    );
  };




  const getCriteria = (): FilterCriteria => {
    const criteria = {
      includeAssignedTasks: filter?.criteria?.includeAssignedTasks,
      processVariables: [{
        name: "formId",
        operator: 'eq',
        value: selectedForm.formId
      }],
      candidateGroupsExpression: "${currentUserGroups()}",
      sorting: [{ sortBy: sortValue, sortOrder: sortOrder }]
    } as {
      candidateGroupsExpression: string;
      processVariables: { name: string; operator: string; value: string }[];
      sorting: { sortBy: string; sortOrder: string }[];
      candidateGroup?: string;
      assignee?: string;
      [key: string]: any;
    };

    if (specificRole) {
      criteria.candidateGroup = MULTITENANCY_ENABLED && specificRole
        ? tenantKey + '-' + trimFirstSlash(specificRole)
        : trimFirstSlash(specificRole);
    }

    if (specificAssignee) {
      criteria.assignee = specificAssignee;
    }

    return criteria;
  };





  const getProperties = () => ({
    displayLinesCount: dataLineValue,

    formId: selectedForm.formId,
  });

  const getRoles = () => {
    let roles = [];
    if (
      shareFilter === SPECIFIC_USER_OR_GROUP &&
      typeof filterRole === "string"
    ) {
      roles.push(filterRole);
    }
    return roles;
  };

  const getUsers = () => {
    let users = [

    ];
    if (shareFilter === PRIVATE_ONLY_YOU) {
      users.push(userDetail?.preferred_username);
    }
    return users;
  };

  const getData = (): Filter => ({
    created: filter?.created,
    modified: filter?.modified,
    id: filter?.id,
    tenant: filter?.tenant,
    name: filterName,
    description: filter?.description,
    resourceId: filter?.resourceId,
    criteria: getCriteria(),
    variables: variableArray,
    properties: getProperties(),
    roles: getRoles(),
    users: getUsers(),
    status: filter?.status,
    createdBy: filter?.createdBy,
    modifiedBy: filter?.modifiedBy,
    taskVisibleAttributes: {
      applicationId: true,
      assignee: true,
      created: true,
      dueDate: true,
      followUp: true,
      priority: true,
    },
    order: filter?.order,
    hide: filter?.hide,
    filterType: "TASK",
    parentFilterId: filter?.parentFilterId,
    editPermission: filter?.editPermission,
    sortOrder: filter?.sortOrder,

  });

 


  const isFilterUnchanged = useMemo(() => {
    
    const currentSnapshot = JSON.stringify(getData());
    return currentSnapshot === initialFilterSnapshot;
  }, [
    filterName,
    filterNameError,
    specificRole,
    specificAssignee,
    sortValue,
    sortOrder,
    shareFilter,
    filterRole,
    selectedForm,
    variableArray,
  ]);
  
  
  
 
  
  

  const accessOptions = [
    {
      label: t("Specific role"),
      value: "specificRole",
      onClick: () => candidateOptions,
    },
    {
      label: t("Specific assignee"),
      value: "specificAssignee",
      onClick: () => assigneeOptions,
    },
  ];

  const candidateOptions = useMemo(() => {
    const filteredGroups = candidateGroups.filter((group) =>
      group.permissions.includes("view_filters")
    );
    return MULTITENANCY_ENABLED
      ? filteredGroups.map((group) => ({
        value: removeTenantKey(group.name, tenantKey),
        label: removeTenantKey(group.name, tenantKey),
      }))
      : filteredGroups.map((group) => ({
        value: group.name,
        label: group.name,
      }));
  }, [candidateGroups, MULTITENANCY_ENABLED, tenantKey]);

  const createDateSortOption = (labelKey, value) => ({
    label: t(labelKey),
    value,
    onClick: () => setSortValue(value),
  });

  const dateSortOptions = [
    createDateSortOption('Due Date', 'dueDate'),
    createDateSortOption('Created Date', 'created'),
    createDateSortOption('Assignee', 'assignee'),
    createDateSortOption('Task', 'name'),
    createDateSortOption('Form Name', 'formName'),
    createDateSortOption('Submission ID', 'applicationId'),
  ];

  const createSortOptions = (ascLabel, descLabel) => [
    { label: t(ascLabel), value: "asc" },
    { label: t(descLabel), value: "desc" },
  ];

  const sortOptions = {
    created: createSortOptions("Oldest to Newest", "Newest to Oldest"),
    dueDate: createSortOptions("Oldest to Newest", "Newest to Oldest"),
    assignee: createSortOptions("A to Z", "Z to A"),
    name: createSortOptions("A to Z", "Z to A"),
    formName: createSortOptions("A to Z", "Z to A"),
    applicationId: createSortOptions(
      "Largest to Smallest",
      "Smallest to Largest"
    ),
  };

  const getIconColor = (disabled) => (disabled ? whiteColor : baseColor);
  const isInvalidFilter =
    !filterName.trim() ||
    filterNameError ||
    !isCreateFilters ||
    (specificRole.length === 0 && specificAssignee.length === 0) ||
    (shareFilter === SPECIFIC_USER_OR_GROUP && filterRole.length === 0);
  const isButtonDisabled = isInvalidFilter;
  const saveIconColor = getIconColor(isInvalidFilter);
  const updateIconColor = getIconColor(isFilterUnchanged);

  const renderDropdown = (options) => (
    <div className="d-flex filter-dropdown">
      <div className="L-style"></div>
      <InputDropdown
        Options={options}
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
  );

  const dataLineCount = Array.from({ length: 4 }, (_, i) => {
    const value = (i + 1).toString();
    return { label: value, value, onClick: () => setDataLineValue(i + 1) };
  });

  const createFilterShareOption = (labelKey, value) => ({
    label: t(labelKey),
    value,
    onClick: () => setShareFilter(value),
  });

  const filterShareOptions = [
    createFilterShareOption("Nobody(Keep it private)", PRIVATE_ONLY_YOU),
    createFilterShareOption("Everybody", ACCESSIBLE_FOR_ALL_GROUPS),
    createFilterShareOption("Specific role", SPECIFIC_USER_OR_GROUP),
  ];




  const handleFetchTaskVariables = (formId) => {

    fetchTaskVariables(formId)
      .then(res => {
        const taskVariables = res.data?.taskVariables || [];
        const staticVariables = [
          { key: 'applicationId', label: 'Submission ID', type: 'textfield', name: 'Submission ID', isChecked: true, sortOrder: 1, isTaskVariable: false },
          { key: 'submitterName', label: 'Submitter Name', type: 'textfield', name: 'Submitter Name', isChecked: true, sortOrder: 2, isTaskVariable: false },
          { key: 'assignee', label: 'Assignee', type: 'textfield', name: 'Assignee', isChecked: true, sortOrder: 3, isTaskVariable: false },
          { key: 'name', label: 'Task', type: 'textfield', name: 'Task', isChecked: true, sortOrder: 4, isTaskVariable: false },
          { key: 'created', label: 'Created Date', type: 'datetime', name: 'Created Date', isChecked: true, sortOrder: 5, isTaskVariable: false },
          { key: 'formName', label: 'Form Name', type: 'textfield', name: 'Form Name', isChecked: true, sortOrder: 6, isTaskVariable: false },
        ].map(variable => ({
          ...variable,
          key: variable.key,
          name: variable.key,
        }));

        const dynamicVariables = taskVariables.map((variable, index) => ({
          ...variable,
          key: variable.key,
          name: variable.key,
          isChecked: true,
          sortOrder: staticVariables.length + index + 1,
          isTaskVariable: true,
        }));

        setVariableArray([...staticVariables, ...dynamicVariables]);
      })
      .catch(err => console.error(err));
  };

  const handleFilterDelete = () => {
    deleteFilter(filter?.id)
      .then(handleDeleteSuccess)
      .catch((error) => {
        console.error("error", error);
      });
  
    setShowDeleteModal(false);
  };
  
  const handleDeleteSuccess = () => {
    dispatch(fetchFilterList(handleFilterListFetched));
    setShowDeleteModal(false);
    onClose();
  };
  
  const handleFilterListFetched = (err, data) => {
    if (!data) return;
  
    fetchBPMTaskCount(data.filters)
      .then((res) => handleTaskCountFetched(res, data.filters, data.defaultFilter))
      .catch((err) => {
        if (err) {
          console.error(err);
        }
      });
  };
  
  const handleTaskCountFetched = (res, filters, defaultFilterId) => {
    dispatch(setBPMFiltersAndCount(res.data));
  
    const selectedFilter =
    filters.find((i) => defaultFilterId === i.id) ?? filters[0];
  
    dispatch(fetchServiceTaskList(selectedFilter, null, activePage, limit));
  };
  


    

  const handleUpdateOrder = (updatedItems) => {
    const updatedVariableArray = updatedItems.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
    if (
      JSON.stringify(updatedVariableArray) !== JSON.stringify(variableArray)
    ) {
      setVariableArray(updatedVariableArray);
    }
  };



  



  const filterResults = () => {
    dispatch(fetchServiceTaskList(getData(), null, activePage, limit, (error) => {
      if (error) {
        console.error("Error fetching tasks:", error);
        return;
      }
    }));
    onClose();

  };

  const saveCurrentFilter = () => {
    const saveAction = filter
      ? updateFilter(getData(), filter.id)
      : createFilter(getData());
  
    saveAction
      .then((res) => handleFilterSaved(res))
      .catch((error) => console.error("Error saving filter:", error));
  };
  
  const handleFilterSaved = (res) => {
    dispatch(fetchFilterList((err, data) => handleFilterSaveFetched(res, data)));
  };
  
  const handleFilterSaveFetched = (res, data) => {
    if (!data) return;
  
    fetchBPMTaskCount(data.filters)
      .then((countRes) => {
        dispatch(setBPMFiltersAndCount(countRes.data));
      })
      .catch((err) => {
        console.error("Error fetching BPM task count:", err);
      })
      .finally(() => {
        updateDefaultAfterSave(res);
        setShowUpdateModal(false);
        onClose();
      });
  };
  
  const updateDefaultAfterSave = (res) => {
    const savedFilterId = filter ? filter.id : res.data.id;
    const isDefaultFilter = savedFilterId === defaultFilter ? null : savedFilterId;
  
    updateDefaultFilter(isDefaultFilter)
      .then((updateRes) =>
        dispatch(setDefaultFilter(updateRes.data.defaultFilter)),
      startSuccessCountdown(onClose,2)
      )
      .catch((error) =>
        console.error("Error updating default filter:", error)
      );
  };
  

const createdByMe = filter?.createdBy === userDetail?.preferred_username
const publicAccess = filter?.roles.length === 0 && filter?.users.length === 0;
const roleAccess = filter?.roles.some(role => userDetail.groups.includes(role));
const canAccess = roleAccess || publicAccess || createdByMe;
const viewOnly = !isFilterAdmin && canAccess;
const editRole = isFilterAdmin && canAccess;

  const cancelFilter = () => {
    setSpecificRole("");
    setSpecificAssignee("");
    setFilterName("");
    setSortValue("dueDate");
    setSortOrder("asc");
    setShareFilter(PRIVATE_ONLY_YOU);
    setVariableArray([]);
    setSelectedForm({
      formId: '',
      formName: '',
    });
    onClose();
  };

  const handleModalclose = () => {
    setShowFormSelectionModal(false);
  };

  const handleFormSelectionModal = (selectedFormObj) => {
    setSelectedForm(selectedFormObj);
    handleFetchTaskVariables(selectedFormObj.formId);
    setShowFormSelectionModal(false);
  };

  const parametersTab = () => (
    <>
      <InputDropdown
        Options={accessOptions}
        dropdownLabel={t("Tasks Accessible To")}
        isAllowInput={false}
        ariaLabelforDropdown={t("dropdown for selecting options")}
        ariaLabelforInput={t("input for typing option")}
        dataTestIdforInput="access-options-input"
        dataTestIdforDropdown="access-options"
        selectedOption={accessDropdownValue}
        setNewInput={setAccessDropdownValue}
      />
      {accessDropdownValue === "specificRole" ? (
        <div className="d-flex filter-dropdown">
          <div className="L-style"></div>
          <InputDropdown
            key="specificRoleDropdown" // 👈 Force remount
            Options={candidateOptions}
            isAllowInput={false}
            ariaLabelforDropdown={t("specific role dropdown")}
            ariaLabelforInput={t("specific role input")}
            dataTestIdforInput="specific-roles-input"
            dataTestIdforDropdown="specific-roles"
            selectedOption={specificRole}
            setNewInput={setSpecificRole}
          />
        </div>
      ) : (
        <div className="d-flex filter-dropdown">
          <div className="L-style"></div>
          <InputDropdown
            key="assigneeDropdown" // 👈 Force remount
            Options={assigneeOptions}
            isAllowInput={false}
            ariaLabelforDropdown={t("assignee dropdown")}
            ariaLabelforInput={t("assignee input")}
            data-testid="assignee-dropdown"
            dataTestIdforInput="assignee-input"
            selectedOption={specificAssignee}
            setNewInput={setSpecificAssignee}
            name="assigneeOptions"
          />
        </div>
      )}

      <div className="pt-4">
        <label className="mb-2">{t("Form")}</label>
        <div className="form-selection-input d-flex justify-content-end">
          <label className="w-100">{selectedForm.formName}</label>
          { selectedForm.formName && (<div className="form-selection-input-container">
            <CloseIcon
              color={baseColor}
              width="15px"
              height="15px"
              className="form-selection-icon"
              data-testid="clear-formId"
              aria-label="clear-formId"
              onClick={() => setSelectedForm({
                formId: "",
                formName: "",
              })}
            />
          </div>) }
          <div className="form-selection-input-container">
            <PencilIcon
              className="form-selection-icon"
              aria-label="open modal"
              data-testid="open-modal"
              onClick={() => setShowFormSelectionModal(true)}
            />
          </div>
        </div>
        <FormSelectionModal
          showModal={showFormSelectionModal}
          onClose={handleModalclose}
          onSelectForm={handleFormSelectionModal}
        />
      </div>
    </>
  );

  const columnsTab = () => (
    <div>
      <CustomInfo
        className="note"
        heading="Note"
        content={t("Toggle the visibility of columns and re-order them if needed.")}
        dataTestId="task-filter-columns-note"
      />
      {variableArray.length !== 0 && (
        <DragandDropSort
          items={variableArray}
          onUpdate={handleUpdateOrder}
          data-testid="columns-sort"
        />
      )}

    </div>
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
      {sortValue && sortOptions[sortValue]
        ? renderDropdown(sortOptions[sortValue])
        : null}
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

  const renderOwnershipNote = () => {
    if (!filter) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t(
            "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
          )}
          dataTestId="task-filter-save-note"
        />
      );
    }
  
    const isCreator = filter.createdBy === userDetail.preferred_username;
  
    if (isCreator) {
      return (
        <>
          <div className="pb-4">
            <CustomInfo
              className="note"
              heading="Note"
              content={t("This filter is created and managed by you")}
              dataTestId="task-self-share-note"
            />
          </div>
          <CustomInfo
            className="note"
            heading="Note"
            content={t(
              "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
            )}
            dataTestId="task-filter-save-note"
          />
        </>
      );
    }
  
    if (viewOnly) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t("This filter is created and managed by {{createdBy}}", {
            createdBy: filter?.createdBy,
          })}
          dataTestId="task-filter-save-note"
        />
      );
    }
  
    if (editRole) {
      return (
        <>
          <div className="pb-4">
            <CustomInfo
              className="note"
              heading="Note"
              content={t("This filter is created and managed by {{createdBy}}", {
                createdBy: filter?.createdBy,
              })}
              dataTestId="task-filter-save-note"
            />
          </div>
          <CustomInfo
            className="note"
            heading="Note"
            content={t(
              "Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards."
            )}
            dataTestId="task-filter-save-note"
          />
        </>
      );
    }
  
    return null;
  };
  
  const renderActionButtons = () => {
    if (filter) {
      if (canAccess && isFilterAdmin) {
        return (
          <div className="pt-4 d-flex">
            <CustomButton
              className="me-3"
              variant="secondary"
              size="md"
              label={t("Update This Filter")}
              onClick={() => {
                onClose();
                setShowUpdateModal(true);
              }}
              icon={<UpdateIcon color={updateIconColor} />}
              dataTestId="save-task-filter"
              ariaLabel={t("Update This Filter")}
              disabled={isFilterUnchanged}
            />
            <CustomButton
              variant="secondary"
              size="md"
              label={t("Delete This Filter")}
              onClick={() => {
                onClose();
                setShowDeleteModal(true);
              }}
              icon={<DeleteIcon />}
              dataTestId="delete-task-filter"
              ariaLabel={t("Delete This Filter")}
            />
          </div>
        );
      }
      return null;
    }
  
    if (isFilterAdmin) {
      return (
        <div className="pt-4">
          <CustomButton
            variant="secondary"
            size="md"
            label={t("Save This Filter")}
            onClick={saveCurrentFilter}
            icon={<SaveIcon color={saveIconColor} />}
            dataTestId="save-task-filter"
            ariaLabel={t("Save Task Filter")}
            disabled={isButtonDisabled}
          />
        </div>
      );
    }
  
    return null;
  };
  
  const saveFilterTab = () => (
    <>
      <FormInput
        name="filter-name"
        type="text"
        label={t("Filter Name")}
        ariaLabel={t("TaskFilter Name")}
        dataTestId="task-filter-name"
        value={filterName}
        onChange={handleFilterName}
        isInvalid={!!filterNameError}
        onBlur={handleNameError}
        feedback={filterNameError}
        disabled={viewOnly}
      />
  
      <div className="pt-4 pb-4">
        <InputDropdown
          Options={filterShareOptions}
          dropdownLabel={t("Share This Filter With")}
          isAllowInput={false}
          ariaLabelforDropdown={t("filter sharing dropdown")}
          dataTestIdforInput="share-filter-input"
          dataTestIdforDropdown="share-filter-options"
          selectedOption={shareFilter}
          setNewInput={setShareFilter}
          disabled={viewOnly}
        />
        {shareFilter === SPECIFIC_USER_OR_GROUP && (
          <div className="d-flex filter-dropdown">
            <div className="L-style"></div>
            <InputDropdown
              Options={candidateOptions}
              isAllowInput={false}
              ariaLabelforDropdown={t("candidate dropdown")}
              ariaLabelforInput={t("candidate input")}
              dataTestIdforInput="candidate-options-input"
              dataTestIdforDropdown="candidate-options"
              selectedOption={filterRole}
              setNewInput={setFilterRole}
              disabled={viewOnly}
            />
          </div>
        )}
      </div>
  
      {renderOwnershipNote()}
      {renderActionButtons()}
    </>
  );
  
  const tabs = [
    {
      eventKey: "parametersTab",
      title: t("Parameters"),
      content: parametersTab(),
    },
    { eventKey: "columnsTab", title: t("Columns"), content: columnsTab() },
    { eventKey: "settingsTab", title: t("Settings"), content: settingsTab() },
    { eventKey: "saveFilterTab", title: t("Save"), content: saveFilterTab() },
  ];

  const currentFilterName = () => {
    if (filter) {
      return `${t("Tasks")}: ${filter.name}`;
    }


    else {
      return (t("Tasks: Unsaved Filter"));
    }
  }

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered
        data-testid="create-filter-modal"
        aria-labelledby={t("create filter modal title")}
        aria-describedby="create-filter-modal"
        backdrop="static"
        className="create-filter-modal"
      >
        <Modal.Header>
          <Modal.Title id="create-filter-title">
            <b>{currentFilterName()}</b>
          </Modal.Title>
          <div className="d-flex align-items-center">
            <CloseIcon onClick={cancelFilter} style={{ cursor: 'pointer' }} />
          </div>
        </Modal.Header>

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
          />
          <CustomButton
            variant="secondary"
            size="md"
            label={t("Cancel")}
            onClick={cancelFilter}
            dataTestId="cancel-task-filter"
            ariaLabel={t("Cancel filter")}
          />
        </Modal.Footer>
      </Modal>

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
            onClose();
          }}
          onClose={() => setShowDeleteModal(false)}
          primaryBtnText={t("No, Keep This Filter")}
          secondaryBtnText={t("Yes, Delete This Filter For Everybody")}
          secondaryBtnAction={handleFilterDelete}
          secondoryBtndataTestid ="confirm-revert-button"
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


          primaryBtnAction={() => { setShowUpdateModal(false) }}
          onClose={() => setShowUpdateModal(false)}
          primaryBtnText={t("No, Cancel Changes")}
          secondaryBtnText={t("Yes, Update This Filter For Everybody")}
          secondaryBtnAction={saveCurrentFilter}
          secondoryBtndataTestid ="confirm-revert-button"
        />
      )}
    </>
  );


};

TaskFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filter: PropTypes.object,
  canEdit: PropTypes.bool,
};

export default TaskFilterModal;