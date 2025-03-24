import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import { CloseIcon, PencilIcon, SaveIcon, CustomButton, CustomTabs, InputDropdown, FormInput, CustomInfo, DragandDropSort } from '@formsflow/components';
import { removeTenantKey, trimFirstSlash } from "../helper/helper.js";
import { ACCESSIBLE_FOR_ALL_GROUPS, MAX_RESULTS, MULTITENANCY_ENABLED, PRIVATE_ONLY_YOU, SPECIFIC_USER_OR_GROUP } from '../constants/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchServiceTaskList, fetchTaskVariables, fetchUserList, getUserRoles, saveFilters, updateDefaultFilter } from '../services/bpmTaskServices';
import { setDefaultFilter, setUserGroups } from '../actions/taskActions';
import { Filter, UserDetail } from '../types/taskFilter.js';
import { StorageService } from '@formsflow/service';

export const TaskFilterModal = ({ show, onClose }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const computedStyle = getComputedStyle(document.documentElement);
    const baseColor = computedStyle.getPropertyValue("--ff-primary");
    const whiteColor = computedStyle.getPropertyValue("--ff-white");

    const [accessDropdownValue, setAccessDropdownValue] = useState('specificRole');
    const [specificRole, setSpecificRole] = useState('');
    const [specificAssignee, setSpecificAssignee] = useState('');
    const [sortValue, setSortedValue] = useState('dueDate');
    const [sortOrder, setSortOrder] = useState('asc');
    const [dataLineValue, setDataLineValue] = useState(1);
    const [shareFilter, setShareFilter] = useState(PRIVATE_ONLY_YOU);
    const [filterRole, setFilterRole] = useState([]);
    const [filterName, setFilterName] = useState('');
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [filterNameError, setFilterNameError] = useState('');
    const [selectedForm, setSelectedForm] = useState(null);
    const [variableArray, setVariableArray] = useState([]);

    const userListResponse = useSelector((state: any) => state.task.userList) || { data: [] };
    const userList = userListResponse?.data || [];
    const candidateGroups = useSelector((state: any) => state.task.userGroups) || { data: [] };
    const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
    const firstResult = useSelector((state: any) => state.task.firstResult);
    const defaultFilter = useSelector((state: any) => state.task.defaultFilter);

    const assigneeOptions = useMemo(() => userList.map(user => ({
        value: user.username,
        label: user.username,
    })), [userList]);

    useEffect(() => {
        const userDetails = StorageService.get(StorageService.User.USER_DETAILS);
        if (userDetails) setUserDetail(JSON.parse(userDetails));
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
            setSelectedForm(properties.formId || null);
            handleFetchTaskVariables(properties?.formId);
        }
    }, []);

    const handleFilterName = (e) => setFilterName(e.target.value);

    const handleNameError = (e) => {
        const value = e.target.value;
        setFilterName(value);
        setFilterNameError(value.length >= 50 ? t("filter_name_error") : "");
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
        onClick: () => setSortedValue(value),
    });
    
    const dateSortOptions = [
        createDateSortOption('Due Date', 'dueDate'),
        createDateSortOption('Created Date', 'created'),
        createDateSortOption('Assignee', 'assignee'),
        createDateSortOption('Task', 'name'),
        createDateSortOption('Form Name', 'formName'),
        createDateSortOption('Submission ID', 'submissionId'),
    ];

    const createSortOptions = (ascLabel, descLabel) => [
        { label: t(ascLabel), value: 'asc' },
        { label: t(descLabel), value: 'desc' },
    ];
    
    const sortOptions = {
        createdDate: createSortOptions('Oldest to Newest', 'Newest to Oldest'),
        dueDate: createSortOptions('Oldest to Newest', 'Newest to Oldest'),
        assignee: createSortOptions('A to Z', 'Z to A'),
        task: createSortOptions('A to Z', 'Z to A'),
        formName: createSortOptions('A to Z', 'Z to A'),
        submissionId: createSortOptions('Largest to Smallest', 'Smallest to Largest'),
    };

    const getIconColor = (disabled) => disabled ? whiteColor : baseColor;

    const renderDropdown = (options) => (
        <div className="d-flex filter-dropdown">
            <div className="L-style"></div>
            <InputDropdown
                Options={options}
                isAllowInput={false}
                ariaLabelforDropdown="dropdown for selecting dependent options"
                ariaLabelforInput="input for typing dependent option"
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

    const getCriteria = () => ({
        processVariables: [],
        candidateGroupsExpression: "${currentUserGroups()}",
        candidateGroup: MULTITENANCY_ENABLED && specificRole
            ? tenantKey + '-' + trimFirstSlash(specificRole)
            : specificRole,
        assignee: specificAssignee,
        sorting: [{ sortBy: sortValue, sortOrder: sortOrder }]
    });

    const getProperties = () => ({
        displayLinesCount: dataLineValue,
        formId: "6721debe9c3135103599ba2b"
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
                    { key: 'submissionId', label: 'Submission ID', type: 'textfield', name: 'Submission ID', isChecked: true, sortOrder: 1, isTaskVariable: false },
                    { key: 'assignee', label: 'Assignee', type: 'textfield', name: 'Assignee', isChecked: true, sortOrder: 2, isTaskVariable: false },
                    { key: 'task', label: 'Task', type: 'textfield', name: 'Task', isChecked: true, sortOrder: 3, isTaskVariable: false },
                    { key: 'createdDate', label: 'Created Date', type: 'datetime', name: 'Created Date', isChecked: true, sortOrder: 4, isTaskVariable: false },
                    { key: 'formName', label: 'Form Name', type: 'textfield', name: 'Form Name', isChecked: true, sortOrder: 5, isTaskVariable: false },
                ];
                const dynamicVariables = taskVariables.map((variable, index) => ({
                    ...variable,
                    name: variable.label,
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
        dispatch(fetchServiceTaskList(getData(), null, firstResult, MAX_RESULTS, (error, taskData) => {
            if (error) {
                console.error("Error fetching tasks:", error);
                return;
            }
            const taskWithId = taskData.find(task => task.id);
            if (!taskWithId) {
                onClose();
                return;
            }
            const isDefaultFilter = taskWithId === defaultFilter ? null : taskWithId;
            updateDefaultFilter(isDefaultFilter)
                .then(updateRes => dispatch(setDefaultFilter(updateRes.data.defaultFilter)))
                .catch(err => console.error("Error updating default filter:", err));
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
        setSortedValue("dueDate");
        setSortOrder("asc");
        setShareFilter(PRIVATE_ONLY_YOU);
        setVariableArray([]);
        onClose();
    };

    const parametersTab = () => (
        <>
            <InputDropdown
                Options={accessOptions}
                dropdownLabel={t("Tasks Accessible To")}
                isAllowInput={false}
                ariaLabelforDropdown={t("dropdown for selecting options")}
                ariaLabelforInput={t("input for typing option")}
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
                        selectedOption={specificAssignee}
                        setNewInput={setSpecificAssignee}
                        name="assigneeOptions"
                    />
                </div>
            )}
            <div className='pt-4'>
                <FormInput
                    className='task-form-filter'
                    name="title"
                    type="text"
                    label={t("Form")}
                    aria-label={t("Name of the form")}
                    icon={<PencilIcon data-testid="close-input" aria-label="Close input" />}
                    maxLength={200}
                    value={selectedForm}
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
            />
            <DragandDropSort
                items={variableArray}
                onUpdate={handleUpdateOrder}
            />
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
                selectedOption={sortValue}
                setNewInput={setSortedValue}
            />
            {sortValue && sortOptions[sortValue] ? renderDropdown(sortOptions[sortValue]) : null}
            <div className='pt-4'>
                <InputDropdown
                    Options={dataLineCount}
                    dropdownLabel={t("How Many Line of Data To Show Per Row?")}
                    isAllowInput={false}
                    ariaLabelforDropdown={t("line of data dropdown ")}
                    ariaLabelforInput={t("line of data input")}
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
                aria-label={t("Filter Name")}
                maxLength={200}
                value={filterName}
                onChange={handleFilterName}
                isInvalid={!!filterNameError}
                onBlur={handleNameError}
            />
            {filterNameError && (
                <div className="validation-text">
                    {filterNameError}
                </div>
            )}
            <div className='pt-4 pb-4'>
                <InputDropdown
                    Options={filterShareOptions}
                    dropdownLabel={t("Share This Filter With")}
                    isAllowInput={false}
                    ariaLabelforDropdown={t("filter sharing dropdown")}
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
            />
            <div className='pt-4'>
                <CustomButton
                    variant="secondary"
                    size="md"
                    label={t("Save This Filter")}
                    onClick={saveCurrentFilter}
                    icon={<SaveIcon color={getIconColor(filterName.length === 0 || filterNameError)} />}
                    dataTestId="save-task-filter"
                    ariaLabel={t("Save Task Filter")}
                    disabled={!filterName.trim()}
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
                        dataTestId="create-filter-tabs"
                        ariaLabel={t("Filter Tabs")}
                    />
                </div>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-start">
                <CustomButton
                    variant="primary"
                    size="md"
                    label={t("Filter Results")}
                    dataTestId="filter-results"
                    ariaLabel={t("Filter results")}
                    disabled={(specificRole === "" && specificAssignee === "")}
                    onClick={filterResults}
                />
                <CustomButton
                    variant="secondary"
                    size="md"
                    label={t("Cancel")}
                    onClick={cancelFilter}
                    dataTestId="cancel-filter"
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