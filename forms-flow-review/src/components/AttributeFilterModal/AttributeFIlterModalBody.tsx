import {
    ConfirmModal,
  CustomButton,
  CustomInfo,
  CustomTabs,
  DeleteIcon,
  FormInput,
  InputDropdown,
  SaveIcon,
  UpdateIcon,
} from "@formsflow/components";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import {
  createFilter,
  fetchFilterList,
  fetchServiceTaskList,
  getUserRoles,
  updateFilter,
} from "../../api/services/filterServices";
import { setAttributeFilterList, setAttributeFilterToEdit, setBPMTaskListActivePage, setBPMTaskLoader, setIsUnsavedAttributeFilter, setSelectedBpmAttributeFilter, setUserGroups } from "../../actions/taskActions";
import { MULTITENANCY_ENABLED, PRIVATE_ONLY_YOU } from "../../constants"; 
import { StyleServices } from "@formsflow/service";
import ParametersTab from "./ParametersTab";
import RenderOwnerShipNotes from "./Notes";
import { isFilterAdmin } from "../../helper/permissions";
import { cloneDeep } from "lodash";
import { Filter, FilterCriteria } from "../../types/taskFilter"; 
import { removeTenantKey, trimFirstSlash } from "../../helper/helper";
import { RootState } from "../../reducers";

