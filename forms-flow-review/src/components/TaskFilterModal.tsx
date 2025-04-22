import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import { CloseIcon, PencilIcon, SaveIcon, CustomButton, CustomTabs, InputDropdown, FormInput, CustomInfo, DragandDropSort } from '@formsflow/components';
import { removeTenantKey, trimFirstSlash } from "../helper/helper.js";
import { ACCESSIBLE_FOR_ALL_GROUPS, MAX_RESULTS, MULTITENANCY_ENABLED, PRIVATE_ONLY_YOU, SPECIFIC_USER_OR_GROUP } from '../constants/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchServiceTaskList, fetchTaskVariables, fetchUserList, getUserRoles, saveFilters, updateDefaultFilter } from '../api/services/filterServices';
import { setDefaultFilter, setUserGroups } from '../actions/taskActions';
import { Filter, FilterCriteria, UserDetail } from '../types/taskFilter.js';
import { StorageService } from '@formsflow/service';
import { FormSelectionModal } from "./FormSelectionModal";

export const TaskFilterModal = ({ show, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const computedStyle = getComputedStyle(document.documentElement);
    const baseColor = computedStyle.getPropertyValue("--ff-primary");
    const whiteColor = computedStyle.getPropertyValue("--ff-white");
    const filterNameLength = 50;
    const [accessDropdownValue, setAccessDropdownValue] = useState('specificRole');
    const [specificRole, setSpecificRole] = useState('');
    const [specificAssignee, setSpecificAssignee] = useState('');
    const [sortValue, setSortValue] = useState('dueDate');
    const [sortOrder, setSortOrder] = useState('asc');
    const [dataLineValue, setDataLineValue] = useState(1);
    const [shareFilter, setShareFilter] = useState(PRIVATE_ONLY_YOU);
    const [filterRole, setFilterRole] = useState([]);
    const [filterName, setFilterName] = useState('');
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [filterNameError, setFilterNameError] = useState('');
    const [selectedForm, setSelectedForm] = useState({formId:'',formName:''});
    const [variableArray, setVariableArray] = useState([]);
    const [showFormSelectionModal, setShowFormSelectionModal] = useState(false);
    
  
    const {
        userList = { data: [] },
        userGroups: candidateGroups = { data: [] },
        firstResult,
        defaultFilter,
      } = useSelector((state: any) => state.task);
      
    const userListData = userList.data ?? [];
    const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
    const userRoles = StorageService.getParsedData(StorageService.User.USER_ROLE)
    const isCreateFilters = userRoles?.includes("create_filters");


    const assigneeOptions = useMemo(() => userListData.map(user => ({
        value: user.username,
        label: user.username,
    })), [userListData]);

    useEffect(() => {
        StorageService.getParsedData(StorageService.User.USER_DETAILS) && 
        setUserDetail(StorageService.getParsedData(StorageService.User.USER_DETAILS));
    }, [shareFilter]);

    useEffect(() => {
        getUserRoles()
            .then(res => res && dispatch(setUserGroups(res.data)))
            .catch(error => console.error("error", error));
    }, []);

    useEffect(() => {
        if (accessDropdownValue === "specificRole") dispatch(fetchUserList());
    }, [accessDropdownValue]);

    useEffect(() => {
        const properties = getProperties();
        if (properties.formId) {
            setSelectedForm({ formId: properties.formId || "", formName: "" });            
            handleFetchTaskVariables(properties?.formId);
        }
    }, []);

    const handleFilterName = (e) => setFilterName(e.target.value);

    const handleNameError = (e) => {
        const value = e.target.value;
        setFilterName(value);
        setFilterNameError(
            value.length >= filterNameLength 
              ? t("Filter name should be less than {{filterNameLength}} characters", { filterNameLength: filterNameLength }) 
              : ""
          );
    };

    const accessOptions = [
        { label: t('Specific role'), value: 'specificRole', onClick: () => candidateOptions },
        { label: t('Specific assignee'), value: 'specificAssignee', onClick: () => assigneeOptions },
    ];

    const candidateOptions = useMemo(() => {
        const filteredGroups = candidateGroups.filter(group => group.permissions.includes("manage_all_filters"));
        return MULTITENANCY_ENABLED
            ? filteredGroups.map(group => ({
                value: removeTenantKey(group.name, tenantKey),
                label: removeTenantKey(group.name, tenantKey),
            }))
            : filteredGroups.map(group => ({
                value: trimFirstSlash(group.name),
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
        { label: t(ascLabel), value: 'asc' },
        { label: t(descLabel), value: 'desc' },
    ];
    
    const sortOptions = {
        created: createSortOptions('Oldest to Newest', 'Newest to Oldest'),
        dueDate: createSortOptions('Oldest to Newest', 'Newest to Oldest'),
        assignee: createSortOptions('A to Z', 'Z to A'),
        name: createSortOptions('A to Z', 'Z to A'),
        formName: createSortOptions('A to Z', 'Z to A'),
        applicationId: createSortOptions('Largest to Smallest', 'Smallest to Largest'),
    };

    const getIconColor = (disabled) => disabled ? whiteColor : baseColor;
    const isInvalidFilter = !filterName.trim() || filterNameError || !isCreateFilters || (shareFilter === SPECIFIC_USER_OR_GROUP && filterRole.length === 0);  ;
    const isButtonDisabled = isInvalidFilter;
    const iconColor = getIconColor(isInvalidFilter);

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
        createFilterShareOption('Nobody(Keep it private)', PRIVATE_ONLY_YOU),
        createFilterShareOption('Everybody', ACCESSIBLE_FOR_ALL_GROUPS),
        createFilterShareOption('Specific role', SPECIFIC_USER_OR_GROUP),
    ];

    const getCriteria = (): FilterCriteria => {
        const criteria = {
            candidateGroupsExpression: "${currentUserGroups()}",
            processVariables: [{
                name: "formId",
                operator: 'eq',
                value: selectedForm.formId
            }],
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
                : specificRole;
        }
    
        if (specificAssignee) {
            criteria.assignee = specificAssignee;
        }
    
        return criteria;
    };
    
    
    


    const getProperties = () => ({
        displayLinesCount: dataLineValue,
        formId: selectedForm.formId
    });

    const getRoles = () => {
        let roles = [];
        if (shareFilter === SPECIFIC_USER_OR_GROUP && typeof filterRole === 'string') {
            roles.push(filterRole);
        }
        return roles;
    };

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
    

    const handleUpdateOrder = (updatedItems) => {
        const updatedVariableArray = updatedItems.map((item, index) => ({
            ...item,
            sortOrder: index + 1,
        }));
        if (JSON.stringify(updatedVariableArray) !== JSON.stringify(variableArray)) {
            setVariableArray(updatedVariableArray);
        }
    };

    const getUsers = () => {
        let users = [];
        if (shareFilter === PRIVATE_ONLY_YOU) {
            users.push(userDetail.preferred_username);
        }
        return users;
    };

    const getData = (): Filter => ({
        name: filterName,
        criteria: getCriteria(), 
        variables: variableArray, 
        properties: getProperties(), 
        roles: getRoles(), 
        users: getUsers(),
        taskVisibleAttributes: {
            applicationId: true,
            assignee: true,
            created: true,
            dueDate: true,
            followUp: true,
            priority: true
        }
    });
    
    

    const filterResults = () => {
        dispatch(fetchServiceTaskList(getData(), null, firstResult, MAX_RESULTS, (error) => {
            if (error) {
                console.error("Error fetching tasks:", error);
                return;
            }
            onClose();
        }));
    };

    const saveCurrentFilter = () => {
        saveFilters(getData())
            .then(res => {
                const savedFilterId = res.data.id;
                const isDefaultFilter = savedFilterId === defaultFilter ? null : savedFilterId;
                updateDefaultFilter(isDefaultFilter)
                    .then(updateRes => dispatch(setDefaultFilter(updateRes.data.defaultFilter)))
                    .catch(error => console.error("Error updating default filter:", error));
                onClose();
            })
            .catch(error => console.error("Error saving filter:", error));
    };

    const cancelFilter = () => {
        setSpecificRole("");
        setSpecificAssignee("");
        setFilterName("");
        setSortValue("dueDate");
        setSortOrder("asc");
        setShareFilter(PRIVATE_ONLY_YOU);
        setVariableArray([]);
        onClose();
    };
    const handleModalclose = () => {
        setShowFormSelectionModal(false);
      };
      const handleFormSelectionModal = (selectedFormObj) => {
        setSelectedForm(selectedFormObj);
        handleFetchTaskVariables(selectedFormObj.formId);
        setShowFormSelectionModal(false);
       }
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
          <FormInput
            className="task-form-filter"
            name="title"
            type="text"
            label={t("Form")}
            ariaLabel={t("Name of the form")}
            dataTestId="form-name-input"
            icon={
              <PencilIcon data-testid="close-input" aria-label="Close input" />
            }
            maxLength={200}
            value={selectedForm.formName}
            onIconClick={() => setShowFormSelectionModal(true)}
          />
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
                content={t("Toggle the visibility of columns and re-order them as per your requirement")}
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
            {sortValue && sortOptions[sortValue] ? renderDropdown(sortOptions[sortValue]) : null}
            <div className='pt-4'>
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

    const saveFilterTab = () => (
        <>
            <FormInput
                name="filter-name"
                type="text"
                label={t("Filter Name")}
                ariaLabel={t("Task Filter Name")}
                dataTestId="task-filter-name"
                value={filterName}
                onChange={handleFilterName}
                isInvalid={!!filterNameError}
                onBlur={handleNameError}
                feedback={filterNameError}
            />

            <div className='pt-4 pb-4'>
                <InputDropdown
                    Options={filterShareOptions}
                    dropdownLabel={t("Share This Filter With")}
                    isAllowInput={false}
                    ariaLabelforDropdown={t("filter sharing dropdown")}
                    dataTestIdforInput="share-filter-input"
                    dataTestIdforDropdown="share-filter-options"
                    selectedOption={shareFilter}
                    setNewInput={setShareFilter}
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
                        />
                    </div>
                )}
            </div>
            <CustomInfo
                className="note"
                heading="Note"
                content={t("Column widths are saved within a filter. If you wish to adjust them. Click Filter Results, adjust the widths of the columns in the table until you are happy and then save the filter afterwards.")}
                dataTestId="task-filter-save-note"
            />
            <div className='pt-4'>
                <CustomButton
                    variant="secondary"
                    size="md"
                    label={t("Save This Filter")}
                    onClick={saveCurrentFilter}
                    icon={<SaveIcon color={iconColor} />}
                    dataTestId="save-task-filter"
                    ariaLabel={t("Save Task Filter")}
                    disabled={isButtonDisabled}
                />
            </div>
        </>
    );

    const tabs = [
        { eventKey: "parametersTab", title: t("Parameters"), content: parametersTab() },
        { eventKey: "columnsTab", title: t("Columns"), content: columnsTab() },
        { eventKey: "settingsTab", title: t("Settings"), content: settingsTab() },
        { eventKey: "saveFilterTab", title: t("Save"), content: saveFilterTab() },
    ];

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="sm"
            centered={true}
            data-testid="create-filter-modal"
            aria-labelledby={t("create filter modal title")}
            aria-describedby="create-filter-modal"
            backdrop="static"
            className='create-filter-modal'
        >
            <Modal.Header>
                <Modal.Title id="create-filter-title">
                    <b>{t("Tasks: Unsaved Filter")}</b>
                </Modal.Title>
                <div className="d-flex align-items-center">
                    <CloseIcon onClick={onClose} />
                </div>
            </Modal.Header>
            <Modal.Body className='modal-body p-0'>
                <div className='filter-tab-container'>
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
    );
};

TaskFilterModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default TaskFilterModal;