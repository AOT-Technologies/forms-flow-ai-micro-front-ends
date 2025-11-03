import Modal from "react-bootstrap/Modal";
import { CloseIcon, ConfirmModal, CustomInfo, PromptModal, useSuccessCountdown, V8CustomButton } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { batch, useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import AttributeFilterModalBody from "./AttributeFIlterModalBody";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  deleteFilter,
  fetchServiceTaskList,
  updateFilter,
} from "../../api/services/filterServices";
import { setAttributeFilterList, setSelectedBpmAttributeFilter } from "../../actions/taskActions";
import { StyleServices } from "@formsflow/service";

export const AttributeFilterModal = ({ show, onClose, toggleModal }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const attributeFilterToEdit = useSelector(
    (state: RootState) => state.task.attributeFilterToEdit
  );
  const limit = useSelector((state: RootState) => state.task.limit);
  const isUnsavedAttributeFilter = useSelector(
    (state: RootState) => state.task.isUnsavedAttributeFilter
  );
  // const title = `${t("Fields")}: ${
  //   attributeFilterToEdit && !isUnsavedAttributeFilter
  //     ? attributeFilterToEdit.name //need to check if it is unsaved or not
  //     : t("Unsaved Filter")
  // }`;

  const isEditing = !!attributeFilterToEdit && !isUnsavedAttributeFilter;
  const title = useMemo(() => (
    isEditing ? t("Edit custom field filter") : t("Create custom field filter")
  ), [isEditing, t]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { successState:updateSuccess, startSuccessCountdown:setUpdateSuccess } = useSuccessCountdown();
  const { successState:deleteSuccess, startSuccessCountdown:setDeleteSuccess} = useSuccessCountdown();
  const attributeFilterList = useSelector((state:RootState)=>state.task.attributeFilterList);
  const selectedTaskFilter = useSelector((state:RootState)=>state.task.selectedFilter );
  const darkColor = StyleServices.getCSSVariable("--secondary-dark");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSubtitles = {
    1: t("Choose the parameters of your custom field filter"),
    2: t("Name your custom field filter and choose who can see it"),
  };
  
  const subtitle = pageSubtitles[currentPage];

  // Reset to first page when modal opens
  useEffect(() => {
    if (show) {
      setCurrentPage(1);
    }
  }, [show]);
  
   interface handleSaveFilterAttributes {
    isPrivate?: boolean;
    data?: any;
  }
  const toggleUpdateModal = useCallback(() => {
    toggleModal();
    setShowUpdateModal((prev) => !prev);
  }, [toggleModal]);


    
  const toggleDeleteModal = useCallback(() => {
    toggleModal();
    setShowDeleteModal((prev) => !prev);
  }, [toggleModal]);

  const handleSaveFilterAttributes = async (isPrivate?: boolean, data?: any) => {  
    if(!isPrivate)toggleUpdateModal();
    const payload = data ?? attributeFilterToEdit;
    const response = await updateFilter(
      payload,
      payload?.id
    );
    setUpdateSuccess(onClose, 2);
    const filterList = attributeFilterList.filter((item) => item.id !== response.data.id);
    dispatch(setSelectedBpmAttributeFilter(response.data));
    const newAttributeFilterList = [response.data, ...filterList];
    dispatch(setAttributeFilterList(newAttributeFilterList));
    dispatch(fetchServiceTaskList(response.data, null, 1, limit));
  };

  const handleDeleteAttributeFilter = async()=>{
    toggleDeleteModal();
    await deleteFilter(attributeFilterToEdit?.id);
    const newFilters = attributeFilterList.filter(i=>i.id !== attributeFilterToEdit?.id);
    setDeleteSuccess(onClose,2);
    batch(()=>{
    dispatch(setAttributeFilterList(newFilters));
    dispatch(setSelectedBpmAttributeFilter(null));
    dispatch(fetchServiceTaskList(selectedTaskFilter,null,1,limit))
    })
  }

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        data-testid="create-filter-modal"
        aria-labelledby={t("create filter modal title")}
        aria-describedby="create-filter-modal"
        dialogClassName="attribute-filter-modal"
      >
        <Modal.Header>
          <div className="modal-header-content">
            <Modal.Title id="create-filter-title">
              {title}
              <div onClick={onClose}>
                <CloseIcon color={darkColor} data-testid="close-icon" />
              </div>
            </Modal.Title>

            {subtitle && (
              <div className="modal-subtitle d-flex align-items-center justify-content-between">
                {subtitle}
                {attributeFilterToEdit?.id && (
                  <V8CustomButton
                    label={t("Delete Filter")}
                    onClick={toggleDeleteModal}
                    variant="warning"
                    dataTestId="delete-button"
                    ariaLabel={t("Delete Filter")}
                  />
                )}
              </div>
            )}
          </div>
        </Modal.Header>
        <AttributeFilterModalBody
          onClose={onClose}
          updateSuccess={updateSuccess}
          deleteSuccess={deleteSuccess}
          toggleUpdateModal={toggleUpdateModal}
          toggleDeleteModal={toggleDeleteModal}
          handleSaveFilterAttributes={handleSaveFilterAttributes}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
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
          primaryBtnAction={toggleUpdateModal}
          onClose={toggleUpdateModal}
          primaryBtnText={t("No, Cancel Changes")}
          secondaryBtnText={t("Yes, Update This Filter For Everybody")}
          secondaryBtnAction={() => {
            handleSaveFilterAttributes();
          }}
          secondoryBtndataTestid="confirm-attribute-revert-button"
        />
      )}
      {showDeleteModal && (
        <PromptModal
          type="warning"
          show={showDeleteModal}
          title={t("Delete Filter")}
          message="Deleting a filter is permanent and cannot be undone."
          primaryBtnAction={toggleDeleteModal}
          onClose={toggleDeleteModal}
          primaryBtnText={t("Cancel")}
          secondaryBtnText={t("Delete")}
          secondaryBtnAction={handleDeleteAttributeFilter}
          secondoryBtndataTestid="delete-button"
          primaryBtndataTestid="cancel-button"
          primaryBtnariaLabel="Cancel"
          secondaryBtnariaLabel="Delete"
        />
      )}
    </>
  );
};

AttributeFilterModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AttributeFilterModal;
