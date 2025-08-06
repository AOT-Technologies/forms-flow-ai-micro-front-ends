import Modal from "react-bootstrap/Modal";
import {
  CloseIcon,
  ConfirmModal,
  CustomInfo,
  useSuccessCountdown,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskFilterModalBody from "./TaskFilterModalBody";
import { batch, useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import {
  deleteFilter,
  fetchBPMTaskCount,
  fetchServiceTaskList,
  updateDefaultFilter,
  updateFilter,
} from "../../api/services/filterServices";
import { RootState } from "../../reducers";
import {
  setBPMFilterList,
  setBPMFiltersAndCount,
  setBPMTaskList,
  setDefaultFilter,
  setIsUnsavedFilter,
  setSelectedFilter,
} from "../../actions/taskActions";

const TaskFilterModal = ({ show, onClose, toggleModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isUnsavedFilter = useSelector(
    (state: any) => state.task.isUnsavedFilter
  );
  const filterToEdit = useSelector((state: any) => state.task.filterToEdit);
  const filterList = useSelector((state: RootState) => state.task.filterList);
  const filterListAndCount =  useSelector((state:RootState)=>state.task.filtersAndCount);
  const defaultFilter = useSelector(
    (state: RootState) => state.task.defaultFilter
  );
  const limit = useSelector((state: RootState) => state.task.limit);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    successState: updateSuccess,
    startSuccessCountdown: setUpdateSuccess,
  } = useSuccessCountdown();
  const {
    successState: deleteSuccess,
    startSuccessCountdown: setDeleteSuccess,
  } = useSuccessCountdown();

    interface handleFilterUpdate {
    isPrivate?: boolean;
    data?: any;
  }

  const toggleUpdateModal = () => {
    toggleModal();
    setShowUpdateModal((prev) => !prev);
  };

  const toggleDeleteModal = () => {
    toggleModal();
    setShowDeleteModal((prev) => !prev);
  };

  const handleBatchFunctionWhenThereIsNoFilter = () => {
    dispatch(setDefaultFilter(null));
    dispatch(setSelectedFilter(null));
    dispatch(setBPMTaskList([]));
    dispatch(setBPMFiltersAndCount([]));
  };

  const resetDefaultFilter = (defaultFilterId) => {
    dispatch(setDefaultFilter(defaultFilterId));
    updateDefaultFilter(defaultFilterId);
  };

  const handleFilterDelete = async () => {
    toggleDeleteModal();
    await deleteFilter(filterToEdit?.id);
    const newFilters = filterList.filter((i) => i.id !== filterToEdit?.id);
    setDeleteSuccess(onClose, 2);
    const newFilterAndCount = filterListAndCount.filter(i=>i.id !==filterToEdit?.id);
    dispatch(setBPMFiltersAndCount(newFilterAndCount));
    dispatch(setBPMFilterList(newFilters));
    if (newFilters.length) {
      resetDefaultFilter(newFilters[0]?.id);
    } else {
      batch(handleBatchFunctionWhenThereIsNoFilter);
    }
  };

  const handleFilterUpdate = async (isPrivate?: boolean, data?: any) => { 
    if(!isPrivate)toggleUpdateModal();
    const payload = data ?? filterToEdit;
    const response = await updateFilter(payload, payload?.id);
    setUpdateSuccess(onClose, 2);
    dispatch(setIsUnsavedFilter(false));
    const filtersList = filterList.filter(
      (item) => item.id !== response.data.id
    );
    const updatedFilterList = [response.data, ...filtersList];
    dispatch(setBPMFilterList(updatedFilterList));
    dispatch(fetchBPMTaskCount(updatedFilterList));
    const isDefaultFilter = response.data.id === defaultFilter;
    if (isDefaultFilter) {
      dispatch(setSelectedFilter(response.data));
      dispatch(fetchServiceTaskList(response.data, null, 1, limit));
    } else {
      resetDefaultFilter(response.data.id);
    }
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="sm"
        data-testid="create-filter-modal"
        aria-labelledby={t("create filter modal title")}
        aria-describedby="create-filter-modal"
      >
        <Modal.Header>
          <Modal.Title id="create-filter-title">
            <p>{`${t("Tasks")}: ${
              filterToEdit && !isUnsavedFilter
                ? filterToEdit.name //need to check if it is unsaved or not
                : "Unsaved Filter"
            }`}</p>
          </Modal.Title>
          <div className="icon-close" onClick={onClose}>
            <CloseIcon />
          </div>
        </Modal.Header>

        <TaskFilterModalBody
          toggleDeleteModal={toggleDeleteModal}
          toggleUpdateModal={toggleUpdateModal}
          deleteSuccess={deleteSuccess}
          updateSuccess={updateSuccess}
          showTaskFilterMainModal={show}
          closeTaskFilterMainModal={onClose}
          filterToEdit={filterToEdit}
          handleFilterUpdate={handleFilterUpdate}
        />
      </Modal>

      {showDeleteModal && (
        <ConfirmModal
          show={showDeleteModal}
          title={t("Delete This Filter?")}
          message={
            <CustomInfo
              className="note"
              heading="Note"
              content={(filterToEdit.users.length>0) ? t("This action cannot be undone."): 
                t(
                "This filter is shared with others. Deleting this filter will delete it for everybody and might affect their workflow."
              )}
              dataTestId="task-filter-delete-note"
            />
          }
          primaryBtnAction={toggleDeleteModal}
          onClose={toggleDeleteModal}
          primaryBtnText={t("No, Keep This Filter")}
          secondaryBtnText={(filterToEdit.users.length>0) ? t("Yes, Delete This Filter"): t("Yes, Delete This Filter For Everybody")  }
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
          primaryBtnAction={toggleUpdateModal}
          onClose={toggleUpdateModal}
          primaryBtnText={t("No, Cancel Changes")}
          secondaryBtnText={t("Yes, Update This Filter For Everybody")}
          secondaryBtnAction={()=>{handleFilterUpdate();}}
          secondoryBtndataTestid="confirm-revert-button"
        />
      )}
    </>
  );
};

export default TaskFilterModal;
