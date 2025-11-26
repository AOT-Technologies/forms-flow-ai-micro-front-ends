import {
  V8CustomButton,
  SelectDropdown,
  CustomTextInput,
  Alert,
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
import { HelperServices } from "@formsflow/service";

import { setAttributeFilterList, setAttributeFilterToEdit, setBPMTaskListActivePage, setBPMTaskLoader, setIsUnsavedAttributeFilter, setSelectedBpmAttributeFilter, setUserGroups } from "../../actions/taskActions";
import { MULTITENANCY_ENABLED, PRIVATE_ONLY_YOU } from "../../constants"; 
import ParametersTab from "./ParametersTab";
import { userRoles } from "../../helper/permissions";
import { cloneDeep } from "lodash";
import { Filter, FilterCriteria } from "../../types/taskFilter"; 
import { removeTenantKey, trimFirstSlash, addTenantPrefixIfNeeded } from "../../helper/helper";
import { RootState } from "../../reducers";

// Constants for variables that support form-level filtering
const VARIABLES_WITH_FORM_SUPPORT = new Set(['name', 'submitterName', 'assignee', 'roles', 'created', 'formName']);

const AttributeFilterModalBody = ({ onClose, handleSaveFilterAttributes, currentPage, setCurrentPage }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterNameLength = 50;
  const { manageAllFilters,createFilters } = userRoles();
  const limit = useSelector((state: any) => state.task.limit);
  const selectedFilter = useSelector((state: any) => state.task.selectedFilter);
  const selectedAttributeFilter = useSelector((state: any) => state.task.selectedAttributeFilter);
  const candidateGroups = useSelector((state: any) => state.task.userGroups);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId || state.tenants?.tenantData?.key);
  const userDetails = useSelector((state: any) => state.task.userDetails);
  const attributeFilterList = useSelector((state:RootState)=>state.task.attributeFilterList);
  const isUnsavedFilter = useSelector((state:RootState)=>state.task.isUnsavedFilter);
  const [filterNameError, setFilterNameError] = useState("");
    const attributeFilter = useSelector(
    (state: any) => state.task.attributeFilterToEdit
  );
  const [filterName, setFilterName] = useState(attributeFilter?.name || "");
  const { data: userList } = useSelector(
    (state: any) => state.task.userList
  ) ?? {
    data: [],
  };

  const taskVariables = selectedFilter?.variables ?? [];

  const exisitngProcessvariables =
    selectedAttributeFilter?.criteria?.processVariables ?? [];

  // Create unique identifier for fields with same key but different isFormVariable
  const getUniqueFieldKey = (item) => {
    return item.isFormVariable ? `${item.key}_form` : item.key;
  };

  const isCheckedData = taskVariables.reduce((acc, item) => {
    const uniqueKey = getUniqueFieldKey(item);
    acc[uniqueKey] = item.isChecked;
    return acc;
  }, {});

  // Helper function to clean value by removing '%' characters
  const cleanValue = (value, fieldName) => {
    if (typeof value !== "number" && fieldName !== "created" && typeof value !== "boolean" && fieldName !== "applicationId") {
      return value?.replace(/%/g, '');
    }
    return value;
  };

  // Helper function to process a single variable and add to existing values
  const processVariable = (item, existingValues) => {
    const taskVariable = taskVariables.find(tv => tv.name === item.name && tv.isFormVariable === item.isFormVariable);
    if (taskVariable) {
      const resetValue = cleanValue(item.value, item.name);
      const uniqueKey = getUniqueFieldKey(taskVariable);
      existingValues[uniqueKey] = resetValue;
    }
  };

  // Helper function to process task-level fields from criteria
  // Note: 'roles' is excluded here as it's handled separately from candidateGroup in initialData
  const processTaskFields = (existingValues) => {
    const taskFields = ['submitterName', 'assignee', 'created', 'formName'];
    taskFields.forEach(fieldName => {
      const fieldValue = selectedAttributeFilter?.criteria?.[fieldName];
      if (fieldValue) {
        const taskVariable = taskVariables.find(tv => tv.name === fieldName && !tv.isFormVariable);
        if (taskVariable) {
          const resetValue = cleanValue(fieldValue, fieldName);
          const uniqueKey = getUniqueFieldKey(taskVariable);
          existingValues[uniqueKey] = resetValue;
        }
      }
    });
  };

  // Helper function to process nameLike field
  const processNameLikeField = (existingValues) => {
    const nameLikeValue = selectedAttributeFilter?.criteria?.nameLike;
    if (nameLikeValue) {
      const taskNameVariable = taskVariables.find(tv => tv.name === "name" && !tv.isFormVariable);
      if (taskNameVariable) {
        const resetValue = cleanValue(nameLikeValue, "name");
        const uniqueKey = getUniqueFieldKey(taskNameVariable);
        existingValues[uniqueKey] = resetValue;
      }
    }
  };
  const normalizeDayValue = (value) => {
    // Remove % from both sides
    const cleaned = value.replace(/^%|%$/g, "");
  
    // cleaned is "mm/dd/yyyy"
    const [month, day, year] = cleaned.split("/");
  
    // return "dd-mm-yyyy" so UI behaves correctly
    return `${day}-${month}-${year}`;
  };

  // Helper function to process existing process variables
  const processExistingProcessVariables = (existingValues) => {
    exisitngProcessvariables.forEach((item) => {
      const taskVariable = taskVariables.find(tv => tv.name === item.name && tv.isFormVariable === item.isFormVariable);
      const effectiveType = taskVariable?.type || item?.type;
      const uniqueKey = taskVariable
        ? getUniqueFieldKey(taskVariable)
        : (item?.isFormVariable ? `${item?.name}_form` : item?.name);

      if (effectiveType === "day") {
        const resetValue = normalizeDayValue(item.value);
        existingValues[uniqueKey] = resetValue;
        return;
      }

      if (effectiveType === "datetime") {
        const cleaned = (item.value || "").replace(/^%|%$/g, "");
        const formatted = HelperServices.getLocalDateAndTime(cleaned) || "";
        existingValues[uniqueKey] = formatted;
        return;
      }
      // Skip roles from processVariables - it should come from candidateGroup in initialData
      if (item.name === "roles" && !item.isFormVariable) {
        return;
      }
      
      if (VARIABLES_WITH_FORM_SUPPORT.has(item.name)) {
        processVariable(item, existingValues);
      } else {
        // For other variables, find the corresponding task variable
        const taskVariable = taskVariables.find(tv => tv.name === item.name);
        if (taskVariable && taskVariable.type === "day") {
          const resetValue = normalizeDayValue(item.value);
          existingValues[getUniqueFieldKey(taskVariable)] = resetValue;
          return;
      }
      
        if (taskVariable) {
          const resetValue = cleanValue(item.value, item.name);
          existingValues[getUniqueFieldKey(taskVariable)] = resetValue;
        }
      }
    });
  };

  //Handle if existing data is there need to set it in attributeData
 const [attributeData, setAttributeData] = useState(() => {
  const initialData = {
    assignee: selectedAttributeFilter?.criteria?.assignee || "",
    roles: removeTenantKey(selectedAttributeFilter?.criteria?.candidateGroup, tenantKey, MULTITENANCY_ENABLED) || ""
  };

  const existingValues = {};
  
  processNameLikeField(existingValues);
  processTaskFields(existingValues);
  processExistingProcessVariables(existingValues);

  return { ...initialData, ...existingValues };
});
  const FILTER_SHARE_OPTIONS = {
  PRIVATE: 'PRIVATE_ONLY_YOU',
  SAME_AS_TASKS: 'SAME_AS_TASK_FILTER',
};
  
  const [shareAttrFilter, setShareAttrFilter] = useState(FILTER_SHARE_OPTIONS.PRIVATE); 

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
    const options = candidateGroups.reduce((acc, group) => {
      if (!group.permissions.includes("view_filters")) return acc;
      const name = removeTenantKey(group.name, tenantKey, MULTITENANCY_ENABLED);
      // Remove leading slash to match the format in attributeData.roles
      const normalizedName = trimFirstSlash(name);
      acc.push({ value: normalizedName, label: normalizedName });
      return acc;
    }, []);

    return options;
  }, [candidateGroups, tenantKey, attributeData?.roles]);



  // Reset form state when switching from edit to create mode or when switching between different filters to edit
  useEffect(() => {
    if (!attributeFilter?.id) {
      // Reset filter name
      setFilterName("");
      setFilterNameError("");
      
      // Reset attribute data to initial state (only selectedFilter criteria, not attribute filter data)
      const initialData = {
        assignee: selectedFilter?.criteria?.assignee || "",
        roles: removeTenantKey(selectedFilter?.criteria?.candidateGroup, tenantKey, MULTITENANCY_ENABLED) || ""
      };
      setAttributeData(initialData);
      
      // Reset share filter option
      setShareAttrFilter(FILTER_SHARE_OPTIONS.PRIVATE);
      
      // Reset to first page
      setCurrentPage(1);
    } else {
      // When editing, populate form with the filter being edited (attributeFilter), not the currently selected one
      setFilterName(attributeFilter?.name || "");
      setFilterNameError("");
      
      // Use attributeFilter criteria instead of selectedAttributeFilter
      const initialData = {
        assignee: attributeFilter?.criteria?.assignee || "",
        roles: removeTenantKey(attributeFilter?.criteria?.candidateGroup, tenantKey, MULTITENANCY_ENABLED) || ""
      };

      // Process attributeFilter's processVariables to populate form fields
      const attributeFilterProcessVars = attributeFilter?.criteria?.processVariables || [];
      const existingValues = {};
      
      // Process nameLike field from attributeFilter
      const nameLikeValue = attributeFilter?.criteria?.nameLike;
      if (nameLikeValue) {
        const taskNameVariable = taskVariables.find(tv => tv.name === "name" && !tv.isFormVariable);
        if (taskNameVariable) {
          const resetValue = cleanValue(nameLikeValue, "name");
          const uniqueKey = getUniqueFieldKey(taskNameVariable);
          existingValues[uniqueKey] = resetValue;
        }
      }
      
      // Process task-level fields from attributeFilter
      // Note: 'roles' is excluded here as it's handled separately from candidateGroup in initialData
      const taskFields = ['submitterName', 'assignee', 'created', 'formName'];
      taskFields.forEach(fieldName => {
        const fieldValue = attributeFilter?.criteria?.[fieldName];
        if (fieldValue) {
          const taskVariable = taskVariables.find(tv => tv.name === fieldName && !tv.isFormVariable);
          if (taskVariable) {
            const resetValue = cleanValue(fieldValue, fieldName);
            const uniqueKey = getUniqueFieldKey(taskVariable);
            existingValues[uniqueKey] = resetValue;
          }
        }
      });
      
      // Process process variables from attributeFilter
      attributeFilterProcessVars.forEach((item) => {
        const taskVariable = taskVariables.find(tv => tv.name === item.name && tv.isFormVariable === item.isFormVariable);
        const effectiveType = taskVariable?.type || item?.type;
        const uniqueKey = taskVariable
          ? getUniqueFieldKey(taskVariable)
          : (item?.isFormVariable ? `${item?.name}_form` : item?.name);

        if (effectiveType === "day") {
          const resetValue = normalizeDayValue(item.value);
          existingValues[uniqueKey] = resetValue;
          return;
        }
        if (effectiveType === "datetime") {
          const cleaned = (item.value || "").replace(/^%|%$/g, "");
          const formatted = HelperServices.getLocalDateAndTime(cleaned) || "";
          existingValues[uniqueKey] = formatted;
          return;
        }
        // Skip roles from processVariables - it should come from candidateGroup in initialData
        if (item.name === "roles" && !item.isFormVariable) {
          return;
        }
        
        if (VARIABLES_WITH_FORM_SUPPORT.has(item.name)) {
          const taskVariable = taskVariables.find(tv => tv.name === item.name && tv.isFormVariable === item.isFormVariable);
          if (taskVariable) {
            const resetValue = cleanValue(item.value, item.name);
            const uniqueKey = getUniqueFieldKey(taskVariable);
            existingValues[uniqueKey] = resetValue;
          }
        } else {
          // For other variables, find the corresponding task variable
          const taskVariable = taskVariables.find(tv => tv.name === item.name);
          if (taskVariable) {
            const resetValue = cleanValue(item.value, item.name);
            existingValues[getUniqueFieldKey(taskVariable)] = resetValue;
          }
        }
      });
      
      setAttributeData({ ...initialData, ...existingValues });
      
      // Set share filter based on attributeFilter being edited
      if(attributeFilter?.roles?.length > 0 || (attributeFilter?.users?.length === 0 && attributeFilter?.roles?.length === 0)){ 
        setShareAttrFilter(FILTER_SHARE_OPTIONS.SAME_AS_TASKS);
      } else {
        setShareAttrFilter(FILTER_SHARE_OPTIONS.PRIVATE);
      }
      
      // Reset to first page when switching filters
      setCurrentPage(1);
    }
  }, [attributeFilter, selectedFilter, tenantKey, taskVariables]);


