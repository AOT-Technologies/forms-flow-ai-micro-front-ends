import Modal from 'react-bootstrap/Modal';
import { CloseIcon, PencilIcon, SaveIcon, CustomButton, CustomTabs, InputDropdown, FormInput, CustomInfo, DragandDropSort } from '@formsflow/components';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {  MAX_RESULTS, PRIVATE_ONLY_YOU } from '../constants/index';
import { StorageService } from '@formsflow/service';
import { Filter, FilterCriteria, UserDetail } from '../types/taskFilter';
import _ from "lodash";
import { setBPMFilterSearchParams, setBPMTaskLoader } from '../actions/taskActions';
import { fetchServiceTaskList, saveFilters } from '../api/services/filterServices';
import { useDispatch } from 'react-redux';



export const AttributeFilterModal = ({ show, onClose, selectedFilter, taskAttributeData, filterParams, setFilterParams }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const computedStyle = getComputedStyle(document.documentElement);
    const baseColor = computedStyle.getPropertyValue("--ff-primary");
    const whiteColor = computedStyle.getPropertyValue("--ff-white");
    const [filterNameError, setFilterNameError] = useState('');
    const [filterName, setFilterName] = useState('');
    const [shareAttrFilter, setShareAttrFilter] = useState(PRIVATE_ONLY_YOU);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const firstResult = useSelector((state : any) => state.task.firstResult);

    const userRoles = JSON.parse(StorageService.get(StorageService.User.USER_ROLE));
    const isCreateFilters = userRoles?.includes("create_filters");
    const filterNameLength = 50;

    useEffect(() => {
        StorageService.getParsedData(StorageService.User.USER_DETAILS) && 
        setUserDetail(StorageService.getParsedData(StorageService.User.USER_DETAILS));
    }, [shareAttrFilter]);

   
    const handleNameError = (e) => {
        const value = e.target.value;
        setFilterName(value);
        setFilterNameError(
            value.length >= filterNameLength 
              ? t("Filter name should be less than {{filterNameLength}} characters", { filterNameLength: filterNameLength }) 
              : ""
          );
    };

    const cancelFilter = () => {
        onClose();
    }

    const userListResponse = useSelector((state: any) => state.task.userList) || { data: [] };
    const userList = userListResponse?.data || [];
    const searchParams = useSelector((state: any) => state.task.searchParams);


    const assigneeOptions = useMemo(() => userList.map(user => ({
        value: user.username,
        label: user.username,
    })), [userList]);

    const [attributeData, setAttributeData] = useState(() => {
        return taskAttributeData.reduce((acc, item) => {
            if (item.isChecked) {
                acc[item.key] = filterParams[item.key] || ''; 
            }
            return acc;
        }, {});
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAttributeData(prevData => {
            const updatedData = { ...prevData, [name]: value };
            setFilterParams({ ...filterParams, [name]: value });
            return updatedData;
        });
    };

    const handleSelectChange = (name, selectedValue) => {
        console.log(selectedFilter,"SELECTED FILTER");

        setAttributeData(prevData => {
            const updatedData = { ...prevData, [name]: selectedValue };
            setFilterParams({ ...filterParams, [name]: selectedValue });
            return updatedData;
        });
    };

    const getTaskAccess = () => {
        const users = selectedFilter?.users?.length ? [...selectedFilter.users] : [];
        const roles = selectedFilter?.roles?.length ? [...selectedFilter.roles] : [];
    
        return { users, roles };
    };
    
    const getNonEmptyTaskAccess = () => {
        const { users, roles } = getTaskAccess();
    
        return users.length ? users : roles.length ? roles : undefined;
    };
     

    const createFilterShareOption = (labelKey, value) => ({
        label: t(labelKey),
        value,
        onClick: () => setShareAttrFilter(value),
    });

    const filterShareOptions = [
        createFilterShareOption('Nobody (Keep it private)', PRIVATE_ONLY_YOU),
        createFilterShareOption(
            'Share with same users as the selected tasks filter', getNonEmptyTaskAccess()
           
        )
    ];
  
const attrFilterName = (e) => {
    setFilterName(e.target.value);
}


    

const getFilterData   =  (customParams = searchParams): Filter => {
    const assignee = getAssignee();
    
    const criteria = {
        ...selectedFilter.criteria,
        processVariables: customParams
    };

    const { roles, users } = getTaskAccess();
    criteria.assignee = assignee;
   

    return {
        name: filterName,
        criteria,
        parentFilterId: selectedFilter.id,
        roles,
        users,
        variables: selectedFilter.variables,
        filterType: 'ATTRIBUTE'
    };
};

    
    
const getAssignee = () => {
    const assigneeItem = taskAttributeData.find(item => item.key === "assignee");
    if (assigneeItem) {
        const value = attributeData[assigneeItem.key];
        return value ? value : selectedFilter.criteria.assignee;
    }
    return selectedFilter.criteria.assignee;
};

const buildUpdatedFilterParams = () => {
    const updatedFilterParams: { name: string; operator: string; value: string }[] = [];
  
    updatedFilterParams.push({
      name: 'formId',
      operator: 'eq',
      value: selectedFilter.properties.formId
    });
  
    taskAttributeData.forEach(item => {
      const value = attributeData[item.key];
  
      if (item.isChecked && item.key !== 'assignee' && value && item.key !== 'formId') { 
        updatedFilterParams.push({
          name: item.key,
          operator: 'eq',
          value: item.key === 'applicationId' ? JSON.parse(value) : value
        });
      }
    });
  
    return updatedFilterParams;
  };
  
    


  const searchFilterAttributes = () => {
    dispatch(setBPMTaskLoader(true));
  
    const updatedParams = buildUpdatedFilterParams();
  
    dispatch(setBPMFilterSearchParams(updatedParams));
    setFilterParams(updatedParams);
    console.log(updatedParams,"UPDATED PARAMS");
  
    dispatch(
      fetchServiceTaskList(getFilterData(updatedParams), null, firstResult, MAX_RESULTS)
    );
  
    onClose();
  };
  

    
    
    const saveFilterAttributes = () => {
        const updatedParams = buildUpdatedFilterParams();
        const { roles, users } = getTaskAccess();
        const assignee = getAssignee();
      
        const criteria: FilterCriteria = {
          ...selectedFilter.criteria,
          processVariables: updatedParams
        };
      
      
        criteria.assignee = assignee;
        
      
        const filterToSave = ({
            name: filterName,
            criteria,
            parentFilterId: selectedFilter.id,
            roles,
            users,
            variables: selectedFilter.variables,
            filterType: 'ATTRIBUTE'
          });
        
          saveFilters(filterToSave);
          onClose();
        };
      
    
    
    
    

    const getIconColor = (disabled) => disabled ? whiteColor : baseColor;
    const isInvalidFilter = !(filterName?.trim()) || filterNameError || !isCreateFilters;  
    const isButtonDisabled = isInvalidFilter;
    const iconColor = getIconColor(isInvalidFilter);

    const parametersTab = () => (
        <>
            {taskAttributeData.map((item) => {
                        console.log(taskAttributeData,"TASK ATTRIBUTE DATA");

                if (item.isChecked && item.type !== 'datetime') {
                    if (item.key === "assignee") {
                        return (
                            <div className='pt-4' key={item.key}>
                                <InputDropdown
                                    Options={assigneeOptions}
                                    dropdownLabel={t(item.label)}
                                    isAllowInput={false}
                                    ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
                                    ariaLabelforInput={t(`input for attribute ${item.label}`)}
                                    selectedOption={attributeData[item.key]}
                                    setNewInput={(selectedOption) => handleSelectChange(item.key, selectedOption)}
                                    name={item.key}
                                />
                            </div>
                        );
                    } else {
                        return (
                            <div className='pt-4' key={item.key}>
                                <FormInput
                                    name={item.key}
                                    type={item.type}
                                    label={t(item.label)}
                                    aria-label={t(item.label)}
                                    value={attributeData[item.key]}
                                    onChange={handleInputChange}
                                />
                            </div>
                        );
                    }
                }
                return null;
            })}
        </>
    );

    const saveFilterTab = () => (
        <>
            <FormInput
                name="filterName"
                type="text"
                label={t("Filter Name")}
                aria-label={t("Filter Name")}
                maxLength={200}
                value={filterName}
                onChange={attrFilterName}
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
                    ariaLabelforDropdown={t("attribute filter sharing dropdown")}
                    selectedOption={shareAttrFilter}
                    setNewInput={setShareAttrFilter}
                />
            </div>
            <div>
                <CustomButton
                    variant="secondary"
                    size="md"
                    label={t("Save This Filter")}
                    icon={<SaveIcon color={iconColor} />}
                    dataTestId="save-task-filter"
                    ariaLabel={t("Save Task Filter")}
                    disabled={isButtonDisabled}
                    onClick={saveFilterAttributes}
                />
            </div>
        </>
    );

    const tabs = [
        { eventKey: "parametersTab", title: t("Parameters"), content: parametersTab() },
        { eventKey: "saveFilterTab", title: t("Save"), content: saveFilterTab() },
    ];

    const isAtLeastOneAttributeFilled = () => {
        return taskAttributeData.some((item) => {
            if (item.isChecked && item.type !== 'datetime') {
                const value = attributeData[item.key];
                return value !== null && value !== undefined && value !== '';
            }
            return false;
        });
    };
    

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
                    <b>{t("Attributes: Unsaved Filter")}</b>
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
                    onClick={searchFilterAttributes}
                    disabled={!isAtLeastOneAttributeFilled()}
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

AttributeFilterModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    filterParams: PropTypes.object.isRequired,
    setFilterParams: PropTypes.func.isRequired,
};

export default AttributeFilterModal;
