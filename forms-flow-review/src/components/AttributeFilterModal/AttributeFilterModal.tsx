import Modal from "react-bootstrap/Modal";
import { CloseIcon, ConfirmModal, CustomInfo, useSuccessCountdown } from "@formsflow/components";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { batch, useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import AttributeFilterModalBody from "./AttributeFIlterModalBody";
import { useState } from "react";
import {
  deleteFilter,
  fetchServiceTaskList,
  updateFilter,
} from "../../api/services/filterServices";
import { setAttributeFilterList, setSelectedBpmAttributeFilter } from "../../actions/taskActions";

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
  const title = `${t("Fields")}: ${
    attributeFilterToEdit && !isUnsavedAttributeFilter
      ? attributeFilterToEdit.name //need to check if it is unsaved or not
      : t("Unsaved Filter")
  }`;
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { successState:updateSuccess, startSuccessCountdown:setUpdateSuccess } = useSuccessCountdown();
  const { successState:deleteSuccess, startSuccessCountdown:setDeleteSuccess} = useSuccessCountdown();
  const attributeFilterList = useSelector((state:RootState)=>state.task.attributeFilterList);
  const selectedTaskFilter = useSelector((state:RootState)=>state.task.selectedFilter );
  
   interface handleSaveFilterAttributes {
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
            <b>{title}</b>
          </Modal.Title>
          <div className="d-flex align-items-center">
            <CloseIcon onClick={onClose} />
          </div>
        </Modal.Header>
        <AttributeFilterModalBody
          onClose={onClose}
          updateSuccess={updateSuccess}
          deleteSuccess={deleteSuccess}
          toggleUpdateModal={toggleUpdateModal}
          toggleDeleteModal={toggleDeleteModal}
          handleSaveFilterAttributes={handleSaveFilterAttributes}
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
          secondaryBtnAction={() => {handleSaveFilterAttributes();}}
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
              content={(attributeFilterToEdit.users.length>0) ? t("This action cannot be undone."): 
                t(
                "This filter is shared with others. Deleting this filter will delete it for everybody and might affect their workflow."
              )}
              dataTestId="attribute-filter-delete-note"
            />
          }
          primaryBtnAction={toggleDeleteModal}
          onClose={toggleDeleteModal}
          primaryBtnText={t("No, Keep This Filter")}
          secondaryBtnText={(attributeFilterToEdit.users.length>0) ? t("Yes, Delete This Filter"): t("Yes, Delete This Filter For Everybody")  }
          secondaryBtnAction={handleDeleteAttributeFilter}
          secondoryBtndataTestid="confirm-revert-button"
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