const getTaskAccess = () => {
  if (shareAttrFilter === FILTER_SHARE_OPTIONS.PRIVATE) {
    return { users: [userDetails?.preferred_username], roles: [] };
  } else {
    return { users: [], roles: [] };
  }
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
         



const removeSlashFromValue = (value) => {
  const trimmedValue = trimFirstSlash(value);
  return addTenantPrefixIfNeeded(trimmedValue, tenantKey, MULTITENANCY_ENABLED);
};



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

  // TBD:now we don't need assignee and roles inside process variables
  const ignoredKeys = ["assignee", "roles"];

  Object.keys(attributeData).forEach((key) => {
  if (
    !ignoredKeys.includes(key) &&
    attributeData[key] != null &&
    attributeData[key] !== ""
  ) {
    // Find the original task variable to get the correct field name and type
    const taskVariable = taskVariables.find(tv => getUniqueFieldKey(tv) === key);
    if (!taskVariable) return;

    const originalKey = taskVariable.key;
    const isNumberOrAppId = types[originalKey] === "number" ||
      originalKey === "applicationId" ||
      types[originalKey] === "checkbox" ||
      types[originalKey] === "currency";
    const operator = isNumberOrAppId ? "eq" : "like";

    let value = attributeData[key];

    if (originalKey === "applicationId") {
      value = JSON.parse(attributeData[key]);
    } else if (originalKey === "roles") {
      value = removeSlashFromValue(attributeData[key]);
      // Add % wrapper for like search after tenant processing
      if (operator === "like") {
        value = `%${value}%`;
      }
    } else if (types[originalKey] === "number") {
      // Convert string to number for number type fields
      value = Number(value);
    } 
    else if (types[originalKey] === "currency"){
      value = Number(value);
    }
    else if (types[originalKey] === "day") {
      // When editing, the value shown in UI is in MM/DD/YYYY format (coming from backend %MM/DD/YYYY%)
      // Convert MM/DD/YYYY → DD-MM-YYYY
      if (value.includes("/")) {
        const [month, day, year] = value.split("/");
        value = `${day}-${month}-${year}`;
      }
    
      // Now convert DD-MM-YYYY → %MM/DD/YYYY% for Camunda
      const [day, month, year] = value.split("-");
      value = `%${month}/${day}/${year}%`;
    }
     else if (types[originalKey] === "datetime") {
      //changing date and time to camunda expected format
      if (value && value.includes(",")) {
        const [datePart, timePart] = value.split(",").map((s) => s.trim());
        const [day, month, year] = datePart.split("-");

        const dateObj = new Date(`${year}-${month}-${day} ${timePart}`);

        value = `%${dateObj.toISOString()}%`;
      }
    } else if (!isNumberOrAppId) {
      // like search
      value = `%${value}%`;
    }

    newProcessVariable.push({
      name: taskVariable.name, // Use the original name from taskVariable
      operator,
      value,
      isFormVariable: taskVariable.isFormVariable, // Add metadata to distinguish form variables
    });
  }
});


  newProcessVariable.push(...(currentCriteria.processVariables ?? []));

  return newProcessVariable;
};


      
// function to search filter attributes(filter results button) not used now
    // const searchFilterAttributes = () => {
     
    //   const newProcessVariables = buildNewProcessVariables(); 
    //   const newFilterData = getFilterData(newProcessVariables);
    //   batch(()=>{
    //   dispatch(setBPMTaskLoader(true));
    //   dispatch(setSelectedBpmAttributeFilter(newFilterData));
    //   dispatch(setIsUnsavedAttributeFilter(true));
    //   dispatch(setBPMTaskListActivePage(1))
    //   dispatch(fetchServiceTaskList(newFilterData, null, 1, limit));
    //   })

    //   onClose();
    // };



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
    
    // Check if we're editing an existing filter (PUT) or creating a new one (POST)
    if (attributeFilter?.id) {
      // Edit mode: Use PUT via handleSaveFilterAttributes
      await handleSaveFilterAttributes(filterToSave);
    } else {
      // Create mode: Use POST via createFilter
      const response = await createFilter(filterToSave);

      // need to update selected attribute filter in redux
      dispatch(setSelectedBpmAttributeFilter(response.data));
      const newAttributeFilterList = [...attributeFilterList, response.data];
      dispatch(setAttributeFilterList(newAttributeFilterList));
      dispatch(fetchServiceTaskList(filterToSave, null, 1, limit));
    }
  } catch (error) {
    console.error("Failed to save filter attributes:", error);
  } finally {
    onClose();
  }
};
   //update modal not used now, will discuss later and remove this code
    // const handleUpdateModalClick =()=>{
    //    const isPrivate = attributeFilter?.users?.length!==0;
    // const data = createAttributeFilterPayload();
    // if(isPrivate){
    //  handleSaveFilterAttributes(isPrivate,data);
    // }else{
    //     dispatch(setAttributeFilterToEdit(data))
    //   toggleUpdateModal();
    // }
    
    //  }

  const saveFilterTab = () => (
    <div className="save-filter-tab-container">
    { !attributeFilter?.id  && <Alert
      message={t("You can easily edit or delete custom filters at any time after they are saved.")}
      variant="passive"
      dataTestId="save-note-container"
      isShowing={true}
    />}
    <div className="custom-input-container">
      <label htmlFor="attribute-filter-name">{t("Filter Name")}</label>
      <CustomTextInput
        value={filterName}
        setValue={(val) => setFilterName(val)}
        placeholder={"Untitled Field Filter"}
        dataTestId="attribute-filter-name"
        ariaLabel={t("Filter Name")}
        onBlur={handleNameError}
        maxLength={filterNameLength}
      />
      </div>
      <div className="custom-input-container">
        <label htmlFor="share-this-filter">{t("Share This Filter With")}</label>
        <SelectDropdown
          options={filterShareOptions.map(({ label, value }) => ({ label, value }))}
          value={shareAttrFilter}
          onChange={setShareAttrFilter}
          ariaLabel={t("attribute filter sharing dropdown")}
          dataTestId="share-attribute-filter-options"
          id="share-this-filter"
          variant="secondary"
        />
      </div>
    </div>
  );
 
   return (
    <>
      <Modal.Body >
        {currentPage === 1 ? (
          <ParametersTab
            taskVariables={taskVariables}
            attributeData={attributeData}
            handleSelectChange={handleSelectChange}
            assigneeOptions={assigneeOptions}
            candidateOptions={candidateOptions}
          />
        ) : (
          saveFilterTab()
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100 d-flex align-items-center">
          <div className="me-auto">
            {currentPage === 2 && (
              <V8CustomButton
                label={t("Back")}
                dataTestId="attribute-filter-back"
                ariaLabel={t("Back")}
                onClick={() => setCurrentPage(1)}
                variant="secondary"
              />
            )}
          </div>
          <div className=" footer-text flex-grow-1 text-center">
            {currentPage === 1 ? t("1 of 2") : t("2 of 2")}
          </div>
          <div className="ms-auto">
            {currentPage === 1 && (
              <V8CustomButton
                label={t("Next")}
                dataTestId="attribute-filter-next"
                ariaLabel={t("Next")}
                onClick={() => setCurrentPage(2)}
              />
            )}
            {currentPage === 2 && createFilters  && (
              <V8CustomButton
                variant="primary"
                label={t("Save and apply")}
                onClick={saveFilterAttributes}
                dataTestId="save-attribute-filter"
                ariaLabel={t("Save Attribute Filter")}
                disabled={isUnsavedFilter || filterNameError || noFieldChanged || !filterName}
              />
            )}
          </div>
        </div>
      </Modal.Footer>

    </>
  );
};

export default AttributeFilterModalBody;
