import Modal from "react-bootstrap/Modal";
import {
  CloseIcon,
  PromptModal,
  useSuccessCountdown,
  V8CustomButton,
} from "@formsflow/components";
import { useTranslation } from "react-i18next";
import TaskFilterModalBody from "./TaskFilterModalBody";
import { batch, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
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

  const filterToEdit = useSelector((state: any) => state.task.filterToEdit);
  const filterList = useSelector((state: RootState) => state.task.filterList);
  const filterListAndCount =  useSelector((state:RootState)=>state.task.filtersAndCount);
  const defaultFilter = useSelector(
    (state: RootState) => state.task.defaultFilter
  );
  const limit = useSelector((state: RootState) => state.task.limit);
  const [currentStep, setCurrentStep] = useState(1);
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
  const deleteMessage = (t("Deleting a filter is permanent and cannot be undone."));

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
    // Close only the confirm dialog; keep the main modal hidden to avoid flash
    setShowDeleteModal(false);
    await deleteFilter(filterToEdit?.id);
    const newFilters = filterList.filter((i) => i.id !== filterToEdit?.id);
    // Close immediately to prevent the Task Filter modal from displaying briefly
    onClose?.();
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

  // Always start at step 1 when opening or switching to edit a filter
  useEffect(() => {
    if (show || filterToEdit?.id) {
      setCurrentStep(1);
    }
  }, [show, filterToEdit?.id]);
  

  return (
    <>
     <Modal
  show={show}
  onHide={onClose}
  size="lg"
  centered
  dialogClassName="task-filter-modal-popover"
  data-testid="create-filter-modal"
  aria-labelledby={t("create filter modal title")}
  aria-describedby="create-filter-modal"
>
    <Modal.Header>
    <div className="modal-header-content">
    <div className="modal-title">
        {filterToEdit?.id  ? t(`Edit Custom Filter > ${filterToEdit.name}`)  : t("Create Custom Filter")} 
        <CloseIcon color="var(--gray-darkest)" onClick={onClose}/>
        </div>

        <div className="d-flex justify-content-between align-items-center modal-subtitle" >
          <div className="subtitle-text">
            {currentStep === 1 &&
            t("Select a form you want your custom filter to apply to")}
            {currentStep === 2 &&
            t(
              "Select and order the columns you would like to see in your custom filter and choose how the results are sorted"
            )}
            {currentStep === 3 &&
            t("Name your custom filter and choose who you can see it")}
          </div>
          {filterToEdit?.id && filterToEdit?.name !== "All Tasks" && (
            <V8CustomButton
              secondary
              label={t("Delete filter")}
              onClick={toggleDeleteModal}
              dataTestId="header-delete-filter"
              ariaLabel={t("Delete filter")}
              variant="warning"
            />
          )}
        </div>
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
    currentStep={currentStep}
    onStepChange={setCurrentStep}
  />
</Modal>


      {showDeleteModal && (
        <PromptModal
          show={showDeleteModal}
          onClose={toggleDeleteModal}
          title={t("Delete Filter")}
          message={deleteMessage}
          type="error"
          primaryBtnText={t("Delete")}
          primaryBtnAction={handleFilterDelete}
          secondaryBtnText={t("Cancel")}
          secondaryBtnAction={toggleDeleteModal}
        />        
      )}

     
    </>
  );
};

export default TaskFilterModal;