const AttributeFilterModalBody = ({ onClose, toggleUpdateModal, updateSuccess, toggleDeleteModal,deleteSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterNameLength = 50;

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
 
  const limit = useSelector((state: any) => state.task.limit);
  const selectedFilter = useSelector((state: any) => state.task.selectedFilter);
  const candidateGroups = useSelector((state: any) => state.task.userGroups);
  const tenantKey = useSelector((state: any) => state.tenants?.tenantId);
  const userDetails = useSelector((state: any) => state.task.userDetails);
  const attributeFilterList = useSelector((state:RootState)=>state.task.attributeFilterList);
  
  const { data: userList } = useSelector(
    (state: any) => state.task.userList
  ) ?? {
    data: [],
  };

  const taskVariables = selectedFilter?.variables ?? [];
  const attributeFilter = useSelector(
    (state: any) => state.task.attributeFilterToEdit
  );
  const exisitngProcessvariables =
    attributeFilter?.criteria?.processVariables ?? [];

  const isCheckedData = taskVariables.reduce((acc, item) => {
    acc[item.key] = item.isChecked;
    return acc;
  }, {});
  //Handle if existing data is there need to set it in attributeData
  const [attributeData, setAttributeData] = useState(() => {
    const initialData = {assignee:attributeFilter?.criteria?.assignee || ""};
    const existingValues = (
      exisitngProcessvariables.reduce((acc, item) => {
        if (isCheckedData[item.name]) {
          acc[item.name] = item.value;
        }
        return acc;
      }, {}) || {}
    );
    return { ...initialData, ...existingValues };
  });

  const [filterNameError, setFilterNameError] = useState("");
  const [filterName, setFilterName] = useState(attributeFilter?.name || "");
  const [shareAttrFilter, setShareAttrFilter] = useState(PRIVATE_ONLY_YOU); // need to handle in edit stage
 
  /* ---------------------------- access management --------------------------- */

  const isCreator =
    attributeFilter?.createdBy === userDetails?.preferred_username;
  const createdByMe =
    attributeFilter?.createdBy === userDetails?.preferred_username;
  const publicAccess =
    attributeFilter?.roles?.length === 0 &&
    attributeFilter?.users?.length === 0;
  const roleAccess = attributeFilter?.roles?.some((role) =>
    userDetails.groups.includes(role)
  );
  const canAccess = roleAccess || publicAccess || createdByMe;
  const viewOnly = !isFilterAdmin && canAccess;
  const editRole = isFilterAdmin && canAccess;

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
      userList.map((user) => ({
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

  const getTaskAccess = () => {
    if (shareAttrFilter === PRIVATE_ONLY_YOU) {
      return { users: [userDetails?.preferred_username], roles: [] };
    } else {
      const users = selectedFilter?.users?.length
        ? [...selectedFilter.users]
        : [];
      const roles = selectedFilter?.roles?.length
        ? [...selectedFilter.roles]
        : [];

      return { users, roles };
    }
  };

  const getNonEmptyTaskAccess = () => {
    const { users, roles } = getTaskAccess();

    if (users?.length) {
      return users;
    }

    if (roles?.length) {
      return roles;
    }

    return [];
  };

  const createFilterShareOption = (labelKey, value) => ({
    label: t(labelKey),
    value,
    onClick: () => setShareAttrFilter(value),
  });

  const filterShareOptions = [
    createFilterShareOption("Nobody (Keep it private)", PRIVATE_ONLY_YOU),
    createFilterShareOption(
      "Share with same users as the selected tasks filter",
      getNonEmptyTaskAccess()
    ),
  ];




  const attrFilterName = (e) => {
    setFilterName(e.target.value);
  };
    const getAssignee = () => {
      return  attributeData["assignee"] ||selectedFilter?.criteria?.assignee;
    };

    const getFilterData = (newProcessVariables): Filter => {
      const assignee = getAssignee();

      const criteria = {
        ...selectedFilter.criteria,
        processVariables: newProcessVariables,
        assignee,
      };

      const { roles, users } = getTaskAccess();

      return {
        name: filterName,
        criteria,
        parentFilterId: selectedFilter.id,
        roles,
        users,
        variables: selectedFilter.variables,
        filterType: "ATTRIBUTE",
      };
    };


    // TBD: need to discuss about the roles
    // const removeSlashFromValue = (value)=>{
    //       return MULTITENANCY_ENABLED && value
    //       ? tenantKey + "-" + trimFirstSlash(value)
    //       : trimFirstSlash(value);
    // }


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

      const ignoredKeys = ["assignee"];
      Object.keys(attributeData).forEach((key) => {
        if (!ignoredKeys.includes(key) && attributeData[key]) {
          newProcessVariable.push({
            name: key,
            operator: types[key] === "number" ? "eq" : "like",
            value:
                key === "applicationId"
                ? JSON.parse(attributeData[key])
                // :key === "roles" ? removeSlashFromValue(attributeData[key])
                : attributeData[key],
          });
        }
      });
      newProcessVariable.push(...currentCriteria.processVariables);
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

        const criteria: FilterCriteria = {
          ...selectedFilter.criteria,
          processVariables: updatedParams,
        };
        criteria.assignee = assignee;

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
    const saveFilterAttributes = async () => {
      try {
        
        const filterToSave = createAttributeFilterPayload();
        const response = await createFilter(filterToSave );
        // need to update selected attribute filter in redux
        dispatch(setSelectedBpmAttributeFilter(response.data));
        const newAttributeFilterList = [...attributeFilterList,response.data]
        dispatch(setAttributeFilterList(newAttributeFilterList));
        dispatch(fetchServiceTaskList(filterToSave, null, 1, limit));
        // setShowUpdateModal(false);
      } catch (error) {
        console.error("Failed to save filter attributes:", error);
      }
      onClose();
    };

    const handleUpdateModalClick =()=>{
      dispatch(setAttributeFilterToEdit(createAttributeFilterPayload()))
      toggleUpdateModal();
      // need to integrate count down for success
     }
    const handleDeleteClick = ()=>{
            dispatch(setAttributeFilterToEdit(createAttributeFilterPayload()))

      toggleDeleteModal();
    }
  const renderActionButtons = () => {
    if (attributeFilter?.id) { 
      if (canAccess && isFilterAdmin) {
        return (
          <div className="pt-4 d-flex">
            <CustomButton
              className="me-3"
              variant={updateButtonVariant}
              size="md"
              label={t("Update This Filter")}
                onClick={handleUpdateModalClick}
              icon={ updateSuccess?.showSuccess ? 
                updateSuccess.countdown : <UpdateIcon />}
              dataTestId="save-attribute-filter"
              ariaLabel={t("Update This Filter")}
              disabled={deleteSuccess.showSuccess}
            />
            <CustomButton
              variant={deleteButtonVariant}
              size="md"
              label={t("Delete This Filter")}
              onClick={handleDeleteClick}
              icon={deleteSuccess?.showSuccess ? 
                deleteSuccess.countdown :<DeleteIcon />}
              dataTestId="delete-attribute-filter"
              ariaLabel={t("Delete This Filter")}
              disabled={updateSuccess.showSuccess}
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
            onClick={saveFilterAttributes}
            icon={<SaveIcon />}
            dataTestId="save-attribute-filter"
            ariaLabel={t("Save Attribute Filter")}
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
        />
      </div>
      <RenderOwnerShipNotes
        attributeFilter={attributeFilter}
        isCreator={isCreator}
        viewOnly={viewOnly}
        editRole={editRole}
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
            disabled={(updateSuccess.showSuccess|| deleteSuccess.showSuccess)}
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
