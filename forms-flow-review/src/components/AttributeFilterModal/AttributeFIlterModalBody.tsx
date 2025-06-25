import {
  CustomButton,
  CustomTabs,
  DeleteIcon,
  FormInput,
  InputDropdown,
  SaveIcon,
  UpdateIcon,
  useSuccessCountdown,
} from "@formsflow/components";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  createFilter,
  fetchServiceTaskList,
  getUserRoles,
} from "../../api/services/filterServices";
import isEqual from "lodash/isEqual";

import { setAttributeFilterList, setAttributeFilterToEdit, setBPMTaskListActivePage, setBPMTaskLoader, setIsUnsavedAttributeFilter, setSelectedBpmAttributeFilter, setUserGroups } from "../../actions/taskActions";
import { MULTITENANCY_ENABLED, PRIVATE_ONLY_YOU } from "../../constants"; 
import { StyleServices } from "@formsflow/service";
import ParametersTab from "./ParametersTab";
import RenderOwnerShipNotes from "./Notes";
import { userRoles } from "../../helper/permissions";
import { cloneDeep } from "lodash";
import { Filter, FilterCriteria } from "../../types/taskFilter"; 
import { removeTenantKey, trimFirstSlash } from "../../helper/helper";
import { RootState } from "../../reducers";

