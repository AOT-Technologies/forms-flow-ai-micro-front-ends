import Modal from "react-bootstrap/Modal";
import {
  CloseIcon,
  SaveIcon,
  CustomButton,
  CustomTabs,
  InputDropdown,
  FormInput,
  ConfirmModal,
  CustomInfo,
  DeleteIcon,
  UpdateIcon,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {  PRIVATE_ONLY_YOU } from "../constants/index";
import { StorageService, StyleServices } from "@formsflow/service";
import { Filter, FilterCriteria, UserDetail } from "../types/taskFilter";
import {
  setBPMFilterSearchParams,
  setBPMTaskLoader,
} from "../actions/taskActions";
import {
  fetchServiceTaskList,
  createFilter,
  updateFilter,
  deleteFilter
} from "../api/services/filterServices";

export const AttributeFilterModal = ({
  show,
  onClose,
  selectedFilter,
  taskAttributeData,
  filterParams,
  setFilterParams,
  attributeFilter
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const baseColor = StyleServices.getCSSVariable("--ff-primary");
  const whiteColor = StyleServices.getCSSVariable("--ff-white");
  const [filterNameError, setFilterNameError] = useState("");
  const [filterName, setFilterName] = useState("");
  const [shareAttrFilter, setShareAttrFilter] = useState(PRIVATE_ONLY_YOU);
  const activePage = useSelector((state: any) => state.task.activePage);
  const limit = useSelector((state: any) => state.task.limit);
  const userRoles = StorageService.getParsedData(StorageService.User.USER_ROLE);
  const isCreateFilters = userRoles?.includes("create_filters");
  const filterNameLength = 50;
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);


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



  const userListResponse = useSelector((state: any) => state.task.userList) ?? {
    data: [],
  };
  const userList = userListResponse?.data ?? [];
  const searchParams = useSelector((state: any) => state.task.searchParams);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const assigneeOptions = useMemo(
    () =>
      userList.map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [userList]
  );
  useEffect(() => {
    const userData = StorageService.getParsedData(StorageService.User.USER_DETAILS);
    if (userData) {
      setUserDetail(userData);
    }
  }, []);
  
  const [attributeData, setAttributeData] = useState(() => {
    return taskAttributeData.reduce((acc, item) => {
      if (item.isChecked) {
        acc[item.key] = filterParams[item.key] ?? "";
      }
      return acc;
    }, {});
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleSelectChange(name, value);
  };

  const handleSelectChange = (name, selectedValue) => {
    setAttributeData((prevData) => {
      const updatedData = { ...prevData, [name]: selectedValue };
      setFilterParams({ ...filterParams, [name]: selectedValue });
      return updatedData;
    });
  };

  const getTaskAccess = () => {
    if (shareAttrFilter === PRIVATE_ONLY_YOU) {
      return { users: [userDetail?.preferred_username], roles: [] };
    }
    else {
      const users = selectedFilter?.users?.length
        ? [...selectedFilter.users]
        : [];
      const roles = selectedFilter?.roles?.length
        ? [...selectedFilter.roles]
        : [];

      return { users, roles };
    }

  };


  useEffect(() => {
    if (attributeFilter) {
      setFilterName(attributeFilter.name);
  
      if (attributeFilter?.roles?.length > 0) {
        createFilterShareOption("Share with same users as the selected tasks filter",
      getNonEmptyTaskAccess());
      } else if (attributeFilter?.users?.length > 0) {
        setShareAttrFilter(PRIVATE_ONLY_YOU);
      }
    }
  }, [attributeFilter]);
  
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

  const getFilterData = (customParams = searchParams): Filter => {
    const assignee = getAssignee();

    const criteria = {
      ...selectedFilter.criteria,
      processVariables: customParams,
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
      filterType: "ATTRIBUTE",
    };
  };

  const getAssignee = () => {
    const assigneeItem = taskAttributeData.find(
      (item) => item.key === "assignee"
    );
    if (assigneeItem) {
      const value = attributeData[assigneeItem.key];
      return value ?? selectedFilter.criteria.assignee;
    }
    return selectedFilter?.criteria?.assignee;
  };

  const buildUpdatedFilterParams = () => {
    const currentVariables = attributeFilter?.criteria?.processVariables ?? [];
    
    const updatedFilterParams: {
      name: string;
      operator: string;
      value: string;
    }[] = [...currentVariables];
  
    const filteredParams = updatedFilterParams.filter(param => param.name !== "formId");
  
    filteredParams.push({
      name: "formId",
      operator: "eq",
      value: selectedFilter?.properties?.formId,
    });
  
    taskAttributeData.forEach((item) => {
      const value = attributeData[item.key];
  
      if (
        item.isChecked &&
        item.key !== "assignee" &&
        value &&
        item.key !== "formId"
      ) {
        filteredParams.push({
          name: item.key,
          operator: "eq",
          value: item.key === "applicationId" ? JSON.parse(value) : value,
        });
      }
    });
  
    return filteredParams;
  };
  

  const searchFilterAttributes = () => {
    dispatch(setBPMTaskLoader(true));

    const updatedParams = buildUpdatedFilterParams();

    dispatch(setBPMFilterSearchParams(updatedParams));
    setFilterParams(updatedParams);
    dispatch(
      fetchServiceTaskList(
        getFilterData(updatedParams),
        null,
        activePage,
        limit,
      )
    );

    onClose();
  };


  const saveFilterAttributes = async () => {
    try {
      const updatedParams = buildUpdatedFilterParams();
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

      const saveAction = attributeFilter
        ? updateFilter(filterToSave, attributeFilter.id)
        : createFilter(filterToSave);

      await saveAction;
      setShowUpdateModal(false)

    } catch (error) {
      console.error("Failed to save filter attributes:", error);
    }
    onClose();
  };

  const handleFilterDelete = () => {
    deleteFilter(attributeFilter?.id)
      .catch((error) => {
        console.error("error", error);
      });

    setShowDeleteModal(false);
  };







  const getIconColor = (disabled) => (disabled ? whiteColor : baseColor);
  const isFilterNameEmpty = !filterName?.trim?.();
  const hasFilterNameError = filterNameError ?? false;
  const isCreateDisabled = !isCreateFilters;

  const isInvalidFilter =
    isFilterNameEmpty ?? hasFilterNameError ?? isCreateDisabled;
  const iconColor = getIconColor(isInvalidFilter);
  const isFilterAdmin = userRoles?.includes("manage_all_filters");

  const createdByMe = attributeFilter?.createdBy === userDetail?.preferred_username
  const publicAccess = attributeFilter?.roles?.length === 0 && attributeFilter?.users?.length === 0;
  const roleAccess = attributeFilter?.roles?.some(role => userDetail.groups.includes(role));
  const canAccess = roleAccess || publicAccess || createdByMe;
  const viewOnly = !isFilterAdmin && canAccess;
  const editRole = isFilterAdmin && canAccess;

  const renderActionButtons = () => {
    if (attributeFilter) {
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
              icon={<UpdateIcon />}
              dataTestId="save-attribute-filter"
              ariaLabel={t("Update This Filter")}
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
              dataTestId="delete-attribute-filter"
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
            onClick={saveFilterAttributes}
            icon={<SaveIcon/>}
            dataTestId="save-attribute-filter"
            ariaLabel={t("Save Attribute Filter")}
          />
        </div>
      );
    }

    return null;
  };
  const renderOwnershipNote = () => {

    const isCreator = attributeFilter?.createdBy === userDetail?.preferred_username;

    if (isCreator) {
      return (
        <div className="pb-4">
          <CustomInfo
            className="note"
            heading="Note"
            content={t("This filter is created and managed by you")}
            dataTestId="attribute-self-share-note"
          />
        </div>
      );
    }
    

    if (viewOnly) {
      return (
        <CustomInfo
          className="note"
          heading="Note"
          content={t("This filter is created and managed by {{createdBy}}", {
            createdBy: attributeFilter?.createdBy,
          })}
          dataTestId="attribute-filter-save-note"
        />
      );
    }

    if (editRole) {
      return (
          <div className="pb-4">
            <CustomInfo
              className="note"
              heading="Note"
              content={t("This filter is created and managed by {{createdBy}}", {
                createdBy: attributeFilter?.createdBy,
              })}
              dataTestId="attribute-filter-save-note"
            />
          </div>
      );
    }

    return null;
  };


  const parametersTab = () => (
    <>
      {taskAttributeData.map((item) => {
        if (item.isChecked && item.type !== "datetime") {
          const matchingProcessVariable = attributeFilter?.criteria?.processVariables?.find(
            (pv) => pv.name === item.key
          );

          const valueFromProcessVariable = matchingProcessVariable ? matchingProcessVariable.value : '';

          if (item?.key === "assignee") {
            return (
              <div className="pt-4" key={item.key}>
                <InputDropdown
                  Options={assigneeOptions}
                  dropdownLabel={t(item.label)}
                  isAllowInput={false}
                  ariaLabelforDropdown={t(`Attribute ${item.label} dropdown`)}
                  ariaLabelforInput={t(`input for attribute ${item.label}`)}
                  dataTestIdforDropdown={`${item.key}-attribute-dropdown`}
                  selectedOption={attributeData[item.key] ?? valueFromProcessVariable}
                  setNewInput={(selectedOption) => handleSelectChange(item.key, selectedOption)}
                  name={item.key}
                />
              </div>
            );
          } else {
            return (
              <div className="pt-4" key={item.key}>
                <FormInput
                  name={item.key}
                  type={item.type}
                  label={t(item.label)}
                  ariaLabel={t(item.label)}
                  dataTestId={`${item.key}-attribute-input`}
                  value={attributeData[item.key] ?? valueFromProcessVariable}
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
    { eventKey: "saveFilterTab", title: t("Save"), content: saveFilterTab() },
  ];

  const isAtLeastOneAttributeFilled = () => {
    return taskAttributeData?.some((item) => {
      if (item.isChecked && item.type !== "datetime") {
        const value = attributeData[item.key];
        return value !== null && value !== undefined && value !== "";
      }
      return false;
    });
  };
  const currentFilterName = () => {
    if (attributeFilter) {
      return `${t("Attributes")}: ${attributeFilter.name}`;
    }


    else {
      return (t("Attributes: Unsaved Filter"));
    }
  }

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="sm"
        centered={true}
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
            <CloseIcon onClick={onClose} />
          </div>
        </Modal.Header>
        <Modal.Body className="modal-body p-0">
          <div className="filter-tab-container">
            <CustomTabs
              defaultActiveKey="parametersTab"
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
            disabled={!isAtLeastOneAttributeFilled()}
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
      </Modal>
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
              dataTestId="attribute-filter-update-note"
            />
          }


          primaryBtnAction={() => { setShowUpdateModal(false) }}
          onClose={() => setShowUpdateModal(false)}
          primaryBtnText={t("No, Cancel Changes")}
          secondaryBtnText={t("Yes, Update This Filter For Everybody")}
          secondaryBtnAction={saveFilterAttributes}
          secondoryBtndataTestid="confirm-attribute-revert-button"
        />
      )}


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
              dataTestId="attribute-filter-delete-note"
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
          secondoryBtndataTestid="confirm-revert-button"
        />
      )}

    </>
  );
};

AttributeFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  filterParams: PropTypes.object.isRequired,
  setFilterParams: PropTypes.func.isRequired,
};

export default AttributeFilterModal;