const AttributeFilterModalBody = ({ onClose, toggleUpdateModal, updateSuccess, toggleDeleteModal,deleteSuccess, handleSaveFilterAttributes }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterNameLength = 50;
  const { manageAllFilters,createFilters } = userRoles();
  
  const baseColor = StyleServices.getCSSVariable("--ff-primary");
  const whiteColor = StyleServices.getCSSVariable("--ff-white");
 let updateButtonVariant = "secondary"; // Default value
  if (updateSuccess.showSuccess) {
    updateButtonVariant = "success";
  }
 let deleteButtonVariant = "secondary"; // Default value
  if (deleteSuccess.showSuccess) {
    deleteButtonVariant = "success";
  }

  const {
  successState: saveSuccess,
  startSuccessCountdown: setSaveSuccess,
} = useSuccessCountdown();

 
  const limit = useSelector((state: any) => state.task.limit);
  const selectedFilter = useSelector((state: any) => state.task.selectedFilter);
  const selectedAttributeFilter = useSelector((state: any) => state.task.selectedAttributeFilter);
  const candidateGroups = useSelector((state: any) => state.task.userGroups);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const userDetails = useSelector((state: any) => state.task.userDetails);
  const attributeFilterList = useSelector((state:RootState)=>state.task.attributeFilterList);
  const isUnsavedFilter = useSelector((state:RootState)=>state.task.isUnsavedFilter);
  const getIconColor = (disabled) => (disabled ? whiteColor : baseColor);
  const [filterNameError, setFilterNameError] = useState("");
    const attributeFilter = useSelector(
    (state: any) => state.task.attributeFilterToEdit
  );
  const [filterName, setFilterName] = useState(attributeFilter?.name || "");
  const deleteIconColor = getIconColor(updateSuccess?.showSuccess);
  const { data: userList } = useSelector(
    (state: any) => state.task.userList
  ) ?? {
    data: [],
  };

  const taskVariables = selectedFilter?.variables ?? [];

  const exisitngProcessvariables =
    attributeFilter?.criteria?.processVariables ?? [];

  const isCheckedData = taskVariables.reduce((acc, item) => {
    acc[item.key] = item.isChecked;
    return acc;
  }, {});
  //Handle if existing data is there need to set it in attributeData
 const [attributeData, setAttributeData] = useState(() => {
  const initialData = {
    assignee: attributeFilter?.criteria?.assignee || ""
  };

  const existingValues = (
    exisitngProcessvariables.reduce((acc, item) => {
      if (isCheckedData[item.name]) {
        let resetValue = item.value;

        // Remove '%' from displaying
        if (typeof resetValue !== "number" || item.name !== "applicationId") {
          resetValue = resetValue.replace(/%/g, '');
        }

        acc[item.name] = resetValue;
      }
      return acc;
    }, {}) || {}
  );

  return { ...initialData, ...existingValues };
});

  const FILTER_SHARE_OPTIONS = {
  PRIVATE: 'PRIVATE_ONLY_YOU',
  SAME_AS_TASKS: 'SAME_AS_TASK_FILTER',
};
  
  const [shareAttrFilter, setShareAttrFilter] = useState(FILTER_SHARE_OPTIONS.PRIVATE); 
   const saveIconColor = getIconColor(isUnsavedFilter || !filterName || filterNameError|| !shareAttrFilter || deleteSuccess?.showSuccess);


  /* ---------------------------- access management --------------------------- */

  const createdByMe =
    attributeFilter?.createdBy === userDetails?.preferred_username;
  const editRole = manageAllFilters || (createdByMe && createFilters);

  /* ---------------------------- get users groups ---------------------------- */
  useEffect(() => {
    getUserRoles()
      .then((res) => res && dispatch(setUserGroups(res.data)))
      .catch((error) => console.error("error", error));
  }, []);
 
  const handleSelectChange = (name, selectedValue) => {
    setAttributeData((prevData) => ({ ...prevData, [name]: selectedValue }));
  };

  const handleNameError = (e) => {
    const value = e.target.value;
    setFilterName(value);
    if (value.length >= filterNameLength)
      setFilterNameError(
        t("Filter name should be less than {{filterNameLength}} characters", {
          filterNameLength: filterNameLength,
        })
      );
  };

  const assigneeOptions = useMemo(
    () =>
      userList?.map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [userList]
  );

  const candidateOptions = useMemo(() => {
    return candidateGroups.reduce((acc, group) => {
      if (!group.permissions.includes("view_filters")) return acc;
      const name = MULTITENANCY_ENABLED
        ? removeTenantKey(group.name, tenantKey)
        : group.name;

      acc.push({ value: name, label: name });
      return acc;
    }, []);
  }, [candidateGroups, tenantKey]);



  useEffect(() => {
    if(attributeFilter &&(selectedAttributeFilter?.roles.length > 0 || (selectedAttributeFilter?.users.length == 0 && selectedAttributeFilter.roles.length == 0))){ 
      setShareAttrFilter(FILTER_SHARE_OPTIONS.SAME_AS_TASKS);
    }
    getTaskAccess();


}, [attributeFilter]);

const getTaskAccess = () => {
  if (shareAttrFilter === FILTER_SHARE_OPTIONS.PRIVATE) {
    return { users: [userDetails?.preferred_username], roles: [] };
  } else if (shareAttrFilter === FILTER_SHARE_OPTIONS.SAME_AS_TASKS) {
    const users = selectedFilter?.users?.length ? [...selectedFilter.users] : [];
    const roles = selectedFilter?.roles?.length ? [...selectedFilter.roles] : [];
    return { users, roles };
  }

  return { users: [], roles: [] };
};


const createFilterShareOption = (labelKey, value) => ({
  label: t(labelKey),
  value,
  onClick: () => setShareAttrFilter(value),
});



  const filterShareOptions = [
  createFilterShareOption("Nobody (Keep it private)", FILTER_SHARE_OPTIONS.PRIVATE),
  createFilterShareOption(
    "Share with same users as the selected tasks filter",
    FILTER_SHARE_OPTIONS.SAME_AS_TASKS
  ),
];




  const attrFilterName = (e) => {
    setFilterName(e.target.value);
  };
    const getAssignee = () => {
      return  attributeData["assignee"] ||selectedFilter?.criteria?.assignee;
    };

    const getCandidateGroup = () => {
      return  removeSlashFromValue(attributeData["roles"]) ||selectedFilter?.criteria?.candidateGroup;
    };

    const getFilterData = (newProcessVariables): Filter => {
      const assignee = getAssignee();
      const candidateGroup = getCandidateGroup();

      const criteria = {
        ...selectedFilter.criteria,
        processVariables: newProcessVariables,
        assignee,
        candidateGroup
      };

      const { roles, users } = getTaskAccess();

      return {
        name: filterName,
        criteria,
        id: attributeFilter?.id,
        created: attributeFilter?.created,
        modified: attributeFilter?.modified,
        createdBy:attributeFilter?.createdBy,
        modifiedBy:attributeFilter?.modifiedBy,
        parentFilterId: selectedFilter.id,
        roles,
        users,
        variables: selectedFilter.variables,
        filterType: "ATTRIBUTE",
      };
    };
         



    const removeSlashFromValue = (value)=>{
          return MULTITENANCY_ENABLED && value
          ? tenantKey + "-" + trimFirstSlash(value)
          : trimFirstSlash(value);
    }


   const buildNewProcessVariables = () => {
    // need to feth task list based on selected attribute filter
      // need to reset all params
      // need to rest all pagination and date
  if (!selectedFilter) return;

  //this is current selected filter criteria
  const currentCriteria = cloneDeep(selectedFilter.criteria);
  const newProcessVariable = [];

  const types = taskVariables.reduce((acc, item) => {
    acc[item.key] = item.type;
    return acc;
  }, {});

  // TBD:now we don't need assignee and roles inside process variables, miight remove this line after discussion
  const ignoredKeys = ["assignee", "roles"];

  Object.keys(attributeData).forEach((key) => {
  if (!ignoredKeys.includes(key) && attributeData[key]) {
    const isNumberOrAppId = types[key] === "number" || key === "applicationId";
    const operator = isNumberOrAppId ? "eq" : "like";

    let value = attributeData[key];

    if (key === "applicationId") {
      value = JSON.parse(attributeData[key]);
    } else if (key === "roles") {
      value = removeSlashFromValue(attributeData[key]);
    } else if (!isNumberOrAppId) {
      // like search
      value = `%${value}%`;
    }

    newProcessVariable.push({
      name: key,
      operator,
      value,
    });
  }
});


  newProcessVariable.push(...(currentCriteria.processVariables ?? []));

  return newProcessVariable;
};


      

    const searchFilterAttributes = () => {
     
      const newProcessVariables = buildNewProcessVariables(); 
      const newFilterData = getFilterData(newProcessVariables);
      batch(()=>{
      dispatch(setBPMTaskLoader(true));
      dispatch(setSelectedBpmAttributeFilter(newFilterData));
      dispatch(setIsUnsavedAttributeFilter(true));
      dispatch(setBPMTaskListActivePage(1))
      dispatch(fetchServiceTaskList(newFilterData, null, 1, limit));
      })

      onClose();
    };



    const createAttributeFilterPayload =()=>{
      const updatedParams = buildNewProcessVariables();
        const { roles, users } = getTaskAccess(); 
        const assignee = getAssignee();
        const candiateGroup = getCandidateGroup();

        const criteria: FilterCriteria = {
          ...selectedFilter.criteria,
          processVariables: updatedParams,
        };
        criteria.assignee = assignee;
        criteria.candidateGroup = candiateGroup;

        const filterToSave = {
          created: attributeFilter?.created,
          modified: attributeFilter?.modified,
          id: attributeFilter?.id,
          tenant: attributeFilter?.tenant,
          name: filterName,
          criteria,
          parentFilterId: selectedFilter.id,
          roles,
          users,
          variables: selectedFilter.variables,
          status: attributeFilter?.status,
          createdBy: attributeFilter?.createdBy,
          modifiedBy: attributeFilter?.modifiedBy,
          order: attributeFilter?.order,
          hide: attributeFilter?.hide,
          filterType: "ATTRIBUTE",
          editPermission: attributeFilter?.editPermission,
          sortOrder: attributeFilter?.sortOrder,
        };
        return filterToSave;
    }
    const noFieldChanged =  isUnsavedFilter ? false :  isEqual(selectedAttributeFilter, createAttributeFilterPayload());
    const saveFilterAttributes = async () => {
  try {
    const filterToSave = createAttributeFilterPayload();
    const response = await createFilter(filterToSave);

    setSaveSuccess(() => {
      onClose();  
    }, 2);

    // need to update selected attribute filter in redux
    dispatch(setSelectedBpmAttributeFilter(response.data));
    const newAttributeFilterList = [...attributeFilterList, response.data];
    dispatch(setAttributeFilterList(newAttributeFilterList));
    dispatch(fetchServiceTaskList(filterToSave, null, 1, limit));
  } catch (error) {
    console.error("Failed to save filter attributes:", error);
  }
};

const saveButtonVariant = saveSuccess.showSuccess ? "success" : "secondary";


    const handleUpdateModalClick =()=>{
       const isPrivate = attributeFilter.users.length!==0;
    const data = createAttributeFilterPayload();
    if(isPrivate){
     handleSaveFilterAttributes(isPrivate,data);
    }else{
        dispatch(setAttributeFilterToEdit(data))
      toggleUpdateModal();
    }
    
     }
    const handleDeleteClick = ()=>{
            dispatch(setAttributeFilterToEdit(createAttributeFilterPayload()))

      toggleDeleteModal();
    }
  const renderActionButtons = () => {
    if (attributeFilter?.id) { 
      if (editRole ) {
        return (
          <div className="d-flex">
            <CustomButton
              className="me-3"
              variant={updateButtonVariant}
              size="md"
              label={
              updateSuccess.showSuccess ?   `${t("Updated!")} (${updateSuccess.countdown})` : t("Update This Filter")
            }
                onClick={handleUpdateModalClick}
              icon={ updateSuccess?.showSuccess ? 
                null: <UpdateIcon color={saveIconColor} />}
              dataTestId="save-attribute-filter"
              ariaLabel={t("Update This Filter")}
              disabled={deleteSuccess.showSuccess || noFieldChanged || !shareAttrFilter}
            />
            <CustomButton
              variant={deleteButtonVariant}
              size="md"
               label={
              deleteSuccess?.showSuccess ?  `${t("Deleted!")} (${deleteSuccess.countdown})` : t("Delete This Filter")
            }
              onClick={handleDeleteClick}
              icon={deleteSuccess?.showSuccess ? 
                null :<DeleteIcon color={deleteIconColor} />}
              dataTestId="delete-attribute-filter"
              ariaLabel={t("Delete This Filter")}
              disabled={updateSuccess.showSuccess}
            />
          </div>
        );
      }
      return null;
    }

    if (createFilters ) {
      return (
        <div className="pt-4">
          <CustomButton
  variant={saveButtonVariant}
  size="md"
  label={
    saveSuccess.showSuccess
      ? `${t("Saved!")} (${saveSuccess.countdown})`
      : t("Save This Filter")
  }
  onClick={saveFilterAttributes}
  icon={saveSuccess.showSuccess ? null : <SaveIcon color={saveIconColor} />}
  dataTestId="save-attribute-filter"
  ariaLabel={t("Save Attribute Filter")}
  disabled={isUnsavedFilter || filterNameError || noFieldChanged || !filterName}
/>

        </div>
      );
    }

    return null;
  };

  const saveFilterTab = () => (
    <>
      <FormInput
        name="filterName"
        type="text"
        label={t("Filter Name")}
        ariaLabel={t("Filter Name")}
        value={filterName}
        onChange={attrFilterName}
        isInvalid={!!filterNameError}
        onBlur={handleNameError}
        dataTestId="attribute-filter-name"
        feedback={filterNameError}
      />

      <div className="pt-4 pb-4">
        <InputDropdown
          Options={filterShareOptions}
          dropdownLabel={t("Share This Filter With")}
          isAllowInput={false}
          ariaLabelforDropdown={t("attribute filter sharing dropdown")}
          selectedOption={shareAttrFilter}
          setNewInput={setShareAttrFilter}
          dataTestIdforInput="share-attribute-filter-input"
          dataTestIdforDropdown="share-attribute-filter-options"
          required={true}
        />
      </div>
      <RenderOwnerShipNotes
        attributeFilter={attributeFilter}
        isCreator={createdByMe}
      />
      {renderActionButtons()}
    </>
  );

  const tabs = [
    {
      eventKey: "parametersTab",
      title: t("Parameters"),
      content: (
        <ParametersTab
          taskVariables={taskVariables}
          attributeData={attributeData}
          handleSelectChange={handleSelectChange}
          assigneeOptions={assigneeOptions}
          candidateOptions={candidateOptions}
        />
      ),
    },
    { eventKey: "saveFilterTab", title: t("Save"), content: saveFilterTab() },
  ];
 

   return (
    <>
      <Modal.Body className="modal-body p-0">
        <div className="filter-tab-container">
          <CustomTabs
            defaultActiveKey={(updateSuccess?.showSuccess || deleteSuccess?.showSuccess) ? "saveFilterTab":"parametersTab"}
            tabs={tabs}
            dataTestId="attribute-filter-tabs"
            ariaLabel={t("Filter Tabs")}
          />
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-start">
        <CustomButton
          variant="primary"
          size="md"
          label={t("Filter Results")}
          dataTestId="attribute-filter-results"
          ariaLabel={t("Filter results")}
          onClick={searchFilterAttributes}
          disabled={(updateSuccess.showSuccess|| deleteSuccess.showSuccess || noFieldChanged)}
        />
        <CustomButton
          variant="secondary"
          size="md"
          label={t("Cancel")}
          onClick={onClose}
          dataTestId="cancel-attribute-filter"
          ariaLabel={t("Cancel filter")}
        />
      </Modal.Footer>

    </>
  );
};

export default AttributeFilterModalBody;
